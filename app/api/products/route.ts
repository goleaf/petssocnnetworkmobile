import { NextRequest, NextResponse } from "next/server"
import {
  getProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
} from "@/lib/storage-products"
import type { Product } from "@/lib/types"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")
    const category = searchParams.get("category")

    if (id) {
      const product = getProductById(id)
      if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 })
      }
      return NextResponse.json(product)
    }

    if (category) {
      const products = getProductsByCategory(category)
      return NextResponse.json(products)
    }

    const products = getProducts()
    return NextResponse.json(products)
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to get products",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      brand,
      category,
      description,
      price,
      currency = "USD",
      imageUrl,
      tags = [],
      inStock = true,
      rating,
      reviewCount = 0,
      safetyNotices = [],
    } = body

    if (!name || !category) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          required: ["name", "category"],
        },
        { status: 400 }
      )
    }

    const product: Product = {
      id: `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      brand,
      category,
      description,
      price,
      currency,
      imageUrl,
      tags: Array.isArray(tags) ? tags : [],
      inStock,
      rating,
      reviewCount,
      isRecalled: false,
      safetyNotices: Array.isArray(safetyNotices) ? safetyNotices : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    addProduct(product)

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to create product",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
