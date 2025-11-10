"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export interface AddToCloseFriendsButtonProps {
  userId: string
  isCloseFriend: boolean
  onToggle?: (isCloseFriend: boolean) => void
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function AddToCloseFriendsButton({ 
  userId, 
  isCloseFriend: initialIsCloseFriend, 
  onToggle,
  variant = "outline",
  size = "sm",
  className 
}: AddToCloseFriendsButtonProps) {
  const [isCloseFriend, setIsCloseFriend] = useState(initialIsCloseFriend)
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = async () => {
    setIsLoading(true)
    
    try {
      const method = isCloseFriend ? 'DELETE' : 'POST'
      const response = await fetch(`/api/close-friends/${userId}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to update close friends')
      }

      const newState = !isCloseFriend
      setIsCloseFriend(newState)
      
      if (newState) {
        toast.success('Added to Close Friends')
      } else {
        toast.success('Removed from Close Friends')
      }

      onToggle?.(newState)
    } catch (error) {
      console.error('Error toggling close friend:', error)
      toast.error('Failed to update Close Friends')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      disabled={isLoading}
      className={cn(
        isCloseFriend && "bg-green-600 hover:bg-green-700 text-white border-green-600",
        className
      )}
    >
      <Heart className={cn("h-4 w-4", isCloseFriend && "fill-current")} />
      {size !== "icon" && (
        <span className="ml-2">
          {isCloseFriend ? 'Close Friend' : 'Add to Close Friends'}
        </span>
      )}
    </Button>
  )
}

export default AddToCloseFriendsButton
