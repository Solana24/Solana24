"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"

export function DarkModeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="fixed z-50 top-4 left-4">
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className={`
          relative flex items-center w-40 h-12 rounded-full transition-colors duration-300 shadow-lg
          ${theme === "dark" ? "bg-gray-900 text-white" : "bg-yellow-400 text-gray-900"}
        `}
      >
        {/* Sliding circle with icon */}
        <div
          className={`
            absolute w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center
            transition-transform duration-500 ease-in-out
            ${theme === "dark" ? "transform translate-x-28" : "transform translate-x-1"}
          `}
        >
          {theme === "dark" ? <Moon className="w-6 h-6 text-gray-900" /> : <Sun className="w-6 h-6 text-yellow-400" />}
        </div>

        {/* Text labels with smaller font size */}
        <span
          className={`
            absolute w-full text-center font-bold text-sm transition-opacity duration-500
            ${theme === "dark" ? "opacity-100 left-0" : "opacity-0 left-0"}
          `}
        >
          NIGHTMODEㅤㅤ
        </span>
        <span
          className={`
            absolute w-full text-center font-bold text-sm transition-opacity duration-500
            ${theme === "dark" ? "opacity-0 left-0" : "opacity-100 left-0"}
          `}
        >
          ㅤDAYMODE
        </span>
      </button>
    </div>
  )
}

