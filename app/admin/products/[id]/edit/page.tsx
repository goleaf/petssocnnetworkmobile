"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { BackButton } from "@/components/ui/back-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Save, Plus, X } from "lucide-react"
import { toast } from "sonner"
import type { Product } from "@/lib/types"

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [product, setProduct] = useState<Partial<Product>>({
    name: "",
    brand: "",
    category: "food",
    description: "",
    price: undefined,
    currency: "USD",
    imageUrl: "",
    tags: [],
    inStock: true,
    rating: undefined,
    reviewCount: 0,
    isRecalled: false,
    recallNotice: "",
    safetyNotices: [],
  })
  const [newTag, setNewTag] = useState("")
  const [newSafetyNotice, setNewSafetyNotice] = useState("")

  const categories = ["food", "toys", "accessories", "health"]

  useEffect(() => {
    if (id === "create") {
      setIsLoading(false)
      return
    }

    const loadProduct = async () => {
      try {
        const response = await fetch(`/api/products/${id}`)
        if (response.ok) {
          const data = await response.json()
          setProduct(data.product || {})
        } else {
          // Fallback to localStorage
          const storedProducts = localStorage.getItem("products")
          if (storedProducts) {
            const products: Product[] = JSON.parse(storedProducts)
            const foundProduct = products.find((p) => p.id === id)
            if (foundProduct) {
              setProduct(foundProduct)
            }
          }
        }
      } catch (error) {
        console.error("Failed to load product:", error)
        // Fallback to localStorage
        const storedProducts = localStorage.getItem("products")
        if (storedProducts) {
          const products: Product[] = JSON.parse(storedProducts)
          const foundProduct = products.find((p) => p.id === id)
          if (foundProduct) {
            setProduct(foundProduct)
          }
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadProduct()
  }, [id])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const productData = {
        ...product,
        tags: product.tags || [],
        safetyNotices: product.safetyNotices || [],
        reviewCount: product.reviewCount || 0,
        currency: product.currency || "USD",
        inStock: product.inStock ?? true,
        isRecalled: product.isRecalled ?? false,
      }

      // If creating, don't include id in the data
      const { id: _, ...productDataForSave } = productData
      const url = id === "create" ? "/api/products" : `/api/products/${id}`
      const method = id === "create" ? "POST" : "PATCH"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id === "create" ? productDataForSave : productData),
      })

      if (response.ok) {
        toast.success(id === "create" ? "Product created successfully" : "Product updated successfully")
        router.push("/admin/products")
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to save product")
      }
    } catch (error) {
      console.error("Failed to save product:", error)
      toast.error("Failed to save product")
    } finally {
      setIsSaving(false)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !product.tags?.includes(newTag.trim())) {
      setProduct({
        ...product,
        tags: [...(product.tags || []), newTag.trim()],
      })
      setNewTag("")
    }
  }

  const removeTag = (tag: string) => {
    setProduct({
      ...product,
      tags: product.tags?.filter((t) => t !== tag) || [],
    })
  }

  const addSafetyNotice = () => {
    if (newSafetyNotice.trim() && !product.safetyNotices?.includes(newSafetyNotice.trim())) {
      setProduct({
        ...product,
        safetyNotices: [...(product.safetyNotices || []), newSafetyNotice.trim()],
      })
      setNewSafetyNotice("")
    }
  }

  const removeSafetyNotice = (notice: string) => {
    setProduct({
      ...product,
      safetyNotices: product.safetyNotices?.filter((n) => n !== notice) || [],
    })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <BackButton />
      <h1 className="text-4xl font-bold mb-8 mt-8">
        {id === "create" ? "Create Product" : "Edit Product"}
      </h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={product.name || ""}
                onChange={(e) => setProduct({ ...product, name: e.target.value })}
                placeholder="Enter product name"
              />
            </div>

            <div>
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={product.brand || ""}
                onChange={(e) => setProduct({ ...product, brand: e.target.value })}
                placeholder="Enter brand name"
              />
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={product.category || "food"}
                onValueChange={(value) => setProduct({ ...product, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={product.description || ""}
                onChange={(e) => setProduct({ ...product, description: e.target.value })}
                placeholder="Enter product description"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={product.price || ""}
                  onChange={(e) =>
                    setProduct({
                      ...product,
                      price: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={product.currency || "USD"}
                  onValueChange={(value) => setProduct({ ...product, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                value={product.imageUrl || ""}
                onChange={(e) => setProduct({ ...product, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory & Rating</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="inStock">In Stock</Label>
              <Switch
                id="inStock"
                checked={product.inStock ?? true}
                onCheckedChange={(checked) => setProduct({ ...product, inStock: checked })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rating">Rating (0-5)</Label>
                <Input
                  id="rating"
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={product.rating || ""}
                  onChange={(e) =>
                    setProduct({
                      ...product,
                      rating: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  placeholder="4.5"
                />
              </div>

              <div>
                <Label htmlFor="reviewCount">Review Count</Label>
                <Input
                  id="reviewCount"
                  type="number"
                  value={product.reviewCount || 0}
                  onChange={(e) =>
                    setProduct({
                      ...product,
                      reviewCount: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder="Add a tag"
              />
              <Button type="button" onClick={addTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.tags?.map((tag) => (
                <div
                  key={tag}
                  className="flex items-center gap-2 bg-secondary px-3 py-1 rounded-md"
                >
                  <span>{tag}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => removeTag(tag)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recall Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="isRecalled">Product is Recalled</Label>
              <Switch
                id="isRecalled"
                checked={product.isRecalled ?? false}
                onCheckedChange={(checked) => setProduct({ ...product, isRecalled: checked })}
              />
            </div>

            {product.isRecalled && (
              <div>
                <Label htmlFor="recallNotice">Recall Notice *</Label>
                <Textarea
                  id="recallNotice"
                  value={product.recallNotice || ""}
                  onChange={(e) => setProduct({ ...product, recallNotice: e.target.value })}
                  placeholder="Enter detailed recall notice information"
                  rows={4}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Safety Notices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newSafetyNotice}
                onChange={(e) => setNewSafetyNotice(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addSafetyNotice())
                }
                placeholder="Add a safety notice"
              />
              <Button type="button" onClick={addSafetyNotice}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <ul className="list-disc list-inside space-y-2">
              {product.safetyNotices?.map((notice, index) => (
                <li key={index} className="flex items-center justify-between">
                  <span>{notice}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSafetyNotice(notice)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !product.name}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Product"}
          </Button>
        </div>
      </div>
    </div>
  )
}

