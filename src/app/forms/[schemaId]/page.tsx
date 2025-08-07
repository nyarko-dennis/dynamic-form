"use client"

import { useEffect, useState } from "react"
import { getSchemaById } from "@/lib/schema-service"
import { FormSchema } from "@/components/dynamic-form-generator"
import { MultiStepForm } from "@/components/multi-step-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
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
import { use } from "react"

export default function DynamicFormPage({ params }: { params: { schemaId: string } }) {
  const unwrappedParams = use(params);
  const [schema, setSchema] = useState<FormSchema | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadSchema() {
      try {
        const loadedSchema = await getSchemaById(unwrappedParams.schemaId)
        setSchema(loadedSchema)
      } catch (error) {
        console.error("Error loading schema:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSchema()
  }, [unwrappedParams.schemaId])

  const handleSubmit = (data: Record<string, unknown>) => {
    console.log("Form submitted:", data)
    // Here you would typically send the data to your backend
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
                  <BreadcrumbPage>{schema?.formTitle || 'Loading Form...'}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {isLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ) : !schema ? (
            <Card>
              <CardHeader>
                <CardTitle>Form Not Found</CardTitle>
                <CardDescription>
                  The requested form could not be found. It may have been deleted or the ID is incorrect.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <MultiStepForm schema={schema} />
              </CardContent>
            </Card>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}