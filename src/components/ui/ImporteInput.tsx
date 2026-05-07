"use client"

import { useState, useRef, useLayoutEffect } from "react"

// ─── Display helpers ────────────────────────────────────────────────────────

export function formatImporte(value: number): string {
  if (!value && value !== 0) return ""
  return value.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function Importe({ value, className }: { value: number; className?: string }) {
  return <span className={className}>$ {formatImporte(value)}</span>
}

// ─── Internal formatting/parsing ────────────────────────────────────────────

function formatWhileTyping(raw: string): string {
  if (!raw) return ""

  // Only comma is decimal separator; dots are thousands (auto-added) or user noise
  const commaIdx = raw.lastIndexOf(",")

  let intStr: string
  let decStr: string | undefined

  if (commaIdx !== -1) {
    intStr = raw.slice(0, commaIdx).replace(/\D/g, "")
    decStr = raw.slice(commaIdx + 1).replace(/\D/g, "").slice(0, 2)
  } else {
    intStr = raw.replace(/\D/g, "")
  }

  // Strip leading zeros
  if (intStr.length > 1) intStr = intStr.replace(/^0+/, "") || "0"

  const intFormatted = intStr ? intStr.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ""

  return decStr !== undefined ? `${intFormatted},${decStr}` : intFormatted
}

function parseImporte(str: string): number {
  const normalized = str.replace(/\./g, "").replace(",", ".")
  const num = parseFloat(normalized)
  return isNaN(num) ? 0 : num
}

// Given the raw input value and where the cursor was, return the cursor position
// in the newly formatted string.
function computeCursor(raw: string, rawCursor: number, formatted: string): number {
  const rawBefore = raw.slice(0, rawCursor)
  const endsWithComma = rawBefore.endsWith(",")
  const digitsBeforeCursor = rawBefore.replace(/\D/g, "").length

  if (digitsBeforeCursor === 0 && !endsWithComma) return 0

  let digitCount = 0
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i])) {
      digitCount++
      if (digitCount === digitsBeforeCursor) {
        if (endsWithComma) {
          const commaPos = formatted.indexOf(",")
          return commaPos !== -1 ? commaPos + 1 : i + 1
        }
        return i + 1
      }
    }
  }

  return formatted.length
}

// ─── Component ───────────────────────────────────────────────────────────────

interface ImporteInputProps {
  value: number
  onChange: (value: number) => void
  className?: string
  placeholder?: string
  required?: boolean
  autoFocus?: boolean
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
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
  const pendingCursor = useRef<number | null>(null)

  // Restore cursor synchronously after each render caused by onChange
  useLayoutEffect(() => {
    if (pendingCursor.current !== null && inputRef.current) {
      inputRef.current.setSelectionRange(pendingCursor.current, pendingCursor.current)
      pendingCursor.current = null
    }
  })

  const handleFocus = () => {
    setFocused(true)
    setInputStr(value > 0 ? formatImporte(value) : "")
  }

  const handleBlur = () => {
    setFocused(false)
    onChange(parseImporte(inputStr))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value
    const rawCursor = e.target.selectionStart ?? raw.length

    if (!/^[\d.,]*$/.test(raw)) return

    // If user typed a new dot (numpad decimal key) and there's no comma yet,
    // convert that dot to comma. Detect by counting dots vs previous value.
    const prevDots = (inputStr.match(/\./g) || []).length
    const newDots = (raw.match(/\./g) || []).length
    if (!inputStr.includes(",") && newDots > prevDots) {
      raw = raw.replace(/\.([^.]*)$/, ",$1")
    }

    const formatted = formatWhileTyping(raw)
    pendingCursor.current = computeCursor(raw, rawCursor, formatted)
    setInputStr(formatted)
    onChange(parseImporte(formatted))
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
