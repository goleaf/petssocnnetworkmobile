import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    status: "ok",
    useLocalStorage: process.env.USE_LOCAL_STORAGE === "true",
    message: "Upload API is working",
  })
}
