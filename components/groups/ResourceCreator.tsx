"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ErrorText } from "@/components/ui/error-text"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, X, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import type { GroupResource } from "@/lib/types"

type ResourceType = NonNullable<GroupResource["type"]>

export interface ResourceFormValues {
  title: string
  description?: string
  url?: string
  type: ResourceType
  tags: string[]
}

interface ResourceCreatorProps {
  initialValues?: Partial<ResourceFormValues>
  onSubmit: (values: ResourceFormValues) => Promise<void> | void
  onCancel: () => void
}

type ValidationErrors = Partial<Record<keyof ResourceFormValues | "tags", string>>

const RESOURCE_TYPES: ResourceType[] = ["link", "file", "note"]

export function ResourceCreator({ initialValues, onSubmit, onCancel }: ResourceCreatorProps) {
  const t = useTranslations("GroupResources.Create")
  const tCommon = useTranslations("Common")

  const [values, setValues] = useState<ResourceFormValues>(() => ({
    title: initialValues?.title ?? "",
    description: initialValues?.description ?? "",
    url: initialValues?.url ?? "",
    type: initialValues?.type ?? "link",
    tags: initialValues?.tags ?? [],
  }))
  const [tagInput, setTagInput] = useState("")
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const typeOptions = useMemo(
    () =>
      RESOURCE_TYPES.map((typeValue) => ({
        value: typeValue,
        label: t(`typeOptions.${typeValue}` as const),
        description: t(`typeDescriptions.${typeValue}` as const),
      })),
    [t],
  )

  const validate = (nextValues: ResourceFormValues): ValidationErrors => {
    const validationErrors: ValidationErrors = {}

    if (!nextValues.title.trim()) {
      validationErrors.title = t("errors.titleRequired")
    } else if (nextValues.title.trim().length < 3) {
      validationErrors.title = t("errors.titleTooShort")
    }

    if (nextValues.type !== "note") {
      const urlValue = nextValues.url?.trim()
      if (!urlValue) {
        validationErrors.url = t("errors.urlRequired")
      } else {
        try {
          // eslint-disable-next-line no-new
          new URL(urlValue)
        } catch (error) {
          validationErrors.url = t("errors.urlInvalid")
        }
      }
    }

    if (nextValues.tags.length > 10) {
      validationErrors.tags = t("errors.tooManyTags")
    }

    return validationErrors
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedValues: ResourceFormValues = {
      title: values.title.trim(),
      description: values.description?.trim() ? values.description.trim() : undefined,
      url: values.url?.trim() ? values.url.trim() : undefined,
      type: values.type,
      tags: values.tags,
    }

    const validationErrors = validate(trimmedValues)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    try {
      setIsSubmitting(true)
      await onSubmit(trimmedValues)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTagAdd = () => {
    const normalized = tagInput.trim().toLowerCase()
    if (!normalized) {
      return
    }

    if (values.tags.includes(normalized)) {
      setErrors((prev) => ({ ...prev, tags: t("errors.duplicateTag") }))
      return
    }

    if (normalized.length > 24) {
      setErrors((prev) => ({ ...prev, tags: t("errors.tagTooLong") }))
      return
    }

    const updatedTags = [...values.tags, normalized]
    if (updatedTags.length > 10) {
      setErrors((prev) => ({ ...prev, tags: t("errors.tooManyTags") }))
      return
    }

    setValues((prev) => ({ ...prev, tags: updatedTags }))
    setTagInput("")
    setErrors((prev) => ({ ...prev, tags: undefined }))
  }

  const handleTagRemove = (tagToRemove: string) => {
    setValues((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }))
    setErrors((prev) => ({ ...prev, tags: undefined }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("formTitle")}</CardTitle>
          <CardDescription>{t("formDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="resource-title">{t("titleLabel")}</Label>
            <Input
              id="resource-title"
              value={values.title}
              onChange={(event) => {
                const nextTitle = event.target.value
                setValues((prev) => ({ ...prev, title: nextTitle }))
                if (errors.title) {
                  setErrors((prev) => ({ ...prev, title: undefined }))
                }
              }}
              placeholder={t("titlePlaceholder")}
              className={errors.title ? "border-destructive" : ""}
            />
            {errors.title && <ErrorText className="text-sm">{errors.title}</ErrorText>}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="resource-type">{t("typeLabel")}</Label>
              <Select
                value={values.type}
                onValueChange={(nextValue: ResourceType) => {
                  setValues((prev) => ({ ...prev, type: nextValue }))
                  setErrors((prev) => ({ ...prev, url: undefined }))
                }}
              >
                <SelectTrigger id="resource-type" className="w-full">
                  <SelectValue placeholder={t("typePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {values.type !== "note" && (
              <div className="space-y-2">
                <Label htmlFor="resource-url">{t("urlLabel")}</Label>
                <Input
                  id="resource-url"
                  value={values.url ?? ""}
                  onChange={(event) => {
                    const nextUrl = event.target.value
                    setValues((prev) => ({ ...prev, url: nextUrl }))
                    if (errors.url) {
                      setErrors((prev) => ({ ...prev, url: undefined }))
                    }
                  }}
                  placeholder={t("urlPlaceholder")}
                  className={errors.url ? "border-destructive" : ""}
                  inputMode="url"
                  autoComplete="url"
                />
                {errors.url && <ErrorText className="text-sm">{errors.url}</ErrorText>}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="resource-description">{t("descriptionLabel")}</Label>
            <Textarea
              id="resource-description"
              value={values.description ?? ""}
              onChange={(event) => {
                const nextDescription = event.target.value
                setValues((prev) => ({ ...prev, description: nextDescription }))
              }}
              placeholder={t("descriptionPlaceholder")}
              rows={4}
            />
          </div>

          <div className="space-y-3">
            <div className="flex flex-col gap-2 md:flex-row md:items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="resource-tags">{t("tagsLabel")}</Label>
                <Input
                  id="resource-tags"
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault()
                      handleTagAdd()
                    }
                  }}
                  placeholder={t("tagsPlaceholder")}
                />
                <p className="text-xs text-muted-foreground">{t("tagsHelper")}</p>
              </div>
              <Button type="button" variant="secondary" onClick={handleTagAdd} className="md:self-auto">
                <Plus className="mr-2 h-4 w-4" />
                {t("addTag")}
              </Button>
            </div>
            {errors.tags && <ErrorText className="text-sm">{errors.tags}</ErrorText>}
            {values.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {values.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleTagRemove(tag)}
                      className="rounded-full p-0.5 text-muted-foreground transition hover:text-foreground"
                      aria-label={t("removeTag", { tag })}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("saving")}
                </>
              ) : (
                t("submit")
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}

