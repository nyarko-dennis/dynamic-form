"use client"

import React, { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

export interface FileWithPreview extends File {
  preview?: string
}

export interface DropzoneProps {
  value?: FileWithPreview[]
  onChange: (files: FileWithPreview[]) => void
  maxFiles?: number
  maxSize?: number
  accept?: Record<string, string[]>
  disabled?: boolean
  className?: string
  dropzoneText?: string
}

export function Dropzone({
  value = [],
  onChange,
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024, // 5MB default
  accept,
  disabled = false,
  className,
  dropzoneText = "Drag and drop files here, or click to select files",
}: DropzoneProps) {
  const [files, setFiles] = useState<FileWithPreview[]>(value)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Create preview URLs for the files
      const filesWithPreviews = acceptedFiles.map((file) => 
        Object.assign(file, {
          preview: URL.createObjectURL(file)
        })
      ) as FileWithPreview[]

      // Combine with existing files, respecting maxFiles
      const newFiles = [...files, ...filesWithPreviews].slice(0, maxFiles)
      
      setFiles(newFiles)
      onChange(newFiles)
    },
    [files, maxFiles, onChange]
  )

  const removeFile = (index: number) => {
    const newFiles = [...files]
    
    // Revoke the preview URL to avoid memory leaks
    if (newFiles[index]?.preview) {
      URL.revokeObjectURL(newFiles[index].preview!)
    }
    
    newFiles.splice(index, 1)
    setFiles(newFiles)
    onChange(newFiles)
  }

  const { getRootProps, getInputProps, isDragActive, isDragReject, fileRejections } = useDropzone({
    onDrop,
    maxFiles,
    maxSize,
    accept,
    disabled,
  })

  // Clean up preview URLs when component unmounts
  React.useEffect(() => {
    return () => {
      files.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview)
        }
      })
    }
  }, [files])

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-md p-6 cursor-pointer transition-colors",
          "flex flex-col items-center justify-center text-center",
          isDragActive && "border-primary bg-primary/10",
          isDragReject && "border-destructive bg-destructive/10",
          disabled && "cursor-not-allowed opacity-60",
          className
        )}
      >
        <input {...getInputProps()} />
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {isDragActive ? "Drop the files here..." : dropzoneText}
          </p>
          <p className="text-xs text-muted-foreground">
            Max {maxFiles} file{maxFiles !== 1 ? "s" : ""}, up to {Math.round(maxSize / 1024 / 1024)}MB each
          </p>
        </div>
      </div>

      {fileRejections.length > 0 && (
        <div className="text-sm text-destructive">
          {fileRejections.map(({ file, errors }) => (
            <div key={file.name} className="mt-1">
              <strong>{file.name}</strong>: {errors.map(e => e.message).join(', ')}
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {files.map((file, index) => (
            <div key={index} className="relative border rounded-md p-2 flex items-center gap-2">
              {file.type.startsWith("image/") && file.preview ? (
                <div className="h-12 w-12 rounded-md overflow-hidden flex-shrink-0">
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="h-full w-full object-cover"
                    onLoad={() => { URL.revokeObjectURL(file.preview!) }}
                  />
                </div>
              ) : (
                <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium uppercase">{file.name.split('.').pop()}</span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => removeFile(index)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Remove file</span>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}