"use client"

import { Lock, Globe, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { PrivacyLevel } from "@/lib/types"

interface PrivacySelectorProps {
  value: PrivacyLevel
  onChange: (value: PrivacyLevel) => void
  className?: string
}

const privacyOptions = [
  {
    value: "public" as PrivacyLevel,
    label: "Public",
    description: "Anyone can see this",
    icon: Globe,
  },
  {
    value: "followers-only" as PrivacyLevel,
    label: "Friends Only",
    description: "Only your friends can see this",
    icon: Users,
  },
  {
    value: "private" as PrivacyLevel,
    label: "Private",
    description: "Only you can see this",
    icon: Lock,
  },
]

export function PrivacySelector({ value, onChange, className }: PrivacySelectorProps) {
  const selected = privacyOptions.find((opt) => opt.value === value) || privacyOptions[0]
  const Icon = selected.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Icon className="h-4 w-4 mr-2" />
          {selected.label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {privacyOptions.map((option) => {
          const OptionIcon = option.icon
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onChange(option.value)}
              className="flex flex-col items-start gap-1 p-3"
            >
              <div className="flex items-center gap-2">
                <OptionIcon className="h-4 w-4" />
                <span className="font-medium">{option.label}</span>
              </div>
              <span className="text-sm text-muted-foreground">{option.description}</span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
