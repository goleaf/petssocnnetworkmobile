'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2 } from 'lucide-react'

export type ArticleType = 'breed' | 'health' | 'care-guide' | 'place' | 'org' | 'product' | 'regulation' | 'event'

export interface InfoboxField {
  id: string
  key: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'multiselect' | 'url' | 'image'
  value: string | string[] | number | null
  required?: boolean
  options?: string[] // For select/multiselect
  placeholder?: string
}

export interface InfoboxData {
  [key: string]: string | string[] | number | null
}

interface InfoboxBuilderProps {
  articleType: ArticleType
  data?: InfoboxData
  onChange?: (data: InfoboxData) => void
}

const TEMPLATE_FIELDS: Record<ArticleType, InfoboxField[]> = {
  breed: [
    { id: '1', key: 'name', label: 'Breed Name', type: 'text', value: '', required: true },
    { id: '2', key: 'origin', label: 'Origin', type: 'text', value: '' },
    { id: '3', key: 'size', label: 'Size', type: 'select', value: '', options: ['Small', 'Medium', 'Large', 'Giant'] },
    { id: '4', key: 'lifespan', label: 'Lifespan', type: 'text', value: '', placeholder: 'e.g., 10-15 years' },
    { id: '5', key: 'temperament', label: 'Temperament', type: 'multiselect', value: [], options: ['Friendly', 'Active', 'Calm', 'Protective', 'Intelligent'] },
    { id: '6', key: 'grooming', label: 'Grooming Needs', type: 'select', value: '', options: ['Low', 'Medium', 'High'] },
    { id: '7', key: 'exercise', label: 'Exercise Needs', type: 'select', value: '', options: ['Low', 'Medium', 'High'] },
    { id: '8', key: 'description', label: 'Description', type: 'textarea', value: '' },
  ],
  health: [
    { id: '1', key: 'condition', label: 'Condition Name', type: 'text', value: '', required: true },
    { id: '2', key: 'species', label: 'Affected Species', type: 'multiselect', value: [], options: ['Dog', 'Cat', 'Bird', 'Rabbit', 'Other'] },
    { id: '3', key: 'severity', label: 'Severity', type: 'select', value: '', options: ['Mild', 'Moderate', 'Severe', 'Critical'] },
    { id: '4', key: 'symptoms', label: 'Symptoms', type: 'textarea', value: '' },
    { id: '5', key: 'treatment', label: 'Treatment', type: 'textarea', value: '' },
    { id: '6', key: 'prevention', label: 'Prevention', type: 'textarea', value: '' },
  ],
  'care-guide': [
    { id: '1', key: 'title', label: 'Guide Title', type: 'text', value: '', required: true },
    { id: '2', key: 'category', label: 'Category', type: 'select', value: '', options: ['Nutrition', 'Grooming', 'Exercise', 'Training', 'Health'] },
    { id: '3', key: 'frequency', label: 'Frequency', type: 'select', value: '', options: ['Daily', 'Weekly', 'Monthly', 'As Needed'] },
    { id: '4', key: 'difficulty', label: 'Difficulty', type: 'select', value: '', options: ['Beginner', 'Intermediate', 'Advanced'] },
    { id: '5', key: 'duration', label: 'Duration', type: 'text', value: '', placeholder: 'e.g., 30 minutes' },
    { id: '6', key: 'equipment', label: 'Required Equipment', type: 'multiselect', value: [], options: [] },
  ],
  place: [
    { id: '1', key: 'name', label: 'Place Name', type: 'text', value: '', required: true },
    { id: '2', key: 'address', label: 'Address', type: 'text', value: '', required: true },
    { id: '3', key: 'type', label: 'Type', type: 'select', value: '', options: ['Park', 'Beach', 'Trail', 'Cafe', 'Restaurant', 'Vet Clinic', 'Pet Store'] },
    { id: '4', key: 'fenced', label: 'Fenced', type: 'select', value: '', options: ['Yes', 'No', 'Partial'] },
    { id: '5', key: 'waterStation', label: 'Water Station Available', type: 'select', value: '', options: ['Yes', 'No'] },
    { id: '6', key: 'parking', label: 'Parking Info', type: 'text', value: '' },
  ],
  org: [
    { id: '1', key: 'name', label: 'Organization Name', type: 'text', value: '', required: true },
    { id: '2', key: 'type', label: 'Type', type: 'select', value: '', options: ['Clinic', 'Shelter', 'Rescue', 'Non-profit', 'Other'] },
    { id: '3', key: 'website', label: 'Website', type: 'url', value: '' },
    { id: '4', key: 'phone', label: 'Phone', type: 'text', value: '' },
    { id: '5', key: 'email', label: 'Email', type: 'text', value: '' },
    { id: '6', key: 'address', label: 'Address', type: 'text', value: '' },
    { id: '7', key: 'description', label: 'Description', type: 'textarea', value: '' },
  ],
  product: [
    { id: '1', key: 'name', label: 'Product Name', type: 'text', value: '', required: true },
    { id: '2', key: 'brand', label: 'Brand', type: 'text', value: '' },
    { id: '3', key: 'category', label: 'Category', type: 'select', value: '', options: ['Food', 'Toy', 'Accessory', 'Medicine', 'Grooming', 'Other'] },
    { id: '4', key: 'price', label: 'Price', type: 'number', value: null },
    { id: '5', key: 'rating', label: 'Rating', type: 'number', value: null, placeholder: '1-5' },
    { id: '6', key: 'description', label: 'Description', type: 'textarea', value: '' },
  ],
  regulation: [
    { id: '1', key: 'title', label: 'Regulation Title', type: 'text', value: '', required: true },
    { id: '2', key: 'jurisdiction', label: 'Jurisdiction', type: 'text', value: '', placeholder: 'e.g., California, USA' },
    { id: '3', key: 'effectiveDate', label: 'Effective Date', type: 'date', value: '' },
    { id: '4', key: 'summary', label: 'Summary', type: 'textarea', value: '' },
    { id: '5', key: 'fullText', label: 'Full Text URL', type: 'url', value: '' },
  ],
  event: [
    { id: '1', key: 'title', label: 'Event Title', type: 'text', value: '', required: true },
    { id: '2', key: 'date', label: 'Date', type: 'date', value: '', required: true },
    { id: '3', key: 'time', label: 'Time', type: 'text', value: '', placeholder: 'e.g., 10:00 AM' },
    { id: '4', key: 'location', label: 'Location', type: 'text', value: '' },
    { id: '5', key: 'type', label: 'Event Type', type: 'select', value: '', options: ['Adoption Drive', 'Meetup', 'Vaccination Clinic', 'Training', 'Other'] },
    { id: '6', key: 'description', label: 'Description', type: 'textarea', value: '' },
  ],
}

