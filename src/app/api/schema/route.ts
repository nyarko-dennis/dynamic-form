import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { FormSchema } from '@/components/dynamic-form-generator'

export async function GET(request: Request) {
  try {
    // Get the schema ID from the query parameter
    const url = new URL(request.url)
    const schemaId = url.searchParams.get('id') || 'form-270'
    
    // Validate the schema ID to prevent directory traversal attacks
    if (!/^[a-zA-Z0-9-]+$/.test(schemaId)) {
      return NextResponse.json(
        { error: 'Invalid schema ID' },
        { status: 400 }
      )
    }
    
    // Read the schema file
    const schemaPath = path.join(process.cwd(), 'src', 'schemas', `${schemaId}.json`)
    
    // Check if the file exists
    if (!fs.existsSync(schemaPath)) {
      return NextResponse.json(
        { error: 'Schema not found' },
        { status: 404 }
      )
    }
    
    const schemaData = fs.readFileSync(schemaPath, 'utf8')
    const schema = JSON.parse(schemaData) as FormSchema

    // Return the schema as JSON
    return NextResponse.json(schema)
  } catch (error) {
    console.error('Error reading schema file:', error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { error: 'Failed to load schema' },
      { status: 500 }
    )
  }
}
