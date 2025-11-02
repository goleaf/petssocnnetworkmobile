import { NextRequest, NextResponse } from "next/server"
import {
  getProductById,
  updateProduct,
  deleteProduct,
} from "@/lib/storage-products"
import type { Product } from "@/lib/types"

export const runtime = "nodejs"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const product = getProductById(id)

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to get product",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    const existingProduct = getProductById(id)
    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const updates: Partial<Product> = {}

    if (body.name !== undefined) updates.name = body.name
    if (body.brand !== undefined) updates.brand = body.brand
    if (body.category !== undefined) updates.category = body.category
    if (body.description !== undefined) updates.description = body.description
    if (body.price !== undefined) updates.price = body.price
    if (body.currency !== undefined) updates.currency = body.currency
    if (body.imageUrl !== undefined) updates.imageUrl = body.imageUrl
    if (body.tags !== undefined) updates.tags = body.tags
    if (body.inStock !== undefined) updates.inStock = body.inStock
    if (body.rating !== undefined) updates.rating = body.rating
    if (body.reviewCount !== undefined) updates.reviewCount = body.reviewCount
    if (body.safetyNotices !== undefined) updates.safetyNotices = body.safetyNotices

    updateProduct(id, updates)

    const updatedProduct = getProductById(id)
    return NextResponse.json(updatedProduct)
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to update product",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const existingProduct = getProductById(id)
    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    deleteProduct(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to delete product",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
