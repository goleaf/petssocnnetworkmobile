import type React from "react"

export function SkipLinks(): React.ReactElement {
  return (
    <div>
      <a href="#main-content" className="skip-link" data-testid="skip-to-content">Skip to content</a>
      <a href="#primary-navigation" className="skip-link" data-testid="skip-to-navigation">Skip to navigation</a>
    </div>
  )
}
