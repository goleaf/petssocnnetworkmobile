import { AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ContentWarningProps {
  violations: string[]
  type?: "warning" | "error"
}

export function ContentWarning({ violations, type = "warning" }: ContentWarningProps) {
  if (violations.length === 0) return null

  return (
    <Alert variant={type === "error" ? "destructive" : "default"} className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Content Issues Detected</AlertTitle>
      <AlertDescription>
        <ul className="list-disc list-inside mt-2">
          {violations.map((violation, index) => (
            <li key={index} className="text-sm">
              {violation}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}
