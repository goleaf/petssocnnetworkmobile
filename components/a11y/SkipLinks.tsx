import type React from "react"

export function SkipLinks(): React.ReactElement {
  return (
    <div>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <a href="#primary-navigation" className="skip-link">Skip to navigation</a>
    </div>
  )
}

