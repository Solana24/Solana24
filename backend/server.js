import dotenv from "dotenv"
import express from "express"
import cors from "cors"
import multer from "multer"
import FormData from "form-data"
import axios from "axios"
import { Connection, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { createTokenTransaction } from "./createTokenTransaction.js" 

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ message: 'Solana Token Creator API is running' })
})

const upload = multer({ storage: multer.memoryStorage() })

const allowedOrigins = [
  process.env.FRONTEND_URL || "YOUR_FRONTEND_URL",
]

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = "The CORS policy for this site does not allow access from the specified Origin."
      return callback(new Error(msg), false)
    }
    return callback(null, true)
  },
  credentials: true,
  optionsSuccessStatus: 200,
}

const PINATA_API_KEY = process.env.PINATA_API_KEY
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY

const DEVELOPER_WALLET = new PublicKey("PUT_IN_SERVER_WALLET_ADDRESS")
const FEE_FOR_REVOKE = 0.1 * LAMPORTS_PER_SOL

// 환경변수에서 서버 keypair 불러오기
const SERVER_KEYPAIR = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(process.env.SERVER_KEYPAIR))
)

const connection = new Connection(
  "https://api.devnet.solana.com", // DEVNET
  "confirmed"
) // ENDPOINT URL

// Pinata 업로드 함수
async function uploadToPinata(jsonData) {
  const url = "https://api.pinata.cloud/pinning/pinJSONToIPFS"
  try {
    const res = await axios.post(url, jsonData, {
      headers: {
        "Content-Type": "application/json",
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_API_KEY,
      },
    })
    const ipfsUri = `ipfs://${res.data.IpfsHash}`
    console.log("Pinata responded with IpfsHash:", res.data.IpfsHash)
    console.log("Returning URI:", ipfsUri)
    return ipfsUri // ipfs://<CID> 형식으로 반환
  } catch (error) {
    console.error("Error uploading to Pinata:", error)
    throw error
  }
}

// 이미지 업로드 엔드포인트
app.post("/api/upload-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file uploaded." })
    }

    const formData = new FormData()
    formData.append("file", req.file.buffer, { filename: req.file.originalname })
    formData.append("pinataMetadata", JSON.stringify({ name: req.file.originalname }))
    formData.append("pinataOptions", JSON.stringify({ cidVersion: 0 }))

    const pinataRes = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
      maxBodyLength: Number.POSITIVE_INFINITY,
      headers: {
        ...formData.getHeaders(),
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_API_KEY,
      },
    })

    if (pinataRes.status !== 200 && pinataRes.status !== 201) {
      return res.status(500).json({ error: "Pinata upload failed" })
    }

    const ipfsHash = pinataRes.data.IpfsHash
    const imageUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`
    return res.json({ imageUrl })
  } catch (error) {
    console.error("Error uploading image:", error.response ? error.response.data : error.message)
    return res.status(500).json({ error: error.message })
  }
})

// 토큰 생성 트랜잭션 생성 엔드포인트
app.post("/api/create-token-transaction", async (req, res) => {
  try {
    const { publicKey } = req.body

    if (!publicKey) {
      return res.status(400).json({ error: "Public key is required" })
    }

    // Validate publicKey
    let userPublicKey
    try {
      userPublicKey = new PublicKey(publicKey)
    } catch (error) {
      return res.status(400).json({ error: "Invalid public key. Must be in Base58 format." })
    }

    console.log("Received publicKey:", publicKey)

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: userPublicKey,
        toPubkey: DEVELOPER_WALLET,
        lamports: FEE_FOR_REVOKE,
      })
    )

    transaction.feePayer = userPublicKey
    transaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash

    const serializedTransaction = transaction.serialize({ requireAllSignatures: false })
    const base64Transaction = serializedTransaction.toString("base64")

    res.json({ transaction: base64Transaction })
  } catch (error) {
    console.error("Error creating token transaction:", error)
    res.status(500).json({ error: error.message })
  }
})

// 토큰 생성 및 메타데이터 계정 연결 엔드포인트
app.post("/api/confirm-transaction", async (req, res) => {
  try {
    const {
      signedTransaction,
      name,
      symbol,
      decimals,
      supply,
      description,
      imageUrl,
      revokeFreeze,
      revokeMint,
    } = req.body

    // 1. `signedTransaction` 유효성 검증
    let recoveredTransaction
    try {
      recoveredTransaction = Transaction.from(Buffer.from(signedTransaction, "base64"))
    } catch (error) {
      throw new Error("Invalid signedTransaction: Must be Base64 encoded.")
    }
    
    // 2. 트랜잭션 내용 확인 (디버깅용)
    console.log("Recovered transaction:", recoveredTransaction)
    
    // 3. 트랜잭션에 포함된 PublicKey 주소 유효성 검사
    const { feePayer } = recoveredTransaction
    if (!feePayer || !feePayer.toBase58) {
      throw new Error("Invalid transaction: Missing or invalid feePayer.")
    }
    if (!isBase58(feePayer.toBase58())) {
      throw new Error("Invalid transaction: feePayer is not a valid Base58 PublicKey.")
    }

    // createTokenTransaction.js 모듈 호출
    const result = await createTokenTransaction({
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
    })

    res.json(result)
  } catch (error) {
    console.error("Error in /api/confirm-transaction:", error)
    res.status(500).json({ error: error.message })
  }
})

// Base58 검증 함수
function isBase58(value) {
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/ // Base58 알파벳만 허용
  return base58Regex.test(value)
}

// 서버 실행
const PORT = process.env.PORT || 3001
app.use((err, req, res, next) => {
  console.error("Error:", err.stack)
  res.status(500).json({
    error: "Something went wrong!",
    message: err.message,
  })
})
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log("Allowed Origins:", allowedOrigins)
})

app.use(cors(corsOptions))
