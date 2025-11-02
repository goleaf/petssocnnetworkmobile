import { NextRequest, NextResponse } from "next/server"
import {
  getRecalls,
  getRecallById,
  addRecall,
  updateRecall,
  deleteRecall,
} from "@/lib/storage-products"
import type { Recall } from "@/lib/types"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")
    const productId = searchParams.get("productId")

    if (id) {
      const recall = getRecallById(id)
      if (!recall) {
        return NextResponse.json({ error: "Recall not found" }, { status: 404 })
      }
      return NextResponse.json(recall)
    }

    if (productId) {
      const recalls = getRecalls().filter((r) =>
        r.affectedProductIds.includes(productId)
      )
      return NextResponse.json(recalls)
    }

    const recalls = getRecalls()
    return NextResponse.json(recalls)
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to get recalls",
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
      title,
      description,
      recallDate,
      lotNumber,
      affectedProductIds,
      link,
    } = body

    if (!title || !description || !recallDate || !affectedProductIds) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          required: ["title", "description", "recallDate", "affectedProductIds"],
        },
        { status: 400 }
      )
    }

    if (!Array.isArray(affectedProductIds) || affectedProductIds.length === 0) {
      return NextResponse.json(
        { error: "affectedProductIds must be a non-empty array" },
        { status: 400 }
      )
    }

    const recall: Recall = {
      id: `recall_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      description,
      recallDate,
      lotNumber,
      affectedProductIds,
      link,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    addRecall(recall)

    return NextResponse.json(recall, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to create recall",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

