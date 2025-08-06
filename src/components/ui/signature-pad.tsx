"use client"

import React, { useEffect, useRef, useState } from "react"
import SignaturePadLib from "signature_pad"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface SignaturePadProps {
  value?: string
  onChange: (signature: string) => void
  width?: number
  height?: number
  disabled?: boolean
  className?: string
  penColor?: string
  backgroundColor?: string
  clearButtonText?: string
}

export function SignaturePad({
  value = "",
  onChange,
  width = 400,
  height = 200,
  disabled = false,
  className,
  penColor = "#000000",
  backgroundColor = "#ffffff",
  clearButtonText = "Clear",
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const signaturePadRef = useRef<SignaturePadLib | null>(null)
  const [isEmpty, setIsEmpty] = useState(true)

  // Initialize signature pad
  useEffect(() => {
    if (!canvasRef.current) return

    // Set canvas dimensions
    const canvas = canvasRef.current
    const ratio = Math.max(window.devicePixelRatio || 1, 1)
    canvas.width = width * ratio
    canvas.height = height * ratio
    canvas.getContext("2d")?.scale(ratio, ratio)

    // Create signature pad instance
    const signaturePad = new SignaturePadLib(canvas, {
      penColor,
      backgroundColor,
    })

    // Load existing signature if provided
    if (value) {
      signaturePad.fromDataURL(value)
      setIsEmpty(signaturePad.isEmpty())
    }

    // Set up event handlers
    signaturePad.addEventListener("endStroke", () => {
      if (!disabled) {
        const dataUrl = signaturePad.toDataURL()
        onChange(dataUrl)
        setIsEmpty(signaturePad.isEmpty())
      }
    })

    signaturePadRef.current = signaturePad

    return () => {
      signaturePad.off()
    }
  }, [width, height, penColor, backgroundColor, disabled, onChange, value])

  // Handle clear button click
  const handleClear = () => {
    if (signaturePadRef.current && !disabled) {
      signaturePadRef.current.clear()
      onChange("")
      setIsEmpty(true)
    }
  }

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "border rounded-md overflow-hidden",
          disabled && "opacity-60 cursor-not-allowed",
          className
        )}
        style={{ width, height }}
      >
        <canvas
          ref={canvasRef}
          className={cn(
            "w-full h-full cursor-crosshair",
            disabled && "cursor-not-allowed"
          )}
          style={{ touchAction: "none" }}
        />
      </div>
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClear}
          disabled={disabled || isEmpty}
        >
          {clearButtonText}
        </Button>
      </div>
    </div>
  )
}