export function InfoboxBuilder({ articleType, data, onChange }: InfoboxBuilderProps) {
  const [fields, setFields] = useState<InfoboxField[]>(() => {
    const template = TEMPLATE_FIELDS[articleType] || []
    return template.map((field) => ({
      ...field,
      value: data?.[field.key] ?? field.value,
    }))
  })

  const updateField = (id: string, value: string | string[] | number | null) => {
    const updatedFields = fields.map((field) =>
      field.id === id ? { ...field, value } : field
    )
    setFields(updatedFields)

    // Convert to InfoboxData format
    const infoboxData: InfoboxData = {}
    updatedFields.forEach((field) => {
      infoboxData[field.key] = value
    })
    onChange?.(infoboxData)
  }

  const renderField = (field: InfoboxField) => {
    switch (field.type) {
      case 'text':
      case 'url':
        return (
          <Input
            id={field.id}
            value={(field.value as string) || ''}
            onChange={(e) => updateField(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        )

      case 'textarea':
        return (
          <Textarea
            id={field.id}
            value={(field.value as string) || ''}
            onChange={(e) => updateField(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            rows={4}
          />
        )

      case 'number':
        return (
          <Input
            id={field.id}
            type="number"
            value={(field.value as number) || ''}
            onChange={(e) => updateField(field.id, e.target.value ? Number(e.target.value) : null)}
            placeholder={field.placeholder}
            required={field.required}
          />
        )

      case 'date':
        return (
          <Input
            id={field.id}
            type="date"
            value={(field.value as string) || ''}
            onChange={(e) => updateField(field.id, e.target.value)}
            required={field.required}
          />
        )

      case 'select':
        return (
          <Select
            value={(field.value as string) || ''}
            onValueChange={(value) => updateField(field.id, value)}
          >
            <SelectTrigger id={field.id}>
              <SelectValue placeholder={field.placeholder || 'Select...'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'multiselect':
        const selectedValues = (field.value as string[]) || []
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <label key={option} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option)}
                  onChange={(e) => {
                    const newValues = e.target.checked
                      ? [...selectedValues, option]
                      : selectedValues.filter((v) => v !== option)
                    updateField(field.id, newValues)
                  }}
                  className="w-4 h-4"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Infobox Builder</CardTitle>
        <CardDescription>
          Fill in the details for this {articleType} article
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((field) => (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {renderField(field)}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

