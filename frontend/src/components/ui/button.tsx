import type React from "react"
import type { ButtonHTMLAttributes } from "react"

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline"
  size?: "default" | "sm" | "lg"
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = "default",
  size = "default",
  ...props
}) => {
  const baseStyles = "font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2"
  const variantStyles = {
    default: "bg-[hsl(147,80%,73%)] text-black hover:bg-[hsl(147,80%,63%)] focus:ring-[hsl(147,80%,73%)]",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-[hsl(147,80%,73%)]",
  }
  const sizeStyles = {
    default: "px-4 py-2",
    sm: "px-3 py-1.5 text-sm",
    lg: "px-6 py-3 text-lg",
  }

  const buttonClasses = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className || ""}`

  return (
    <button className={buttonClasses} {...props}>
      {children}
    </button>
  )
}

