import { NextRequest, NextResponse } from "next/server"
import {
  getRecallById,
  updateRecall,
  deleteRecall,
} from "@/lib/storage-products"
import type { Recall } from "@/lib/types"

export const runtime = "nodejs"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const recall = getRecallById(id)

    if (!recall) {
      return NextResponse.json({ error: "Recall not found" }, { status: 404 })
    }

    return NextResponse.json(recall)
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to get recall",
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

    const existingRecall = getRecallById(id)
    if (!existingRecall) {
      return NextResponse.json({ error: "Recall not found" }, { status: 404 })
    }

    const updates: Partial<Recall> = {}

    if (body.title !== undefined) updates.title = body.title
    if (body.description !== undefined) updates.description = body.description
    if (body.recallDate !== undefined) updates.recallDate = body.recallDate
    if (body.lotNumber !== undefined) updates.lotNumber = body.lotNumber
    if (body.affectedProductIds !== undefined)
      updates.affectedProductIds = body.affectedProductIds
    if (body.link !== undefined) updates.link = body.link

    updateRecall(id, updates)

    const updatedRecall = getRecallById(id)
    return NextResponse.json(updatedRecall)
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to update recall",
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

    const existingRecall = getRecallById(id)
    if (!existingRecall) {
      return NextResponse.json({ error: "Recall not found" }, { status: 404 })
    }

    deleteRecall(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to delete recall",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

