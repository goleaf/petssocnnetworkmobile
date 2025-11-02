/**
 * Queue worker initialization
 * Start the worker when the server starts
 */

import { startWorker } from "@/lib/queue/worker"

// Only start worker in Node.js environment (server-side)
if (typeof window === "undefined") {
  // Start worker with 5 second interval
  startWorker(5000)
  
  console.log("Queue worker started")
}

