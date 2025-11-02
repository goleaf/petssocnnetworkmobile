import type { Webhook, WebhookDelivery } from "../types"
import { addWebhookDelivery } from "../storage"

/**
 * Generate HMAC signature for webhook payload
 */
export async function generateHmacSignature(
  payload: string,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const messageData = encoder.encode(payload)

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData)
  const hashArray = Array.from(new Uint8Array(signature))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")

  return hashHex
}

/**
 * Deliver webhook with retry logic and HMAC signing
 */
export async function deliverWebhook(
  webhook: Webhook,
  payload: Record<string, unknown>
): Promise<{ success: boolean; error?: string; deliveryId?: string }> {
  const payloadString = JSON.stringify(payload)
  const deliveryId = `del_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`

  // Create initial delivery record
  const delivery: WebhookDelivery = {
    id: deliveryId,
    webhookId: webhook.id,
    status: "pending",
    attempts: 0,
    maxAttempts: webhook.retryCount || 3,
    createdAt: new Date().toISOString(),
  }

  addWebhookDelivery(webhook.id, delivery)

  // Generate HMAC signature if secret is provided
  let signature: string | undefined
  if (webhook.secret) {
    try {
      signature = await generateHmacSignature(payloadString, webhook.secret)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to generate HMAC"
      delivery.status = "failed"
      delivery.errorMessage = errorMsg
      addWebhookDelivery(webhook.id, delivery)
      return { success: false, error: errorMsg }
    }
  }

  // Prepare headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "PetSocialNetwork-Webhook/1.0",
    ...webhook.headers,
  }

  if (signature) {
    headers["X-Webhook-Signature"] = `sha256=${signature}`
    headers["X-Webhook-Timestamp"] = Date.now().toString()
  }

  // Retry logic
  let lastError: string | undefined
  for (let attempt = 1; attempt <= delivery.maxAttempts; attempt++) {
    delivery.attempts = attempt

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(
        () => controller.abort(),
        webhook.timeout || 30000
      )

      const response = await fetch(webhook.url, {
        method: webhook.method || "POST",
        headers,
        body: payloadString,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const responseText = await response.text().catch(() => "")

      if (response.ok) {
        delivery.status = "success"
        delivery.responseCode = response.status
        delivery.responseBody = responseText.substring(0, 500) // Limit response body size
        delivery.deliveredAt = new Date().toISOString()
        addWebhookDelivery(webhook.id, delivery)
        return { success: true, deliveryId }
      } else {
        lastError = `HTTP ${response.status}: ${responseText.substring(0, 200)}`
        delivery.responseCode = response.status
        delivery.responseBody = responseText.substring(0, 500)
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        lastError = "Request timeout"
      } else {
        lastError = error instanceof Error ? error.message : "Unknown error"
      }
      delivery.errorMessage = lastError
    }

    // Wait before retry (except on last attempt)
    if (attempt < delivery.maxAttempts) {
      const delay = webhook.retryDelay || 1000 * attempt // Exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  // All retries failed
  delivery.status = "failed"
  delivery.errorMessage = lastError || "All retry attempts failed"
  addWebhookDelivery(webhook.id, delivery)
  return { success: false, error: lastError, deliveryId }
}

/**
 * Test webhook delivery with sample payload
 */
export async function testWebhookDelivery(
  webhook: Webhook
): Promise<{ success: boolean; error?: string; deliveryId?: string }> {
  const testPayload = {
    event: "webhook.test",
    timestamp: new Date().toISOString(),
    data: {
      message: "This is a test webhook delivery",
      webhookId: webhook.id,
      webhookName: webhook.name,
    },
  }

  return deliverWebhook(webhook, testPayload)
}
