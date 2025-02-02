import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom"
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react"
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui"
import { clusterApiUrl } from "@solana/web3.js"

export const phantomWallet = new PhantomWalletAdapter()

export const endpoint = clusterApiUrl("devnet")

export async function connectWallet() {
  try {
    await phantomWallet.connect()
    return phantomWallet.publicKey?.toString()
  } catch (error) {
    console.error("Error connecting wallet:", error)
    throw error
  }
}

export async function disconnectWallet() {
  try {
    await phantomWallet.disconnect()
  } catch (error) {
    console.error("Error disconnecting wallet:", error)
    throw error
  }
}

