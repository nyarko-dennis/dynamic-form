"use client"

import React, { useState, useEffect } from "react"
import { FormSchema } from "@/components/dynamic-form-generator"
import { MultiStepForm } from "@/components/multi-step-form"

export default function TestDropzonePage() {
  const [schema, setSchema] = useState<FormSchema | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSchema = async () => {
      try {
        const response = await fetch('/api/schema?id=form-270')
        if (!response.ok) {
          throw new Error(`Failed to fetch schema: ${response.status}`)
        }
        const data = await response.json()
        setSchema(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
        console.error('Error fetching schema:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSchema()
  }, [])

  if (loading) {
    return <div className="p-8">Loading form schema...</div>
  }

  if (error) {
    return <div className="p-8 text-red-500">Error: {error}</div>
  }

  if (!schema) {
    return <div className="p-8">No schema found</div>
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Dropzone Component Test</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <MultiStepForm schema={schema} />
      </div>
    </div>
  )
}