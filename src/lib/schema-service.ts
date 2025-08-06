import { FormSchema } from "@/components/dynamic-form-generator"

// This would be a server-side function in a real implementation
export async function saveSchema(schema: FormSchema, filename: string): Promise<string> {
  try {
    // In a real implementation, this would be a server-side API call
    // For now, we'll simulate it with a client-side function
    
    // Format the schema ID to be URL-friendly
    const schemaId = filename.toLowerCase().replace(/\s+/g, '-')
    
    // Make a POST request to our API endpoint
    const response = await fetch('/api/schemas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ schema, filename }),
    })
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`)
    }
    
    const data = await response.json()
    return data.id
  } catch (error) {
    console.error("Error saving schema:", error)
    throw new Error("Failed to save schema")
  }
}

export async function getSchemas(): Promise<{ id: string, title: string }[]> {
  try {
    // Fetch all schemas from our API endpoint
    const response = await fetch('/api/schemas')
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error("Error getting schemas:", error)
    return []
  }
}

export async function getSchemaById(id: string): Promise<FormSchema | null> {
  try {
    // Fetch a specific schema by ID
    const response = await fetch(`/api/schema?id=${id}`)
    
    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`Error: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error(`Error getting schema ${id}:`, error)
    return null
  }
}