import { NextRequest, NextResponse } from "next/server"
import { importContacts } from "@/lib/storage"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, contacts } = body

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    if (!Array.isArray(contacts)) {
      return NextResponse.json({ error: "contacts must be an array" }, { status: 400 })
    }

    // Validate contact format: { email?: string, phone?: string, name?: string }
    const validContacts = contacts.filter((contact) => {
      return (
        typeof contact === "object" &&
        contact !== null &&
        (typeof contact.email === "string" || typeof contact.phone === "string")
      )
    })

    if (validContacts.length === 0) {
      return NextResponse.json(
        { error: "No valid contacts provided. Contacts must have email or phone" },
        { status: 400 },
      )
    }

    const result = importContacts(userId, validContacts)
    return NextResponse.json({
      success: true,
      message: "Contacts imported",
      imported: result.matchedUsers.length,
      totalContacts: validContacts.length,
      suggestions: result.suggestions,
    })
  } catch (error) {
    console.error("Error importing contacts:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

