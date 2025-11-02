import { NextRequest, NextResponse } from "next/server"
import {
  getOrganizations,
  getOrganizationById,
  updateOrganization,
  addOrganization,
} from "@/lib/storage"
import type { Organization, RepresentativeRole } from "@/lib/types"

export const runtime = "nodejs"

// GET - List all organizations
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const verified = searchParams.get("verified")
    const type = searchParams.get("type")

    let orgs = getOrganizations()

    // Filter by verification status
    if (verified === "true") {
      orgs = orgs.filter((org) => org.verifiedAt)
    } else if (verified === "false") {
      orgs = orgs.filter((org) => !org.verifiedAt)
    }

    // Filter by type
    if (type) {
      orgs = orgs.filter((org) => org.type === type)
    }

    return NextResponse.json({ organizations: orgs })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch organizations",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// PATCH - Update organization
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, updates } = body

    if (!id) {
      return NextResponse.json({ error: "Organization ID is required" }, { status: 400 })
    }

    const org = getOrganizationById(id)
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    // Validate updates
    const allowedFields = [
      "verifiedAt",
      "verifiedBy",
      "coiDisclosure",
      "representatives",
      "website",
      "locGeo",
      "name",
      "type",
    ]
    const updateKeys = Object.keys(updates || {})
    const invalidKeys = updateKeys.filter((key) => !allowedFields.includes(key))

    if (invalidKeys.length > 0) {
      return NextResponse.json(
        { error: `Invalid fields: ${invalidKeys.join(", ")}` },
        { status: 400 }
      )
    }

    // Add updatedAt timestamp
    const finalUpdates = {
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    updateOrganization(id, finalUpdates)

    const updatedOrg = getOrganizationById(id)
    return NextResponse.json({ organization: updatedOrg })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to update organization",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// POST - Create new organization
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, website, locGeo } = body

    if (!name || !type) {
      return NextResponse.json(
        { error: "Name and type are required" },
        { status: 400 }
      )
    }

    const newOrg: Organization = {
      id: `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      type,
      website,
      locGeo,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    addOrganization(newOrg)

    return NextResponse.json({ organization: newOrg }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to create organization",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// PUT - Assign representative role
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { orgId, userId, role, action } = body

    if (!orgId || !userId) {
      return NextResponse.json(
        { error: "Organization ID and User ID are required" },
        { status: 400 }
      )
    }

    const org = getOrganizationById(orgId)
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    if (action === "remove") {
      // Remove representative
      const currentReps = org.representatives || []
      const updatedReps = currentReps.filter((r) => r.userId !== userId)
      updateOrganization(orgId, {
        representatives: updatedReps,
        updatedAt: new Date().toISOString(),
      })
    } else {
      // Add or update representative
      if (!role) {
        return NextResponse.json({ error: "Role is required" }, { status: 400 })
      }

      const currentReps = org.representatives || []
      const existingIndex = currentReps.findIndex((r) => r.userId === userId)

      const newRep = {
        userId,
        role: role as RepresentativeRole,
        assignedAt: new Date().toISOString(),
        assignedBy: "admin", // In real app, get from session
      }

      const updatedReps =
        existingIndex >= 0
          ? currentReps.map((r, idx) => (idx === existingIndex ? newRep : r))
          : [...currentReps, newRep]

      updateOrganization(orgId, {
        representatives: updatedReps,
        updatedAt: new Date().toISOString(),
      })
    }

    const updatedOrg = getOrganizationById(orgId)
    return NextResponse.json({ organization: updatedOrg })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to update representative",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
