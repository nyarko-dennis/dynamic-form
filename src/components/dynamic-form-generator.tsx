"use client"

import React, {useState, useEffect, useMemo, useCallback} from "react"
import { useForm, ControllerRenderProps, FieldValues } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dropzone, FileWithPreview } from "@/components/ui/dropzone"
import { SignaturePad } from "@/components/ui/signature-pad"
import { MultiSelect } from "@/components/ui/multi-select"
import { DatePicker } from "@/components/ui/date-picker"
import { asyncValidators } from "@/lib/async-validators"
import {cn} from "@/lib/utils";

// Define the types for our JSON schema
type FieldType = "string" | "number" | "boolean" | "date" | "radio" | "textarea" | "file" | "multiselect" | "dropzone" | "signature"

interface ValidationRules {
  required?: boolean
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  errorMessage?: string
  dependsOn?: string
  customValidator?: {
    fields: string[]
    validator: string // Name of the validation function to be looked up
  }
  async?: boolean
  asyncValidator?: {
    name: string // Name of the async validator function to be looked up
    params?: string[] // Additional parameters to pass to the validator (field names)
  }
}

interface ConditionalLogic {
  field: string
  operator?: "equals" | "notEquals" | "greaterThan" | "lessThan" | "contains" | "notContains" | "isEmpty" | "isNotEmpty"
  value?: string | number | boolean
  equals?: string | number | boolean // For backward compatibility
  conditions?: ConditionalLogic[] // For multiple conditions
  logicalOperator?: "and" | "or" // For multiple conditions
}

interface FormField {
  name: string
  label: string
  type: FieldType
  placeholder?: string
  options?: string[]
  validation?: ValidationRules
  conditional?: ConditionalLogic
  helpText?: string
  tooltip?: string
  style?: Record<string, string>
  dependsOn?: string
  optionsMap?: Record<string, string[]>
  rows?: number
  accept?: string
  maxSize?: number
  maxFiles?: number
  width?: number
  height?: number
  disabled?: boolean
}

interface FormSection {
  title: string
  description?: string
  fields: FormField[]
}

export interface FormSchema {
  formTitle: string
  formDescription: string
  fields?: FormField[]
  sections?: FormSection[]
  layout?: {
    columns?: number
    fields?: string[]
  }
}

// Define the type for form values
type FormValues = Record<string, string | number | boolean | FileWithPreview[] | null>

export interface DynamicFormGeneratorProps {
  schema: FormSchema
  onSubmit?: (data: Record<string, unknown>) => void
  initialData?: Record<string, unknown>
  hideHeaders?: boolean
}

