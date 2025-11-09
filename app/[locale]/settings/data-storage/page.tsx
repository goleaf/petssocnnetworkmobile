import { SettingsHeader } from "@/components/settings/SettingsHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export default function DataStorageSettingsPage(): JSX.Element {
  return (
    <div className="space-y-6">
      <SettingsHeader description="Manage cache, media storage, and data export options." />

      <Card>
        <CardHeader>
          <CardTitle>Storage</CardTitle>
          <CardDescription>Review and clear cached media to free up space.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">Cached media: approx. 120 MB</div>
          <div className="flex justify-end">
            <Button variant="outline">Clear cache</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
