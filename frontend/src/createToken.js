import axios from "axios"
import { Transaction } from "@solana/web3.js"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "YOUR_SERVER_URL" // backend 

console.log("API URL:", API_URL) // Add this line for debugging

export async function uploadImage(file) {
  const formData = new FormData()
  formData.append("image", file)

  try {
    console.log("Uploading image to:", `${API_URL}/api/upload-image`) // Add this line for debugging
    const response = await axios.post(`${API_URL}/api/upload-image`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })

    console.log("Uploaded Image URL:", response.data.imageUrl)
    return response.data.imageUrl
  } catch (error) {
    console.error("Error uploading image:", error.response ? error.response.data : error.message)
    throw new Error("Failed to upload image.")
  }
}

export async function handleCreateToken(tokenData) {
  try {
    // Get the wallet provider
    const provider = window.solana
    if (!provider) {
      throw new Error("Wallet not found")
    }

    // Request wallet connection
    await provider.connect()
    const publicKey = provider.publicKey

    console.log("Creating token transaction:", `${API_URL}/api/create-token-transaction`) // Add this line for debugging
    const createTransactionResponse = await axios.post(
      `${API_URL}/api/create-token-transaction`,
      { publicKey: publicKey.toBase58() },
      { headers: { "Content-Type": "application/json" } },
    )

    const transactionBase64 = createTransactionResponse.data.transaction
    const transaction = Transaction.from(Buffer.from(transactionBase64, "base64"))

    // Request signature from user
    const signedTransaction = await provider.signTransaction(transaction)
    const serializedTransaction = signedTransaction.serialize()

    console.log("Confirming transaction:", `${API_URL}/api/confirm-transaction`) // Add this line for debugging
    const confirmResponse = await axios.post(
      `${API_URL}/api/confirm-transaction`,
      {
        signedTransaction: serializedTransaction.toString("base64"),
        ...tokenData,
      },
      { headers: { "Content-Type": "application/json" } },
    )

    if (confirmResponse.data.success) {
      return confirmResponse.data
    } else {
      throw new Error(confirmResponse.data.error)
    }
  } catch (error) {
    console.error("Error creating token:", error.response ? error.response.data : error.message)
    throw error
  }
}

