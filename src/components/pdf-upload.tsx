"use client"

import {useState} from "react"
import {Dropzone, FileWithPreview} from "@/components/ui/dropzone"
import {Button} from "@/components/ui/button"
import {toast} from "sonner"

export function PdfUpload({onSchemaGenerated}: {
    onSchemaGenerated: (schema: Record<string, unknown>, filename: string) => void
}) {
    const [files, setFiles] = useState<FileWithPreview[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const handleUpload = async () => {
        if (!files.length) {
            toast.error("No file selected", {
                description: "Please select a PDF file to upload",
            })
            return
        }

        const file = files[0]

        // Check if the file is a PDF
        if (file.type !== 'application/pdf') {
            toast.error("Invalid file type", {
                description: "Please select a PDF file to upload. Current file type: " + file.type,
            })
            return
        }

        try {
            setIsLoading(true)

            const response = await fetch("https://mvp-3-555954816336.europe-west1.run.app/generate_pdf_schema", {
                method: "POST",
                body: file,
                headers: {
                    'Content-Type': 'application/pdf',
                }
            })

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`)
            }

            const schema = await response.json()

            // Extract filename without extension for schema file naming
            const filename = file.name.replace(/\.[^/.]+$/, "")

            // Pass the schema and filename to the parent component
            onSchemaGenerated(schema, filename)

            toast.success("Schema generated successfully", {
                description: `Form schema created from ${file.name}`,
            })
        } catch (error) {
            console.error("Error uploading PDF:", error)
            toast.error("Error generating schema", {
                description: error instanceof Error ? error.message : "Failed to generate schema from PDF",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-4">
            <Dropzone
                value={files}
                onChange={setFiles}
                maxFiles={1}
                maxSize={10 * 1024 * 1024} // 10MB
                accept={{
                    'application/pdf': ['.pdf']
                }}
                dropzoneText="Drag and drop a PDF form here, or click to select"
            />

            <Button
                onClick={handleUpload}
                disabled={!files.length || isLoading}
                className="w-full"
            >
                {isLoading ? "Generating Schema..." : "Generate Form Schema"}
            </Button>
        </div>
    )
}