"use client"

import { useEffect, useState } from "react"
import { FormSchema } from "@/components/dynamic-form-generator"
import { MultiStepForm } from "@/components/multi-step-form"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export default function Page() {
  const [schema, setSchema] = useState<FormSchema | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSchema() {
      try {
        const response = await fetch('/api/schema')
        if (!response.ok) {
          throw new Error('Failed to fetch schema')
        }
        const data = await response.json()
        setSchema(data)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching schema:', err)
        setError('Failed to load form schema. Please try again later.')
        setLoading(false)
      }
    }

    fetchSchema()
  }, [])

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
                  <BreadcrumbPage>Dynamic Form</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {loading && <div className="text-center">Loading form schema...</div>}

          {error && (
            <div className="p-4 border border-red-300 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {schema && <MultiStepForm schema={schema} />}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
