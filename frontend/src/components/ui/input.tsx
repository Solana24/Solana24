import type React from "react"
import type { InputHTMLAttributes } from "react"

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input: React.FC<InputProps> = ({ className, ...props }) => {
  return (
    <input
      className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 focus:outline-none focus:ring-[hsl(147,80%,73%)] focus:border-[hsl(147,80%,73%)] sm:text-sm ${className || ""}`}
      {...props}
    />
  )
}

