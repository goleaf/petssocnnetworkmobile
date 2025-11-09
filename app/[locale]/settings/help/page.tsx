import { SettingsHeader } from "@/components/settings/SettingsHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function HelpSupportSettingsPage(): JSX.Element {
  return (
    <div className="space-y-6">
      <SettingsHeader description="Find FAQs, contact support, and report issues." />

      <Card>
        <CardHeader>
          <CardTitle>Support</CardTitle>
          <CardDescription>Need help? Reach out or browse documentation.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3 justify-end">
          <Button asChild>
            <a href="/docs" rel="nofollow">Open docs</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="mailto:support@example.com">Contact support</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
