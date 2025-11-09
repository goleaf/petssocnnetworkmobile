import React from 'react'
import { render } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import DashboardPage from '../page'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
}

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
  })

  it('should redirect to home page', () => {
    render(<DashboardPage />)
    expect(mockRouter.replace).toHaveBeenCalledWith('/')
  })

  it('should render nothing', () => {
    const { container } = render(<DashboardPage />)
    expect(container.firstChild).toBeNull()
  })
})

