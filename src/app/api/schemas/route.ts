import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { FormSchema } from '@/components/dynamic-form-generator'

// GET /api/schemas - Get all schemas
export async function GET() {
  try {
    const schemasDir = path.join(process.cwd(), 'src', 'schemas')
    
    // Ensure the directory exists
    if (!fs.existsSync(schemasDir)) {
      fs.mkdirSync(schemasDir, { recursive: true })
    }
    
    // Read all schema files
    const files = fs.readdirSync(schemasDir)
    const schemas = files
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const schemaId = file.replace('.json', '')
        const schemaPath = path.join(schemasDir, file)
        const schemaData = fs.readFileSync(schemaPath, 'utf8')
        const schema = JSON.parse(schemaData) as FormSchema
        
        return {
          id: schemaId,
          title: schema.formTitle || `Form ${schemaId}`
        }
      })
    
    return NextResponse.json(schemas)
  } catch (error) {
    console.error('Error reading schemas:', error)
    return NextResponse.json(
      { error: 'Failed to load schemas' },
      { status: 500 }
    )
  }
}

// POST /api/schemas - Create a new schema
export async function POST(request: Request) {
  try {
    const { schema, filename } = await request.json()
    
    // Validate the schema
    if (!schema || !schema.formTitle) {
      return NextResponse.json(
        { error: 'Invalid schema' },
        { status: 400 }
      )
    }
    
    // Format the schema ID to be URL-friendly
    const schemaId = (filename || schema.formTitle)
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
    
    // Ensure the schemas directory exists
    const schemasDir = path.join(process.cwd(), 'src', 'schemas')
    if (!fs.existsSync(schemasDir)) {
      fs.mkdirSync(schemasDir, { recursive: true })
    }
    
    // Write the schema to a file
    const schemaPath = path.join(schemasDir, `${schemaId}.json`)
    fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2))
    
    return NextResponse.json({ id: schemaId })
  } catch (error) {
    console.error('Error saving schema:', error)
    return NextResponse.json(
      { error: 'Failed to save schema' },
      { status: 500 }
    )
  }
}