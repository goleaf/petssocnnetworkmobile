import { NextRequest } from 'next/server'
import { addClient } from '@/lib/server/sse'
import { TransformStream } from 'node:stream/web'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  const cleanup = addClient(writer, () => {})
  request.signal.addEventListener('abort', () => cleanup())

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      // Allow CORS for local dev if needed
      'Access-Control-Allow-Origin': '*',
    },
  })
}
