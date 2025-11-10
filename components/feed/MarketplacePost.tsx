"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DollarSign,
  Package,
  Tag,
  CheckCircle2,
  MapPin,
  Truck,
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface MarketplaceData {
  price: number
  currency?: string
  condition: "New" | "Like New" | "Good" | "Fair"
  category:
    | "Toys"
    | "Food"
    | "Clothing"
    | "Accessories"
    | "Furniture"
    | "Healthcare"
    | "Books"
    | "Other"
  shipping?: {
    localPickup?: boolean
    shippingAvailable?: boolean
  }
  paymentMethods?: string[]
  soldAt?: string // ISO datetime when marked as sold
  location?: {
    name?: string
    city?: string
  }
}

interface MarketplacePostProps {
  postId: string
  marketplace: MarketplaceData
  onMarkAsSold?: (postId: string) => Promise<void>
  onContact?: (postId: string) => void
  isOwner?: boolean
  disabled?: boolean
  className?: string
}

const conditionColors: Record<string, string> = {
  New: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  "Like New": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Good: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  Fair: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
}

export function MarketplacePost({
  postId,
  marketplace,
  onMarkAsSold,
  onContact,
  isOwner = false,
  disabled = false,
  className,
}: MarketplacePostProps) {
  const [isMarking, setIsMarking] = useState(false)
  const isSold = !!marketplace.soldAt

  const handleMarkAsSold = async () => {
    if (!onMarkAsSold || !isOwner || disabled) return

    setIsMarking(true)
    try {
      await onMarkAsSold(postId)
    } catch (error) {
      console.error("Failed to mark as sold:", error)
    } finally {
      setIsMarking(false)
    }
  }

  const formatPrice = (price: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(price)
  }

  return (
    <div className={cn("border rounded-lg p-4 space-y-4 bg-muted/30", className)}>
      {/* Header with Price and Status */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          <span className="text-2xl font-bold">
            {formatPrice(marketplace.price, marketplace.currency)}
          </span>
        </div>
        {isSold && (
          <Badge variant="secondary" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Sold
          </Badge>
        )}
      </div>

      {/* Item Details */}
      <div className="space-y-2 text-sm">
        {/* Condition */}
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Condition:</span>
          <Badge
            variant="secondary"
            className={cn("text-xs", conditionColors[marketplace.condition])}
          >
            {marketplace.condition}
          </Badge>
        </div>

        {/* Category */}
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Category:</span>
          <span className="font-medium">{marketplace.category}</span>
        </div>

        {/* Location */}
        {marketplace.location && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Location:</span>
            <span className="font-medium">
              {marketplace.location.name || marketplace.location.city}
            </span>
          </div>
        )}

        {/* Shipping Options */}
        {marketplace.shipping && (
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Shipping:</span>
            <div className="flex gap-2">
              {marketplace.shipping.localPickup && (
                <Badge variant="outline" className="text-xs">
                  Local Pickup
                </Badge>
              )}
              {marketplace.shipping.shippingAvailable && (
                <Badge variant="outline" className="text-xs">
                  Shipping Available
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Payment Methods */}
        {marketplace.paymentMethods && marketplace.paymentMethods.length > 0 && (
          <div className="flex items-start gap-2">
            <span className="text-muted-foreground text-xs">Payment:</span>
            <div className="flex flex-wrap gap-1">
              {marketplace.paymentMethods.map((method) => (
                <Badge key={method} variant="outline" className="text-xs">
                  {method}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {!isSold && (
        <div className="flex gap-2 pt-2">
          {isOwner ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAsSold}
              disabled={isMarking || disabled}
              className="w-full"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {isMarking ? "Marking..." : "Mark as Sold"}
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() => onContact?.(postId)}
              disabled={disabled}
              className="w-full"
            >
              Contact Seller
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
