"use client"

import { useState, useRef, useEffect, Dispatch, SetStateAction } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@headlessui/react" // Headless UI Switch로 변경
import { useWallet } from "@solana/wallet-adapter-react"
import dynamic from "next/dynamic"
import axios from "axios"
import { Transaction } from "@solana/web3.js"
import "@solana/wallet-adapter-react-ui/styles.css"
import "./globals.css"

const WalletMultiButtonDynamic = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false },
)

const API_URL = process.env.NEXT_PUBLIC_API_URL || "YOUR_SERVER_URL";
console.log("API_URL:", API_URL);

export default function TokenCreator() {
  const { publicKey, connected } = useWallet()
  const [name, setName] = useState("")
  const [symbol, setSymbol] = useState("")
  const [decimals, setDecimals] = useState("6")
  const [supply, setSupply] = useState("")
  const [description, setDescription] = useState("")
  const [revokeFreeze] = useState(true)
  const [revokeMint, setRevokeMint] = useState(true)
  const [status, setStatus] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [mintAddress, setMintAddress] = useState("")
  const [metadataUri, setMetadataUri] = useState("")

  // 미리보기 URL 정리
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  // 성공 상태 초기화 타이머
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        setIsSuccess(false)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [isSuccess])

  // 토큰 생성 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!connected || !publicKey) {
      setStatus("Please connect your wallet first")
      return
    }
    setIsLoading(true)
    setIsSuccess(false)
    setStatus("")
    try {
      const tokenData = {
        name,
        symbol,
        decimals: Number(decimals),
        supply: Number(supply),
        description,
        revokeFreeze,
        revokeMint,
        publicKey: publicKey.toBase58(),
      }

      let imageUrl = ""
      if (image) {
        const formData = new FormData()
        formData.append("image", image)
        const imageUploadResponse = await axios.post(`${API_URL}/api/upload-image`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        imageUrl = imageUploadResponse.data.imageUrl
      }

      const createTransactionResponse = await axios.post(
        `${API_URL}/api/create-token-transaction`,
        { publicKey: publicKey.toBase58() },
        { headers: { "Content-Type": "application/json" } },
      )

      const transactionBase64 = createTransactionResponse.data.transaction
      const transaction = Transaction.from(Buffer.from(transactionBase64, "base64"))

      const signedTransaction = await window.solana.signTransaction(transaction)
      const serializedTransaction = signedTransaction.serialize()

      const response = await axios.post(
        `${API_URL}/api/confirm-transaction`,
        {
          signedTransaction: serializedTransaction.toString("base64"),
          ...tokenData,
          imageUrl,
        },
        { headers: { "Content-Type": "application/json" } },
      )

      setMintAddress(response.data.mintAddress)
      setMetadataUri(response.data.metadataUri)
      setIsSuccess(true)
    } catch (error: unknown) {
      console.error("Error creating token:", error)

      if (axios.isAxiosError(error) && error.response) {
        // AxiosError인 경우
        setStatus(`Error creating token: ${error.response.data.error || error.message}`)
      } else if (error instanceof Error) {
        // 일반적인 Error 객체인 경우
        setStatus(`Error creating token: ${error.message}`)
      } else {
        // 그 외의 경우
        setStatus(`Error creating token: ${String(error)}`)
      }
    } finally {
      setIsLoading(false)
    }
  } // handleSubmit 함수 닫는 중괄호 추가

  // 파일 업로드 핸들러
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === "image/png") {
      setImage(file)
      // 미리보기 URL 생성
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }
  }

  // 파일 업로드 트리거
  const triggerFileUpload = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-[var(--dark-container)] p-4">
      {/* 지갑 연결 버튼 */}
      <div className="absolute right-4 top-4">
        <WalletMultiButtonDynamic className="!bg-[hsl(147,80%,73%)] dark:!bg-[var(--dark-button-green)] !font-medium !text-black dark:!text-black" />
      </div>

      {/* 메인 컨텐츠 */}
      <div className="w-full max-w-2xl mx-auto">
        <h1 className="mb-2 text-4xl font-bold text-black dark:text-[var(--foreground)] text-center">SOLANA 24</h1>
        <p className="mb-8 text-lg text-center text-gray-700 dark:text-gray-300">𝙉𝙊 𝘾𝙊𝘿𝙀, 𝘾𝙍𝙀𝘼𝙏𝙀 𝙊𝙒𝙉 𝙔𝙊𝙐𝙍 𝙏𝙊𝙆𝙀𝙉</p>

        <div className="p-6 bg-white dark:bg-[var(--dark-container)] border border-gray-200 dark:border-gray-700 shadow-sm rounded-2xl relative">
          {/* 로딩 스피너 */}
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50 rounded-2xl">
              <div className="w-16 h-16 border-4 border-green-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
          )}
          {/* 성공 아이콘 */}
          {isSuccess && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50 rounded-2xl">
              <div className="flex items-center justify-center w-16 h-16 p-2 bg-white rounded-full shadow-lg dark:bg-gray-800 ring-1 ring-slate-900/5 dark:ring-slate-200/20">
                <svg
                  className="w-8 h-8 text-green-500"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            </div>
          )}

          {/* 폼 시작 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 이름과 심볼 입력 */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="name" className="text-black dark:text-[var(--foreground)]">
                  Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 text-black dark:text-white bg-gray-100 dark:bg-[var(--dark-input)] border-gray-200 dark:border-gray-700 placeholder:text-gray-500"
                  required
                />
              </div>
              <div>
                <Label htmlFor="symbol" className="text-black dark:text-[var(--foreground)]">
                  Symbol
                </Label>
                <Input
                  id="symbol"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className="mt-1 text-black dark:text-white bg-gray-100 dark:bg-[var(--dark-input)] border-gray-200 dark:border-gray-700 placeholder:text-gray-500"
                  required
                />
              </div>
            </div>

            {/* 소수점과 공급량 입력 */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="decimals" className="text-black dark:text-[var(--foreground)]">
                    Decimals
                  </Label>
                  <Input
                    id="decimals"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={decimals}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, "")
                      setDecimals(value)
                    }}
                    className="mt-1 text-black dark:text-white bg-gray-100 dark:bg-[var(--dark-input)] border-gray-200 dark:border-gray-700 placeholder:text-gray-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="supply" className="text-black dark:text-[var(--foreground)]">
                    Supply
                  </Label>
                  <Input
                    id="supply"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={supply}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, "")
                      setSupply(value)
                    }}
                    className="mt-1 text-black dark:text-white bg-gray-100 dark:bg-[var(--dark-input)] border-gray-200 dark:border-gray-700 placeholder:text-gray-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    required
                  />
                </div>
              </div>
              {/* 이미지 업로드 */}
              <div>
                <Label htmlFor="image" className="text-black dark:text-[var(--foreground)]">
                  Image
                </Label>
                <div onClick={triggerFileUpload} className="flex flex-col gap-2 mt-1 cursor-pointer">
                  <div className="border border-gray-200 dark:border-gray-700 rounded-md p-2 flex items-center justify-center bg-gray-50 dark:bg-[var(--dark-input)] h-32">
                    {previewUrl ? (
                      <img
                        src={previewUrl || "/placeholder.svg"}
                        alt="Token Preview"
                        className="object-contain w-24 h-24 rounded-md"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                        <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 mb-2" stroke="currentColor">
                          <path
                            d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="text-sm">Upload PNG</span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/png"
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {/* 설명 입력 */}
            <div>
              <Label htmlFor="description" className="text-black dark:text-[var(--foreground)]">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full min-h-[100px] border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-[var(--dark-input)] text-black dark:text-white placeholder:text-gray-500"
              />
            </div>

            {/* 스위치 토글 */}
            <div className="space-y-6">
              {/* Revoke Freeze */}
              <div>
                <div className="flex items-center justify-between h-[24px]">
                  <div className="flex items-center gap-2">
                    <span className="text-black dark:text-[var(--foreground)]">Revoke Freeze</span>
                    <span className="text-sm text-[hsl(147,80%,73%)] dark:text-gray-300">(required)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={true}
                      onChange={() => {}}
                      disabled={true}
                      className={`${
                        true ? "bg-[#81f1b4] dark:bg-[var(--dark-button-green)]" : "bg-gray-200"
                      } relative inline-flex items-center h-6 rounded-full w-11`}
                    >
                      <span
                        className={`transform transition-transform ${
                          true ? "translate-x-6" : "translate-x-1"
                        } inline-block w-4 h-4 bg-white rounded-full`}
                      />
                    </Switch>
                    <span className="text-sm text-gray-500 dark:text-gray-300 min-w-[60px]">( 𝗙𝗥𝗘𝗘 )</span>
                  </div>
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
                  Revoke Freeze allows you to create a liquidity pool
                </p>
              </div>

              {/* Revoke Mint */}
              <div>
                <div className="flex items-center justify-between h-[24px]">
                  <span className="text-black dark:text-[var(--foreground)]">Revoke Mint</span>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={revokeMint}
                      onChange={setRevokeMint}
                      className={`${
                        revokeMint ? "bg-[#81f1b4] dark:bg-[var(--dark-button-green)]" : "bg-gray-200"
                      } relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200`}
                    >
                      <span
                        className={`transform transition-transform ${
                          revokeMint ? "translate-x-6" : "translate-x-1"
                        } inline-block w-4 h-4 bg-white rounded-full`}
                      />
                    </Switch>
                    <span className="text-sm text-gray-500 dark:text-gray-300 min-w-[60px]">(0.1 SOL)</span>
                  </div>
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
                  Mint Authority allows you to increase tokens supply
                </p>
              </div>
            </div>

            {/* 제출 버튼 또는 지갑 연결 버튼 */}
            {!connected ? (
              <WalletMultiButtonDynamic className="!h-12 w-full !bg-[hsl(147,80%,73%)] dark:!bg-[var(--dark-button-green)] !text-black dark:!text-black" />
            ) : (
              <Button
                type="submit"
                className="h-12 w-full bg-[hsl(147,80%,73%)] dark:bg-[var(--dark-button-green)] font-medium text-black dark:text-black hover:bg-[hsl(147,80%,63%)] dark:hover:bg-[var(--dark-button-green)] rounded"
                disabled={isLoading}
              >
                {isLoading ? "Creating Token..." : "Create Token"}
              </Button>
            )}

            {/* 상태 메시지 */}
            {(status || mintAddress) && (
              <div className="p-4 bg-gray-100 dark:bg-[var(--dark-input)] border border-gray-200 dark:border-gray-700 rounded-lg">
                {status ? (
                  <pre className="text-sm text-black dark:text-[var(--foreground)] whitespace-pre-wrap">{status}</pre>
                ) : (
                  <>
                    <p className="text-lg font-semibold text-black dark:text-[var(--foreground)] mb-4 text-center">
                      Token created successfully!
                    </p>
                    <p className="text-sm text-black dark:text-[var(--foreground)]">
                      <strong>Token Address:</strong> {mintAddress}
                    </p>
                    <p className="text-sm text-black dark:text-[var(--foreground)]">
                      <strong>Metadata URI:</strong> {metadataUri}
                    </p>
                  </>
                )}
              </div>
            )}
          </form>
        </div>

        {/* 텔레그램 아이콘 추가 */}
        <a
          href="https://t.me/syoo9015"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-4 right-4 z-50 w-16 h-16 flex items-center justify-center bg-white dark:bg-[#2AABEE] rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          style={{
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)",
          }}
        >
          <div className="w-12 h-12 bg-[#2AABEE] dark:bg-white rounded-full flex items-center justify-center">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg"
              alt="Telegram"
              className="w-7 h-7"
            />
          </div>
        </a>
      </div>
    </div>
  )
}

