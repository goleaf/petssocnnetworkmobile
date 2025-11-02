"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { PlusCircle, BookOpen, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface ContributeCTAProps {
  entityName: string
  entityType?: "breed" | "health" | "place" | "product"
  context?: "post" | "comment" | "mention"
  onContribute?: () => void
}

export function ContributeCTA({
  entityName,
  entityType,
  context = "post",
  onContribute,
}: ContributeCTAProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const handleContribute = (type: string) => {
    setIsOpen(false)
    router.push(`/wiki/create?type=${type}&title=${encodeURIComponent(entityName)}`)
    onContribute?.()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="border-dashed hover:border-primary/50 transition-colors cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <PlusCircle className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  Help improve our wiki
                </p>
                <p className="text-xs text-muted-foreground">
                  Create an article about <span className="font-medium">{entityName}</span>
                </p>
              </div>
              <Button variant="outline" size="sm">
                Contribute
              </Button>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Wiki Article</DialogTitle>
          <DialogDescription>
            Select the type of article you want to create about <strong>{entityName}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-4">
          <ArticleTypeButton
            type="breed"
            label="Breed"
            description="Pet breed information"
            onClick={() => handleContribute("breed")}
            disabled={entityType && entityType !== "breed"}
          />
          <ArticleTypeButton
            type="health"
            label="Health"
            description="Health condition or care"
            onClick={() => handleContribute("health")}
            disabled={entityType && entityType !== "health"}
          />
          <ArticleTypeButton
            type="place"
            label="Place"
            description="Pet-friendly location"
            onClick={() => handleContribute("place")}
            disabled={entityType && entityType !== "place"}
          />
          <ArticleTypeButton
            type="product"
            label="Product"
            description="Pet product or service"
            onClick={() => handleContribute("product")}
            disabled={entityType && entityType !== "product"}
          />
        </div>
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Or{" "}
            <Link href="/wiki" className="text-primary hover:underline">
              browse existing articles
            </Link>{" "}
            to see if one already exists
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ArticleTypeButton({
  type,
  label,
  description,
  onClick,
  disabled,
}: {
  type: string
  label: string
  description: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        p-4 border rounded-lg text-left transition-all
        hover:border-primary hover:bg-accent
        disabled:opacity-50 disabled:cursor-not-allowed
        ${disabled ? "" : "cursor-pointer"}
      `}
    >
      <div className="flex items-start gap-3">
        <BookOpen className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{label}</p>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
      </div>
    </button>
  )
}

/**
 * Detect entities in post content and show contribute CTAs
 */
export function EntityDetector({ content }: { content: string }) {
  // Simple entity detection - in production, use NLP or a proper entity extraction service
  const entities: Array<{ name: string; type?: "breed" | "health" | "place" | "product" }> = []

  // Example: Look for breed names (simplified)
  const breedPatterns = [
    /(?:golden retriever|labrador|poodle|german shepherd|bulldog|beagle|rottweiler|yorkshire terrier|dachshund|siberian husky)/gi,
  ]

  // Example: Look for health conditions
  const healthPatterns = [
    /(?:parvovirus|distemper|rabies|kennel cough|heartworm|flea infestation|tick|allergy|diabetes|arthritis)/gi,
  ]

  // Example: Look for products (brand names)
  const productPatterns = [
    /(?:purina|royal canin|hills|pedigree|whiskas|iams|blue buffalo|wellness|orijen|acana)/gi,
  ]

  // Extract entities (simplified - production should use proper NLP)
  breedPatterns.forEach((pattern) => {
    const matches = content.match(pattern)
    matches?.forEach((match) => {
      if (!entities.find((e) => e.name.toLowerCase() === match.toLowerCase())) {
        entities.push({ name: match, type: "breed" })
      }
    })
  })

  healthPatterns.forEach((pattern) => {
    const matches = content.match(pattern)
    matches?.forEach((match) => {
      if (!entities.find((e) => e.name.toLowerCase() === match.toLowerCase())) {
        entities.push({ name: match, type: "health" })
      }
    })
  })

  productPatterns.forEach((pattern) => {
    const matches = content.match(pattern)
    matches?.forEach((match) => {
      if (!entities.find((e) => e.name.toLowerCase() === match.toLowerCase())) {
        entities.push({ name: match, type: "product" })
      }
    })
  })

  if (entities.length === 0) return null

  return (
    <div className="space-y-2 mt-4">
      {entities.slice(0, 3).map((entity, index) => (
        <ContributeCTA
          key={index}
          entityName={entity.name}
          entityType={entity.type}
          context="post"
        />
      ))}
    </div>
  )
}

