import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/breeds
 * Fetch breeds filtered by species
 * Query params:
 * - species: string (required) - Filter breeds by species (dog, cat, etc.)
 * - search: string (optional) - Search breeds by name
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const species = searchParams.get("species")
    const search = searchParams.get("search")

    if (!species) {
      return NextResponse.json(
        { error: "Species parameter is required" },
        { status: 400 }
      )
    }

    const where: any = {
      species: species.toLowerCase(),
    }

    if (search) {
      where.name = {
        contains: search,
        mode: "insensitive",
      }
    }

    const breeds = await prisma.breed.findMany({
      where,
      select: {
        id: true,
        name: true,
        species: true,
        photoUrl: true,
        averageWeight: true,
        description: true,
      },
      orderBy: {
        name: "asc",
      },
      take: 100, // Limit to 100 breeds for performance
    })

    return NextResponse.json({
      breeds,
      count: breeds.length,
    })
  } catch (error) {
    console.error("Error fetching breeds:", error)
    return NextResponse.json(
      { error: "Failed to fetch breeds" },
      { status: 500 }
    )
  }
}
