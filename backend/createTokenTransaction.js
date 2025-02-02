import { PublicKey, Transaction } from "@solana/web3.js";
import { 
  createMint, 
  getOrCreateAssociatedTokenAccount, 
  mintTo, 
  setAuthority, 
  AuthorityType 
} from "@solana/spl-token";
import { createCreateMetadataAccountV3Instruction } from "@metaplex-foundation/mpl-token-metadata";

// 간단한 딜레이 함수
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ATA(Associated Token Account) 조회 및 생성에 재시도 로직을 추가한 함수
async function waitForTokenAccount(connection, mint, owner, payer, retries = 7, delayMs = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      // getOrCreateAssociatedTokenAccount 호출 시 commitment를 "confirmed"로 지정
      const tokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        payer,           // 비용 부담: 서버 키페어
        mint,
        owner,           // 소유자: 클라이언트 계정 (예: recoveredTransaction.feePayer)
        false,           // allowOwnerOffCurve (필요에 따라 true로 변경 가능)
        "confirmed"      // commitment를 "confirmed"로 설정
      );
      return tokenAccount;
    } catch (error) {
      console.warn(`Attempt ${i + 1} to get ATA failed: ${error.message}`);
      // 에러 객체 전체를 출력해 상세 원인 파악 (필요시 JSON.stringify 사용)
      console.error("Error details:", error);
      await delay(delayMs);
    }
  }
  throw new Error("Failed to retrieve or create associated token account after multiple attempts.");
}

/**
 * SPL 토큰 및 메타데이터 계정을 생성하고 연결합니다.
 */
export async function createTokenTransaction({
  connection,
  SERVER_KEYPAIR,
  signedTransaction,
  name,
  symbol,
  decimals,
  supply,
  description,
  imageUrl,
  revokeFreeze,
  revokeMint,
  uploadToPinata,
}) {
  try {
    // 1. 서명된 트랜잭션 복원 및 전송
    const recoveredTransaction = Transaction.from(Buffer.from(signedTransaction, "base64"));
    console.log("Recovered transaction:", recoveredTransaction);

    const signature = await connection.sendRawTransaction(recoveredTransaction.serialize());
    await connection.confirmTransaction(signature, "confirmed");
    console.log("Confirmed transaction signature:", signature);

    // 2. SPL 토큰 생성
    const mint = await createMint(
      connection,
      SERVER_KEYPAIR,
      SERVER_KEYPAIR.publicKey, // Mint authority
      SERVER_KEYPAIR.publicKey, // Freeze authority
      decimals
    );
    console.log("Mint created:", mint.toBase58());

    // 3. 사용자 ATA 생성 (재시도 및 딜레이 적용)
    const tokenAccount = await waitForTokenAccount(
      connection,
      mint,
      recoveredTransaction.feePayer, // 소유자: 클라이언트 계정
      SERVER_KEYPAIR              // 비용 부담: 서버 키페어
    );
    console.log("Token account created:", tokenAccount.address.toBase58());

    // 4. 토큰 발행 (mintTo)
    try {
      await mintTo(
        connection,
        SERVER_KEYPAIR,
        mint,
        tokenAccount.address,
        SERVER_KEYPAIR,
        supply * Math.pow(10, decimals)
      );
      console.log(`Minted ${supply} tokens to account:`, tokenAccount.address.toBase58());
    } catch (mintError) {
      console.error("Error during mintTo:", mintError);
      // SendTransactionError인 경우, 로그가 포함되어 있을 수 있으므로 출력합니다.
      if (mintError.transactionLogs) {
        console.error("Transaction logs:", mintError.transactionLogs);
      }
      throw mintError;
    }

    // 5. Pinata에 JSON 메타데이터 업로드
    const metadata = { name, symbol, description, image: imageUrl };
    const metadataUri = await uploadToPinata(metadata);
    console.log("Metadata uploaded to Pinata:", metadataUri);

    // 6. 메타데이터 계정 생성
    const metadataProgramId = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
    const [metadataAccount] = await PublicKey.findProgramAddress(
      [Buffer.from("metadata"), metadataProgramId.toBuffer(), mint.toBuffer()],
      metadataProgramId
    );
    console.log("Metadata account address:", metadataAccount.toBase58());
    
    // 메타데이터 구조 설정
    const metadataData = {
      name,
      symbol,
      uri: metadataUri.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/"),
      sellerFeeBasisPoints: 0,
      creators: [
        {
          address: new PublicKey(recoveredTransaction.feePayer), // 클라이언트의 주소
          verified: false, // 클라이언트는 verified가 false
          share: 100      // 100% 로열티
        }
      ],
      collection: null,
      uses: null,
    };
    console.log("Debugging creators:", metadataData.creators);
    
    const instruction = createCreateMetadataAccountV3Instruction(
      {
        metadata: metadataAccount,
        mint,
        mintAuthority: SERVER_KEYPAIR.publicKey,
        payer: SERVER_KEYPAIR.publicKey,
        updateAuthority: SERVER_KEYPAIR.publicKey,
      },
      {
        createMetadataAccountArgsV3: {
          data: metadataData,
          isMutable: true,
          collectionDetails: null,
        },
      }
    );
    
    const metadataTx = new Transaction().add(instruction);
    metadataTx.feePayer = SERVER_KEYPAIR.publicKey;
    metadataTx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;

    const metadataSignature = await connection.sendTransaction(metadataTx, [SERVER_KEYPAIR]);
    await connection.confirmTransaction(metadataSignature, "confirmed");
    console.log("Metadata transaction confirmed:", metadataSignature);

    // 7. 권한 철회 (옵션)
    if (revokeFreeze) {
      await setAuthority(
        connection,
        SERVER_KEYPAIR,
        mint,
        SERVER_KEYPAIR.publicKey,
        AuthorityType.FreezeAccount,
        null
      );
      console.log("Freeze authority revoked for mint:", mint.toBase58());
    }
    if (revokeMint) {
      await setAuthority(
        connection,
        SERVER_KEYPAIR,
        mint,
        SERVER_KEYPAIR.publicKey,
        AuthorityType.MintTokens,
        null
      );
      console.log("Mint authority revoked for mint:", mint.toBase58());
    }

    return {
      success: true,
      mintAddress: mint.toBase58(),
      tokenAccount: tokenAccount.address.toBase58(),
      metadataUri,
      transactionSignature: signature,
    };
  } catch (error) {
    console.error("Error in createTokenTransaction:", error);
    // 에러가 SendTransactionError 등인 경우, 추가 로그 출력
    if (error.transactionLogs) {
      console.error("Transaction logs:", error.transactionLogs);
    }
    throw error;
  }
}