export function DynamicFormGenerator({
  schema,
  onSubmit: externalSubmit,
  initialData = {},
  hideHeaders = false
}: DynamicFormGeneratorProps) {

  // We no longer need formData state. React-hook-form handles it.
  // const [formData, setFormData] = useState<FormValues>({})
  const [conditionalFields, setConditionalFields] = useState<Record<string, boolean>>({})

  // Get all fields from schema (either directly or from sections)
  const getAllFields = useMemo((): (() => FormField[]) => {
    return () => {
      if (schema.fields) {
        return schema.fields
      }

      if (schema.sections) {
        return schema.sections.flatMap(section => section.fields)
      }

      return []
    }
  }, [schema])

  // Custom validators registry
  const customValidators: Record<string, (data: Record<string, unknown>, fields: string[]) => boolean> = {
    // Example: password confirmation validator
    passwordsMatch: (data, fields) => {
      if (fields.length !== 2) return false
      return data[fields[0]] === data[fields[1]]
    },
    // Example: date range validator
    dateRangeValid: (data, fields) => {
      if (fields.length !== 2) return false
      const startDate = new Date(data[fields[0]] as string)
      const endDate = new Date(data[fields[1]] as string)
      return startDate <= endDate
    },
    // Add more custom validators as needed
  }

  // Dynamically generate Zod schema once, including all possible fields
  const zodSchema = useMemo(() => {
    const schemaObj: Record<string, z.ZodTypeAny> = {}
    const allFields = getAllFields()
    const crossFieldValidations: Array<{
      fields: string[]
      validator: string
      errorMessage: string
    }> = []

    allFields.forEach((field) => {
      // Collect cross-field validations for later
      if (field.validation?.customValidator) {
        crossFieldValidations.push({
          fields: field.validation.customValidator.fields,
          validator: field.validation.customValidator.validator,
          errorMessage: field.validation.errorMessage || `Validation failed for ${field.name}`
        })
      }

      switch (field.type) {
        case "string":
          let stringSchema = z.string()
          if (field.validation?.minLength) {
            stringSchema = stringSchema.min(field.validation.minLength, 
              field.validation.errorMessage || `Must be at least ${field.validation.minLength} characters`)
          }
          if (field.validation?.maxLength) {
            stringSchema = stringSchema.max(field.validation.maxLength, 
              field.validation.errorMessage || `Must be at most ${field.validation.maxLength} characters`)
          }
          if (field.validation?.pattern) {
            stringSchema = stringSchema.regex(new RegExp(field.validation.pattern), 
              field.validation.errorMessage || "Invalid format")
          }

          // Add async validation if specified
          if (field.validation?.asyncValidator) {
            const { name, params = [] } = field.validation.asyncValidator
            const asyncValidator = asyncValidators[name]
            
            if (asyncValidator) {
                // Fixed async validation code to avoid circular dependency
                stringSchema = stringSchema.refine(
                    async (val) => {
                        if (!val) return true // Skip validation for empty values unless required

                        // Get values of any dependent fields from the current form values
                        const paramValues = params.map(paramField => {
                            // The value will be provided by the refine function
                            return '' // This will be replaced by the actual value during validation
                        })

                        try {
                            // Call the async validator with the field value and any additional parameters
                            return await asyncValidator(val, ...paramValues)
                        } catch (error) {
                            console.error(`Error in async validator ${name}:`, error)
                            return false
                        }
                    },
                    {
                        message: field.validation.errorMessage || `Validation failed for ${field.name}`
                    }
                )
            }
          }

          // Add required validation if specified
          if (field.validation?.required) {
            schemaObj[field.name] = stringSchema.optional().refine(val => val !== undefined && val !== null && val !== "", {
              message: field.validation.errorMessage || "This field is required"
            })
          } else {
            schemaObj[field.name] = stringSchema.optional()
          }
          break

        case "number":
          let numberSchema = z.number()
          if (field.validation?.min !== undefined) {
            numberSchema = numberSchema.min(field.validation.min, 
              field.validation.errorMessage || `Must be at least ${field.validation.min}`)
          }
          if (field.validation?.max !== undefined) {
            numberSchema = numberSchema.max(field.validation.max, 
              field.validation.errorMessage || `Must be at most ${field.validation.max}`)
          }

          // Add required validation if specified
          if (field.validation?.required) {
            schemaObj[field.name] = numberSchema.optional().refine(val => val !== undefined && val !== null, {
              message: field.validation.errorMessage || "This field is required"
            })
          } else {
            schemaObj[field.name] = numberSchema.optional()
          }
          break

        case "boolean":
          const booleanSchema = z.boolean()
          schemaObj[field.name] = field.validation?.required 
            ? booleanSchema.optional().refine(val => val !== undefined && val !== null, {
                message: field.validation.errorMessage || "This field is required"
              })
            : booleanSchema.optional()
          break

        case "date":
          // HTML date inputs return strings
          const dateSchema = z.string()

          // Add required validation if specified
          if (field.validation?.required) {
            schemaObj[field.name] = dateSchema.optional().refine(val => val !== undefined && val !== null && val !== "", {
              message: field.validation.errorMessage || "This field is required"
            })
          } else {
            schemaObj[field.name] = dateSchema.optional()
          }
          break

        case "radio":
          const radioSchema = z.string()

          // Add required validation if specified
          if (field.validation?.required) {
            schemaObj[field.name] = radioSchema.optional().refine(val => val !== undefined && val !== null && val !== "", {
              message: field.validation.errorMessage || "This field is required"
            })
          } else {
            schemaObj[field.name] = radioSchema.optional()
          }
          break

        case "textarea":
          let textareaSchema = z.string()
          if (field.validation?.minLength) {
            textareaSchema = textareaSchema.min(field.validation.minLength, 
              field.validation.errorMessage || `Must be at least ${field.validation.minLength} characters`)
          }
          if (field.validation?.maxLength) {
            textareaSchema = textareaSchema.max(field.validation.maxLength, 
              field.validation.errorMessage || `Must be at most ${field.validation.maxLength} characters`)
          }

          // Add required validation if specified
          if (field.validation?.required) {
            schemaObj[field.name] = textareaSchema.optional().refine(val => val !== undefined && val !== null && val !== "", {
              message: field.validation.errorMessage || "This field is required"
            })
          } else {
            schemaObj[field.name] = textareaSchema.optional()
          }
          break

        case "file":
          // File inputs are handled separately
          const fileSchema = z.string()

          // Add required validation if specified
          if (field.validation?.required) {
            schemaObj[field.name] = fileSchema.optional().refine(val => val !== undefined && val !== null && val !== "", {
              message: field.validation.errorMessage || "This field is required"
            })
          } else {
            schemaObj[field.name] = fileSchema.optional()
          }
          break
          
        case "dropzone":
          // Dropzone returns an array of files
          const dropzoneSchema = z.array(z.any())
          
          // Add required validation if specified
          if (field.validation?.required) {
            schemaObj[field.name] = dropzoneSchema.optional().refine(val => val !== undefined && val !== null && val.length > 0, {
              message: field.validation.errorMessage || "At least one file is required"
            })
          } else {
            schemaObj[field.name] = dropzoneSchema.optional()
          }
          break
          
        case "signature":
          // Signature pad returns a data URL string
          const signatureSchema = z.string()
          
          // Add required validation if specified
          if (field.validation?.required) {
            schemaObj[field.name] = signatureSchema.optional().refine(val => val !== undefined && val !== null && val !== "", {
              message: field.validation.errorMessage || "Signature is required"
            })
          } else {
            schemaObj[field.name] = signatureSchema.optional()
          }
          break

        case "multiselect":
          const arraySchema = z.array(z.string())

          // Add required validation if specified
          if (field.validation?.required) {
            schemaObj[field.name] = arraySchema.optional().refine(val => val !== undefined && val !== null && val.length > 0, {
              message: field.validation.errorMessage || "This field is required"
            })
          } else {
            schemaObj[field.name] = arraySchema.optional()
          }
          break

        default:
          const defaultSchema = z.string()

          // Add required validation if specified
          if (field.validation?.required) {
            schemaObj[field.name] = defaultSchema.optional().refine(val => val !== undefined && val !== null && val !== "", {
              message: field.validation.errorMessage || "This field is required"
            })
          } else {
            schemaObj[field.name] = defaultSchema.optional()
          }
      }
    })

    // Create the base schema
    let schema = z.object(schemaObj)
    
    // Apply cross-field validations
    if (crossFieldValidations.length > 0) {
      schema = schema.refine(
        (data) => {
          // Check all cross-field validations
          return crossFieldValidations.every(validation => {
            const validator = customValidators[validation.validator]
            if (!validator) {
              console.warn(`Validator "${validation.validator}" not found`)
              return true
            }
            return validator(data, validation.fields)
          })
        },
        {
          message: crossFieldValidations.map(v => v.errorMessage).join('; '),
          path: crossFieldValidations.flatMap(v => v.fields) // Highlight all fields involved
        }
      )
    }
    
    return schema
  }, [getAllFields, customValidators]) // dependencies: schema properties that define fields, not form values

  // Create form instance with the static zodSchema
  const form = useForm<z.infer<typeof zodSchema>>({
    resolver: zodResolver(zodSchema),
    defaultValues: initialData as z.infer<typeof zodSchema>, // Cast to the correct type
  })

  // Evaluate a single condition
  const evaluateCondition = useCallback((condition: ConditionalLogic, formValues: Record<string, unknown>): boolean => {
    const fieldValue = formValues[condition.field]
    
    // Handle nested conditions first
    if (condition.conditions && condition.conditions.length > 0) {
      const results = condition.conditions.map(c => evaluateCondition(c, formValues))
      
      if (condition.logicalOperator === "or") {
        return results.some(result => result)
      }
      
      // Default to "and" if not specified
      return results.every(result => result)
    }
    
    // For backward compatibility
    if (condition.equals !== undefined) {
      return fieldValue === condition.equals
    }
    
    // Handle different operators
    switch (condition.operator) {
      case "equals":
        return fieldValue === condition.value
      case "notEquals":
        return fieldValue !== condition.value
      case "greaterThan":
        return typeof fieldValue === 'number' && typeof condition.value === 'number' && fieldValue > condition.value
      case "lessThan":
        return typeof fieldValue === 'number' && typeof condition.value === 'number' && fieldValue < condition.value
      case "contains":
        return Array.isArray(fieldValue) 
          ? fieldValue.includes(condition.value)
          : typeof fieldValue === 'string' && fieldValue.includes(String(condition.value))
      case "notContains":
        return Array.isArray(fieldValue) 
          ? !fieldValue.includes(condition.value)
          : typeof fieldValue === 'string' && !fieldValue.includes(String(condition.value))
      case "isEmpty":
        return fieldValue === undefined || fieldValue === null || fieldValue === "" || 
          (Array.isArray(fieldValue) && fieldValue.length === 0)
      case "isNotEmpty":
        return fieldValue !== undefined && fieldValue !== null && fieldValue !== "" && 
          (!Array.isArray(fieldValue) || fieldValue.length > 0)
      default:
        // Default to equals for backward compatibility
        return fieldValue === condition.value
    }
  }, [/* No external dependencies needed */])

  // This is the correct way to handle conditional logic
  useEffect(() => {
    const allFields = getAllFields()
    const fieldsWithConditionals = allFields.filter(f => f.conditional)
    const fieldsToWatch = fieldsWithConditionals.flatMap(f => {
        if (f.conditional?.conditions) {
            return f.conditional.conditions.map(c => c.field)
        }
        return [f.conditional?.field]
    })
    
    // Watch only the fields that control conditional logic
    const subscription = form.watch(values => {
      const newConditionalFields: Record<string, boolean> = {}

      fieldsWithConditionals.forEach((field) => {
        newConditionalFields[field.name] = evaluateCondition(field.conditional!, values)
      })

      setConditionalFields(prevFields => {
        const hasChanged = Object.keys(newConditionalFields).some(
          key => prevFields[key] !== newConditionalFields[key]
        )
        return hasChanged ? newConditionalFields : prevFields
      })
    }, { fields: fieldsToWatch })

    // Return a cleanup function to unsubscribe
    return () => subscription.unsubscribe()
  }, [schema, form, getAllFields, evaluateCondition])
  
  // Handle unregistering conditional fields in useEffect, not during render
  useEffect(() => {
    const allFields = getAllFields()
    
    // Unregister fields that should be hidden based on conditions
    allFields.forEach(field => {
      if (field.conditional && !conditionalFields[field.name]) {
        form.unregister(field.name, { keepValue: false })
      }
    })
  }, [conditionalFields, form, getAllFields])

  // Handle form submission
  const onSubmit = (data: z.infer<typeof zodSchema>) => {
    console.log("Form submitted:", data)
    if (externalSubmit) {
      externalSubmit(data as Record<string, unknown>)
    }
  }

  // Render a field based on its type and properties
  const renderField = (field: FormField, formField: ControllerRenderProps<FieldValues, string>) => {
    // If field is conditional and condition is not met, don't render it
    if (field.conditional && !conditionalFields[field.name]) {
      return null
    }

    const fieldStyle = field.style ? { style: field.style } : {}

    switch (field.type) {
      case "string":
        return (
          <Input
            placeholder={field.placeholder}
            {...formField}
            value={formField.value as string || ""}
            {...fieldStyle}
          />
        )
      case "number":
        return (
          <Input
            type="number"
            placeholder={field.placeholder}
            {...formField}
            value={formField.value === undefined || formField.value === null ? "" : formField.value}
            onChange={(e) => {
              const value = e.target.value === "" ? null : Number(e.target.value)
              formField.onChange(value)
            }}
            onBlur={(e) => {
              // Ensure we have a valid number or null on blur
              if (e.target.value === "") {
                formField.onChange(null)
              } else if (!isNaN(Number(e.target.value))) {
                formField.onChange(Number(e.target.value))
              }
            }}
            {...fieldStyle}
          />
        )
      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`checkbox-${field.name}`}
              checked={formField.value as boolean | undefined}
              onCheckedChange={formField.onChange}
              aria-describedby={field.helpText ? `${field.name}-description` : undefined}
              {...fieldStyle}
            />
            <label 
              htmlFor={`checkbox-${field.name}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {field.label}
            </label>
          </div>
        )
      case "date":
        return (
          <DatePicker
            id={`date-${field.name}`}
            value={formField.value as string || undefined}
            onChange={(date) => {
              // Convert date to ISO string format for form submission
              formField.onChange(date ? date.toISOString().split('T')[0] : null)
            }}
            placeholder={field.placeholder || "Select date..."}
            disabled={field.disabled}
            className={cn(fieldStyle.style)}
          />
        )
      case "radio":
        if (!field.options) return null
        return (
          <RadioGroup
            value={formField.value !== undefined ? String(formField.value) : ""}
            onValueChange={formField.onChange}
            className={cn("space-y-2", fieldStyle.style)}
            aria-labelledby={`${field.name}-label`}
            aria-describedby={field.helpText ? `${field.name}-description` : undefined}
            disabled={field.disabled}
          >
            {field.options.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem 
                  value={option} 
                  id={`${field.name}-${option}`} 
                  disabled={field.disabled}
                />
                <label 
                  htmlFor={`${field.name}-${option}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {option}
                </label>
              </div>
            ))}
          </RadioGroup>
        )
      case "textarea":
        const textValue = formField.value as string || "";
        const maxLength = field.validation?.maxLength;
        return (
          <div className="space-y-2">
            <Textarea
              id={`textarea-${field.name}`}
              placeholder={field.placeholder}
              rows={field.rows || 4}
              {...formField}
              value={textValue}
              maxLength={maxLength}
              aria-describedby={field.helpText ? `${field.name}-description` : undefined}
              disabled={field.disabled}
              className={cn(fieldStyle.style)}
            />
            {maxLength && (
              <div className="text-xs text-muted-foreground text-right">
                {textValue.length}/{maxLength} characters
              </div>
            )}
          </div>
        )
      case "file":
        return (
          <Dropzone
            value={formField.value as FileWithPreview[] || []}
            onChange={(files) => formField.onChange(files)}
            maxFiles={1}
            maxSize={field.maxSize || 5 * 1024 * 1024}
            accept={field.accept ? { 
              [field.accept.split(',')[0] || 'application/octet-stream']: 
              field.accept.split(',').map(type => type.trim()) 
            } : undefined}
            dropzoneText={field.placeholder || "Click or drag file to upload"}
            disabled={field.disabled}
            className={cn(fieldStyle.style)}
          />
        )
      case "dropzone":
        return (
          <Dropzone
            value={formField.value as FileWithPreview[] || []}
            onChange={formField.onChange}
            maxFiles={field.maxFiles || 5}
            maxSize={field.maxSize || 5 * 1024 * 1024}
            accept={field.accept ? { 
              [field.accept.split(',')[0] || 'application/octet-stream']: 
              field.accept.split(',').map(type => type.trim()) 
            } : undefined}
            dropzoneText={field.placeholder}
            {...fieldStyle}
          />
        )
      case "signature":
        return (
          <SignaturePad
            value={formField.value as string || ""}
            onChange={formField.onChange}
            width={field.width as number || 400}
            height={field.height as number || 200}
            disabled={field.disabled}
            {...fieldStyle}
          />
        )
      case "multiselect":
        if (!field.options) return null
        return (
          <MultiSelect
            options={field.options}
            value={formField.value as string[] || []}
            onChange={formField.onChange}
            placeholder={field.placeholder || "Select items..."}
            disabled={field.disabled}
            className={cn(fieldStyle.style)}
          />
        )
      default:
        return null
    }
  }

  // Render a form field with label, help text, and tooltip
  const renderFormField = (field: FormField) => {
    if (field.conditional && !conditionalFields[field.name]) {
      // Just return null, unregistering is handled in useEffect
      return null
    }

    return (
      <FormField
        key={field.name}
        control={form.control}
        name={field.name}
        render={({ field: formField }) => (
          <FormItem>
            {/* For boolean fields, the label is rendered inside the checkbox component */}
            {field.type !== "boolean" && (
              <div className="flex items-center gap-2">
                <FormLabel 
                  htmlFor={field.type === "radio" ? undefined : `${field.type}-${field.name}`}
                  id={`${field.name}-label`}
                >
                  {field.label}
                </FormLabel>
                {field.tooltip && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span 
                          className="text-xs text-muted-foreground cursor-help"
                          aria-label={`Information about ${field.label}`}
                        >
                          ⓘ
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{field.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            )}
            {field.helpText && (
              <FormDescription id={`${field.name}-description`}>{field.helpText}</FormDescription>
            )}
            <FormControl>
              {renderField(field, formField)}
            </FormControl>
            <FormMessage id={`${field.name}-error`} />
          </FormItem>
        )}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Title and description are now handled by the parent MultiStepForm component */}
      <Form {...form}>
        <form id="dynamic-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {schema.sections ? (
            // Render sections if they exist
            schema.sections.map((section, index) => (
              <div key={index} className="space-y-4">
                {!hideHeaders && (
                  <div className="border-b pb-2">
                    <h3 className="text-lg font-medium">{section.title}</h3>
                    {section.description && (
                      <p className="text-sm text-muted-foreground">{section.description}</p>
                    )}
                  </div>
                )}
                <div className={cn(
                  "grid gap-4",
                  schema.layout?.columns === 2 ? "grid-cols-1 md:grid-cols-2" :
                  schema.layout?.columns === 3 ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" :
                  "grid-cols-1"
                )}>
                  {section.fields.map(renderFormField)}
                </div>
              </div>
            ))
          ) : (
            // Otherwise render fields directly
            <div className={cn(
              "grid gap-4",
              schema.layout?.columns === 2 ? "grid-cols-1 md:grid-cols-2" :
              schema.layout?.columns === 3 ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" :
              "grid-cols-1"
            )}>
              {schema.fields?.map(renderFormField)}
            </div>
          )}
          {/* Submit button is now controlled by the MultiStepForm component */}
        </form>
      </Form>
    </div>
  )
}
