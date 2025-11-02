"use client"

import { useState, useEffect } from "react"
import {
  Plus,
  Edit,
  Trash2,
  Search,
  AlertTriangle,
  Calendar,
  Link as LinkIcon,
  Package,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import type { Recall, Product } from "@/lib/types"

export default function AdminRecallsPage() {
  const [recalls, setRecalls] = useState<Recall[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRecall, setSelectedRecall] = useState<Recall | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<Recall>>({
    title: "",
    description: "",
    recallDate: "",
    lotNumber: "",
    affectedProductIds: [],
    link: "",
  })

  useEffect(() => {
    loadRecalls()
    loadProducts()
  }, [])

  const loadRecalls = async () => {
    try {
      const response = await fetch("/api/recalls")
      if (response.ok) {
        const data = await response.json()
        setRecalls(data || [])
      }
    } catch (error) {
      console.error("Error loading recalls:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      const response = await fetch("/api/products")
      if (response.ok) {
        const data = await response.json()
        setProducts(data || [])
      }
    } catch (error) {
      console.error("Error loading products:", error)
    }
  }

  const handleCreate = () => {
    setIsEditing(false)
    setSelectedRecall(null)
    setFormData({
      title: "",
      description: "",
      recallDate: "",
      lotNumber: "",
      affectedProductIds: [],
      link: "",
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (recall: Recall) => {
    setIsEditing(true)
    setSelectedRecall(recall)
    setFormData({
      title: recall.title,
      description: recall.description,
      recallDate: recall.recallDate,
      lotNumber: recall.lotNumber || "",
      affectedProductIds: recall.affectedProductIds,
      link: recall.link || "",
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = isEditing
        ? `/api/recalls/${selectedRecall?.id}`
        : "/api/recalls"
      const method = isEditing ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await loadRecalls()
        setIsDialogOpen(false)
      }
    } catch (error) {
      console.error("Error saving recall:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this recall?")) return

    try {
      const response = await fetch(`/api/recalls/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await loadRecalls()
      }
    } catch (error) {
      console.error("Error deleting recall:", error)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch {
      return dateString
    }
  }

  const getProductNames = (productIds: string[]) => {
    return productIds
      .map((id) => products.find((p) => p.id === id)?.name)
      .filter(Boolean)
      .join(", ")
  }

  const filteredRecalls = recalls.filter(
    (recall) =>
      recall.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recall.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Recall Management
              </CardTitle>
              <CardDescription>
                Manage product recalls with date and lot information
              </CardDescription>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Recall
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search recalls..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Lot Number</TableHead>
                  <TableHead>Affected Products</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecalls.map((recall) => (
                  <TableRow key={recall.id}>
                    <TableCell className="font-medium">
                      {recall.title}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDate(recall.recallDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {recall.lotNumber ? (
                        <Badge variant="outline" className="font-mono">
                          {recall.lotNumber}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {recall.affectedProductIds.length} product
                          {recall.affectedProductIds.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(recall)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(recall.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Recall" : "Create Recall"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update recall information"
                : "Add a new product recall"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="recallDate">Recall Date *</Label>
                <Input
                  id="recallDate"
                  type="date"
                  value={formData.recallDate}
                  onChange={(e) =>
                    setFormData({ ...formData, recallDate: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="lotNumber">Lot Number</Label>
                <Input
                  id="lotNumber"
                  value={formData.lotNumber || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, lotNumber: e.target.value })
                  }
                  placeholder="e.g., LOT123456"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="affectedProductIds">Affected Products *</Label>
              <div className="border rounded-md p-2 max-h-32 overflow-y-auto">
                {products.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No products available. Please add products first.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {products.map((product) => (
                      <label
                        key={product.id}
                        className="flex items-center gap-2 cursor-pointer hover:bg-muted p-1 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={formData.affectedProductIds?.includes(
                            product.id
                          )}
                          onChange={(e) => {
                            const currentIds =
                              formData.affectedProductIds || []
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                affectedProductIds: [...currentIds, product.id],
                              })
                            } else {
                              setFormData({
                                ...formData,
                                affectedProductIds: currentIds.filter(
                                  (id) => id !== product.id
                                ),
                              })
                            }
                          }}
                          className="h-4 w-4"
                        />
                        <span className="text-sm">{product.name}</span>
                        {product.brand && (
                          <span className="text-xs text-muted-foreground">
                            ({product.brand})
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {formData.affectedProductIds &&
                formData.affectedProductIds.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.affectedProductIds.length} product
                    {formData.affectedProductIds.length !== 1 ? "s" : ""}{" "}
                    selected
                  </p>
                )}
            </div>

            <div>
              <Label htmlFor="link">External Link</Label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="link"
                  type="url"
                  value={formData.link || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, link: e.target.value })
                  }
                  placeholder="https://..."
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

