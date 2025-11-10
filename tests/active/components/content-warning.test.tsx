import React from 'react'
import { render, screen } from '@testing-library/react'
import { ContentWarning } from '@/components/content-warning'

describe('ContentWarning', () => {
  it('should return null when no violations', () => {
    const { container } = render(<ContentWarning violations={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('should display violations list', () => {
    const violations = ['Profanity detected', 'Spam pattern found']
    render(<ContentWarning violations={violations} />)
    
    expect(screen.getByText('Content Issues Detected')).toBeInTheDocument()
    expect(screen.getByText('Profanity detected')).toBeInTheDocument()
    expect(screen.getByText('Spam pattern found')).toBeInTheDocument()
  })

  it('should display as warning by default', () => {
    const violations = ['Test violation']
    render(<ContentWarning violations={violations} />)
    
    const alert = screen.getByText('Content Issues Detected').closest('[role="alert"]')
    expect(alert).toBeInTheDocument()
  })

  it('should display as error when type is error', () => {
    const violations = ['Test violation']
    render(<ContentWarning violations={violations} type="error" />)
    
    const alert = screen.getByText('Content Issues Detected').closest('[role="alert"]')
    expect(alert).toBeInTheDocument()
  })

  it('should handle multiple violations', () => {
    const violations = ['Violation 1', 'Violation 2', 'Violation 3']
    render(<ContentWarning violations={violations} />)
    
    violations.forEach(violation => {
      expect(screen.getByText(violation)).toBeInTheDocument()
    })
  })
})

