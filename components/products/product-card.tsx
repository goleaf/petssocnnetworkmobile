"use client"

import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Star, ShoppingCart } from "lucide-react"
import type { Product } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ProductCardProps {
  product: Product
  className?: string
}

export function ProductCard({ product, className }: ProductCardProps) {
  const formatPrice = (price?: number, currency: string = "USD") => {
    if (!price) return null
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(price)
  }

  return (
    <Card
      className={cn(
        "flex flex-col hover:shadow-md transition-shadow",
        product.isRecalled && "border-red-500 border-2",
        className
      )}
    >
      <Link href={`/products/${product.id}`} className="block">
        {product.isRecalled && (
          <div className="bg-red-50 dark:bg-red-950 border-b border-red-500 px-4 py-2">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-semibold">RECALLED</span>
            </div>
          </div>
        )}
        
        <CardHeader>
          {product.imageUrl ? (
            <div className="relative h-48 w-full mb-4 overflow-hidden rounded-lg">
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="h-48 w-full mb-4 bg-muted rounded-lg flex items-center justify-center">
              <ShoppingCart className="h-16 w-16 text-muted-foreground/50" />
            </div>
          )}
          
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <CardTitle className="text-lg">{product.name}</CardTitle>
              {product.brand && (
                <CardDescription className="mt-1">{product.brand}</CardDescription>
              )}
            </div>
            <Badge variant="outline" className="shrink-0">
              {product.category}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex-1">
          {product.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {product.description}
            </p>
          )}

          {product.rating && (
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-semibold">{product.rating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">
                ({product.reviewCount} reviews)
              </span>
            </div>
          )}

          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {product.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {product.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{product.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            {formatPrice(product.price, product.currency) && (
              <span className="text-lg font-bold">
                {formatPrice(product.price, product.currency)}
              </span>
            )}
            <div className="flex items-center gap-2">
              {product.inStock ? (
                <Badge variant="default" className="bg-green-600">
                  In Stock
                </Badge>
              ) : (
                <Badge variant="secondary">Out of Stock</Badge>
              )}
            </div>
          </div>
        </CardFooter>
      </Link>
    </Card>
  )
}

