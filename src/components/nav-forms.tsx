"use client"

import { useEffect, useState } from "react"
import { FileText, ChevronRight, Upload } from "lucide-react"
import { getSchemas } from "@/lib/schema-service"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"

export function NavForms() {
  const [forms, setForms] = useState<{ id: string, title: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()
  
  useEffect(() => {
    async function loadForms() {
      try {
        const schemas = await getSchemas()
        setForms(schemas)
      } catch (error) {
        console.error("Error loading forms:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadForms()
  }, [])
  
  const isFormsActive = pathname.startsWith("/forms")
  
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Forms</SidebarGroupLabel>
      <SidebarMenu>
        <Collapsible
          asChild
          defaultOpen={isFormsActive}
          className="group/collapsible"
        >
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton tooltip="Forms">
                <FileText />
                <span>Forms</span>
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton asChild>
                    <a href="/forms/upload">
                      <Upload className="mr-2 h-4 w-4" />
                      <span>Upload New Form</span>
                    </a>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
                
                {isLoading ? (
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton disabled>
                      <span>Loading forms...</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ) : forms.length === 0 ? (
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton disabled>
                      <span>No forms available</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ) : (
                  forms.map((form) => (
                    <SidebarMenuSubItem key={form.id}>
                      <SidebarMenuSubButton asChild>
                        <a href={`/forms/${form.id}`}>
                          <span>{form.title}</span>
                        </a>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))
                )}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      </SidebarMenu>
    </SidebarGroup>
  )
}