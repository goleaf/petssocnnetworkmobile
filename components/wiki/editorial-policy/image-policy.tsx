import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ImagePolicy() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Image Policy</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Image Guidelines</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>All images must be relevant to the article content</li>
            <li>Images should be high quality and properly sized</li>
            <li>Ensure proper attribution and licensing for all images</li>
            <li>Avoid copyrighted images without permission</li>
            <li>Use descriptive alt text for accessibility</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Acceptable Image Sources</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Original photographs taken by contributors</li>
            <li>Public domain images</li>
            <li>Creative Commons licensed images (with proper attribution)</li>
            <li>Stock photos with appropriate licenses</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
