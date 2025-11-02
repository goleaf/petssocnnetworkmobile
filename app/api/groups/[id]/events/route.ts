import { NextRequest, NextResponse } from "next/server"
import { scheduleGroupEvent } from "@/lib/groups"
import type { ScheduleGroupEventParams } from "@/lib/groups"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: groupId } = params
    const body = await request.json()
    const {
      authorId,
      title,
      description,
      eventType,
      startDate,
      endDate,
      location,
      address,
      maxAttendees,
      rsvpRequired,
      tags,
      coverImage,
      meetingUrl,
    } = body as Omit<ScheduleGroupEventParams, "groupId">

    if (!authorId || !title || !description || !eventType || !startDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const result = scheduleGroupEvent({
      groupId,
      authorId,
      title,
      description,
      eventType,
      startDate,
      endDate,
      location,
      address,
      maxAttendees,
      rsvpRequired,
      tags,
      coverImage,
      meetingUrl,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.message || "Failed to create event" },
        { status: 403 }
      )
    }

    return NextResponse.json({ success: true, ...result }, { status: 201 })
  } catch (error) {
    console.error("Error creating event:", error)
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: groupId } = params
    const { getGroupEventsByGroupId } = await import("@/lib/storage")

    const events = getGroupEventsByGroupId(groupId)

    return NextResponse.json({ success: true, events }, { status: 200 })
  } catch (error) {
    console.error("Error fetching group events:", error)
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    )
  }
}

