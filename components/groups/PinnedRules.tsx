"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Pin, FileText } from "lucide-react"
import type { Group } from "@/lib/types"

interface PinnedRulesProps {
  group: Group
}

export function PinnedRules({ group }: PinnedRulesProps) {
  const pinnedRules = group.pinnedRules || group.rules || []

  if (pinnedRules.length === 0) {
    return null
  }

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Pin className="h-5 w-5 text-primary" />
          Pinned Rules
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {pinnedRules.map((rule, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <span className="text-primary font-semibold mt-0.5">{index + 1}.</span>
              <span className="flex-1">{rule}</span>
            </li>
          ))}
        </ul>
        {group.rules && group.rules.length > pinnedRules.length && (
          <p className="text-xs text-muted-foreground mt-3">
            <FileText className="h-3 w-3 inline mr-1" />
            View all {group.rules.length} rules in group settings
          </p>
        )}
      </CardContent>
    </Card>
  )
}

