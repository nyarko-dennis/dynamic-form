"use client"

import { useState } from "react"
import { PdfUpload } from "@/components/pdf-upload"
import { saveSchema } from "@/lib/schema-service"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FormSchema } from "@/components/dynamic-form-generator"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export default function UploadFormPage() {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSchemaGenerated = async (schema: Record<string, unknown>, filename: string) => {
    try {
      setIsProcessing(true)
      
      // Save the schema to a file
      const schemaId = await saveSchema(schema as unknown as FormSchema, filename)
      
      // Refresh the sidebar to show the new form
      router.refresh()
      
      // Redirect to the new form
      router.push(`/forms/${schemaId}`)
    } catch (error) {
      console.error("Error processing schema:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Upload PDF Form</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Card>
            <CardHeader>
              <CardTitle>Upload PDF Form</CardTitle>
              <CardDescription>
                Upload a PDF form to generate a digital version. The system will analyze the PDF
                and create a form schema that can be used to render a digital form.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PdfUpload onSchemaGenerated={handleSchemaGenerated} />
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}