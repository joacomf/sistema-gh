"use client"

import { useState, useRef } from "react"

interface ImporteInputProps {
  value: number
  onChange: (value: number) => void
  className?: string
  placeholder?: string
  required?: boolean
  autoFocus?: boolean
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
}

export function formatImporte(value: number): string {
  if (!value && value !== 0) return ""
  return value.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function Importe({ value, className }: { value: number; className?: string }) {
  return <span className={className}>$ {formatImporte(value)}</span>
}

function parseImporte(str: string): number {
  // Strip thousands separators (.) then replace decimal comma with dot
  const normalized = str.replace(/\./g, "").replace(",", ".")
  const num = parseFloat(normalized)
  return isNaN(num) ? 0 : num
}

export default function ImporteInput({
  value,
  onChange,
  className,
  placeholder = "0,00",
  required,
  autoFocus,
  onKeyDown,
}: ImporteInputProps) {
  const [focused, setFocused] = useState(false)
  const [inputStr, setInputStr] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFocus = () => {
    setFocused(true)
    setInputStr(value > 0 ? String(value).replace(".", ",") : "")
  }

  const handleBlur = () => {
    setFocused(false)
    onChange(parseImporte(inputStr))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const str = e.target.value
    // Allow digits, comma, dot only
    if (/^[\d.,]*$/.test(str)) {
      setInputStr(str)
      onChange(parseImporte(str))
    }
  }

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      required={required}
      autoFocus={autoFocus}
      value={focused ? inputStr : formatImporte(value)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={handleChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      className={className}
    />
  )
}
