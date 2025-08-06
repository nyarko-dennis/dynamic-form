"use client"

import React, { useState } from "react"
import { FormSchema } from "@/components/dynamic-form-generator"
import { Button } from "@/components/ui/button"
import { DynamicFormGenerator } from "@/components/dynamic-form-generator"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

interface MultiStepFormProps {
  schema: FormSchema
}

export function MultiStepForm({ schema }: MultiStepFormProps) {
  // State to track the current step
  const [currentStep, setCurrentStep] = useState(0)
  // State to store form data across steps
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  
  // Create sections array from schema
  const sections = schema.sections || []
  
  // Create a schema for the current step only
  const getCurrentStepSchema = (): FormSchema => {
    if (!sections.length) {
      return schema
    }
    
    return {
      formTitle: schema.formTitle,
      formDescription: schema.formDescription,
      sections: [sections[currentStep]],
    }
  }
  
  // Handle form submission for each step
  const handleStepSubmit = (data: Record<string, unknown>) => {
    // Merge the new data with existing form data
    const updatedFormData = { ...formData, ...data }
    setFormData(updatedFormData)
    
    // If this is the last step, submit the entire form
    if (currentStep === sections.length - 1) {
      console.log("Form submitted:", updatedFormData)
      // Here you would typically send the data to your backend
      
      // Show a success message or redirect
      alert("Form submitted successfully!")
    } else {
      // Otherwise, move to the next step
      setCurrentStep(currentStep + 1)
    }
  }
  
  // Handle going back to the previous step
  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }
  
  // Calculate progress percentage
  const progress = sections.length ? ((currentStep + 1) / sections.length) * 100 : 100
  
  return (
    <div className="space-y-6 max-w-4xl mx-auto bg-white/50 backdrop-blur-sm p-6 rounded-lg shadow-md">
      <div>
        <h2 className="text-2xl font-bold">{schema.formTitle}</h2>
        <p className="text-muted-foreground">{schema.formDescription}</p>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      {/* Step indicator */}
      <div className="flex justify-between mb-4 overflow-x-auto pb-2">
        {sections.map((section, index) => (
          <div 
            key={index} 
            className={`flex flex-col items-center mx-2 ${index <= currentStep ? 'text-blue-600' : 'text-gray-400'}`}
          >
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                index < currentStep 
                  ? 'bg-blue-600 text-white' 
                  : index === currentStep 
                    ? 'border-2 border-blue-600 text-blue-600' 
                    : 'border-2 border-gray-300 text-gray-400'
              }`}
            >
              {index < currentStep ? '✓' : index + 1}
            </div>
            <span className="text-xs text-center max-w-[80px] truncate" title={section.title}>{section.title}</span>
          </div>
        ))}
      </div>
      
      {/* Current step form */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-medium mb-4">{sections[currentStep]?.title || 'Form'}</h3>
        {sections[currentStep]?.description && (
          <p className="text-sm text-muted-foreground mb-6">{sections[currentStep].description}</p>
        )}
        <DynamicFormGenerator 
          schema={getCurrentStepSchema()} 
          onSubmit={handleStepSubmit}
          initialData={formData}
        />
        
        {/* Navigation buttons */}
        <div className="flex justify-between mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevStep}
            disabled={currentStep === 0}
            className="px-6"
          >
            ← Previous
          </Button>
          
          <Button
            type="submit"
            form="dynamic-form" // This needs to match the form id in DynamicFormGenerator
            className="px-6"
          >
            {currentStep === sections.length - 1 ? 'Submit' : 'Next →'}
          </Button>
        </div>
      </div>
    </div>
  )
}