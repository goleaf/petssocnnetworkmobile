import { SettingsHeader } from "@/components/settings/SettingsHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function BillingSettingsPage(): JSX.Element {
  return (
    <div className="space-y-6">
      <SettingsHeader description="Manage your subscription and payment methods." />

      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>View your plan and manage billing details.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-end">
          <Button>Manage subscription</Button>
        </CardContent>
      </Card>
    </div>
  )
}
