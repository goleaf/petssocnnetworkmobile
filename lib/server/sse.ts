// Simple in-memory SSE hub for dev/demo usage.
// Not suitable for multi-instance deployments without an external broker.
export type SseEvent = { type: string; [key: string]: any }

const clients = new Map<number, WritableStreamDefaultWriter<Uint8Array>>()
let nextId = 1
const encoder = new TextEncoder()

export function addClient(writer: WritableStreamDefaultWriter<Uint8Array>, onClose: () => void) {
  const id = nextId++
  clients.set(id, writer)
  // Send a hello event
  try {
    writer.write(encoder.encode(`event: open\n` + `data: ${JSON.stringify({ ok: true })}\n\n`))
  } catch {}
  return () => {
    try { writer.close() } catch {}
    clients.delete(id)
    onClose()
  }
}

export function broadcastEvent(event: SseEvent) {
  const payload = encoder.encode(`event: message\n` + `data: ${JSON.stringify(event)}\n\n`)
  for (const [id, writer] of clients) {
    writer.write(payload).catch(() => {
      try { writer.close() } catch {}
      clients.delete(id)
    })
  }
}

