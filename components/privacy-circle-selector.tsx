"use client"

import { Users, Lock, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { PrivacyCircle } from "@/lib/types"
import { usePrivacyCircle } from "@/lib/privacy-circle"

interface PrivacyCircleSelectorProps {
  value?: PrivacyCircle
  onChange: (value: PrivacyCircle) => void
  className?: string
}

const privacyCircleOptions = [
  {
    value: "followers-only" as PrivacyCircle,
    label: "Followers Only",
    description: "Only your followers can see this",
    icon: Users,
  },
  {
    value: "group-only" as PrivacyCircle,
    label: "Group Only",
    description: "Only your group members can see this",
    icon: Lock,
  },
  {
    value: "close-friends" as PrivacyCircle,
    label: "Close Friends",
    description: "Only your close friends can see this",
    icon: Heart,
  },
]

export function PrivacyCircleSelector({ value, onChange, className }: PrivacyCircleSelectorProps) {
  const { lastSelectedCircle, setLastSelectedCircle } = usePrivacyCircle()
  
  // Use value if provided, otherwise use last selected from store
  const selectedValue = value || lastSelectedCircle
  const selected = privacyCircleOptions.find((opt) => opt.value === selectedValue) || privacyCircleOptions[0]
  const Icon = selected.icon

  const handleChange = (newValue: PrivacyCircle) => {
    setLastSelectedCircle(newValue)
    onChange(newValue)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Icon className="h-4 w-4 mr-2" />
          {selected.label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {privacyCircleOptions.map((option) => {
          const OptionIcon = option.icon
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleChange(option.value)}
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

