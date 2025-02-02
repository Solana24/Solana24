import type React from "react"
import type { TextareaHTMLAttributes } from "react"

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea: React.FC<TextareaProps> = ({ className, ...props }) => {
  return (
    <textarea
      className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 focus:outline-none focus:ring-[hsl(147,80%,73%)] focus:border-[hsl(147,80%,73%)] sm:text-sm ${className || ""}`}
      {...props}
    />
  )
}

