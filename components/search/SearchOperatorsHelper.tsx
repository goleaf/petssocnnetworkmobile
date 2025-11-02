"use client"

import * as React from "react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Info, Code, Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface OperatorExample {
  operator: string
  description: string
  examples: string[]
}

const OPERATORS: OperatorExample[] = [
  {
    operator: "type:",
    description: "Filter by content type (users, pets, blogs, wiki, hashtags, groups, events)",
    examples: ['type:blogs', 'type:pets', 'type:users,events'],
  },
  {
    operator: "tags:",
    description: "Search by hashtags or tags",
    examples: ['tags:adoption', 'tags:training,health', '#adoption'],
  },
  {
    operator: "species:",
    description: "Filter by animal species",
    examples: ['species:dog', 'species:cat,bird'],
  },
  {
    operator: "location:",
    description: "Filter by location or city",
    examples: ['location:"New York"', 'loc:London', 'city:Berlin'],
  },
  {
    operator: "breed:",
    description: "Filter by pet breed",
    examples: ['breed:golden-retriever', 'breed:"german shepherd"'],
  },
  {
    operator: "gender:",
    description: "Filter by gender (male, female)",
    examples: ['gender:male', 'genders:male,female'],
  },
  {
    operator: "age:",
    description: "Filter by age range or exact age",
    examples: ['age:5', 'age:2-5', 'age:>10', 'age:<3'],
  },
  {
    operator: "verified:",
    description: "Filter for verified accounts or content",
    examples: ['verified:true', 'verified:yes'],
  },
  {
    operator: "near:",
    description: "Find content near your location",
    examples: ['near:me', 'nearby:true'],
  },
  {
    operator: "from: / to:",
    description: "Filter by date range",
    examples: ['from:2024-01-01', 'to:2024-12-31', 'date:2024-06-15'],
  },
  {
    operator: "sort:",
    description: "Change result sorting",
    examples: ['sort:recent', 'sort:popular', 'sort:relevance'],
  },
]

export function SearchOperatorsHelper({ className }: { className?: string }) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const copyExample = async (example: string, index: number) => {
    try {
      await navigator.clipboard.writeText(example)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("gap-2", className)}>
          <Info className="h-4 w-4" />
          <span className="hidden sm:inline">Search Operators</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Search Operators Guide
          </DialogTitle>
          <DialogDescription>
            Use these operators to create advanced search queries. Combine multiple operators for
            precise results.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {OPERATORS.map((op, opIndex) => (
            <Card key={op.operator}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-sm">
                    {op.operator}
                  </Badge>
                  <span className="text-sm font-normal text-muted-foreground">
                    {op.description}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {op.examples.map((example, exampleIndex) => {
                    const uniqueIndex = opIndex * 100 + exampleIndex
                    const isCopied = copiedIndex === uniqueIndex

                    return (
                      <div
                        key={exampleIndex}
                        className="flex items-center justify-between p-2 bg-muted rounded-md group hover:bg-muted/80 transition-colors"
                      >
                        <code className="text-sm font-mono text-primary flex-1">{example}</code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => copyExample(example, uniqueIndex)}
                        >
                          {isCopied ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg space-y-2">
          <h4 className="font-semibold text-sm">Tips:</h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Combine multiple operators: <code className="text-xs">type:blogs tags:training</code></li>
            <li>Use quotes for multi-word values: <code className="text-xs">location:"New York"</code></li>
            <li>Separate multiple values with commas: <code className="text-xs">species:dog,cat</code></li>
            <li>Operators are case-insensitive</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  )
}

