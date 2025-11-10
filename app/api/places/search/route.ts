import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("q")

  if (!query) {
    return NextResponse.json({ results: [] })
  }

  // TODO: Integrate with Google Places API or similar
  // For now, return mock data
  const mockPlaces = [
    {
      place_id: "1",
      name: "Central Park",
      formatted_address: "New York, NY 10024, USA",
      geometry: {
        location: {
          lat: 40.785091,
          lng: -73.968285,
        },
      },
    },
    {
      place_id: "2",
      name: "Golden Gate Park",
      formatted_address: "San Francisco, CA 94122, USA",
      geometry: {
        location: {
          lat: 37.769421,
          lng: -122.486214,
        },
      },
    },
  ].filter((place) =>
    place.name.toLowerCase().includes(query.toLowerCase())
  )

  return NextResponse.json({ results: mockPlaces })
}
