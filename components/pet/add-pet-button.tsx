"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PawPrint } from "lucide-react"
import { PetCreationWizard } from "./pet-creation-wizard"
import { useAuth } from "@/lib/auth"

interface AddPetButtonProps {
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  showIcon?: boolean
}

/**
 * Button component that opens the Pet Creation Wizard
 * 
 * @example
 * ```tsx
 * <AddPetButton />
 * <AddPetButton variant="outline" size="lg" />
 * ```
 */
export function AddPetButton({
  variant = "default",
  size = "default",
  className,
  showIcon = true,
}: AddPetButtonProps) {
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const { user } = useAuth()

  if (!user) {
    return null
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setIsWizardOpen(true)}
      >
        {showIcon && <PawPrint className="h-4 w-4 mr-2" />}
        Add New Pet
      </Button>

      <PetCreationWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        userId={user.id}
      />
    </>
  )
}
