import type React from "react"

export interface SwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  id?: string
  disabled?: boolean
}

export const Switch: React.FC<SwitchProps> = ({ checked, onCheckedChange, id, disabled = false }) => {
  return (
    <label htmlFor={id} className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        id={id}
        className="sr-only peer"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        disabled={disabled}
      />
      <div
        className={`
        h-6 w-11 rounded-full transition-colors duration-200
        ${checked ? "bg-[hsl(147,80%,73%)]" : "bg-gray-300"}
        ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
        peer-focus:outline-none
      `}
      >
        <div
          className={`
          h-5 w-5 transform rounded-full bg-white transition-transform duration-200
          ${checked ? "translate-x-1" : "translate-x-5"}
          mt-0.5
          ${disabled ? "cursor-not-allowed" : "cursor-pointer"}
        `}
        />
      </div>
    </label>
  )
}

