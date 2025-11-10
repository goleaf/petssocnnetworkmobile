import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import { LoginForm } from '@/components/auth/login-form'
import { useAuth } from '@/lib/auth'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock auth
jest.mock('@/lib/auth', () => ({
  useAuth: jest.fn(),
}))

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  refresh: jest.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
}

const mockLogin = jest.fn()

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useAuth as jest.Mock).mockReturnValue({
      login: mockLogin,
    })
  })

  it('should render login form', () => {
    render(<LoginForm />)
    expect(screen.getByText('Welcome Back')).toBeInTheDocument()
    expect(screen.getByLabelText('Username')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('should show register link when onSwitchToRegister is provided', () => {
    const onSwitchToRegister = jest.fn()
    render(<LoginForm onSwitchToRegister={onSwitchToRegister} />)
    const registerButton = screen.getByRole('button', { name: /don't have an account/i })
    expect(registerButton).toBeInTheDocument()
  })

  it('should call onSwitchToRegister when register link is clicked', async () => {
    const user = userEvent.setup()
    const onSwitchToRegister = jest.fn()
    render(<LoginForm onSwitchToRegister={onSwitchToRegister} />)
    const registerButton = screen.getByRole('button', { name: /don't have an account/i })
    await user.click(registerButton)
    expect(onSwitchToRegister).toHaveBeenCalledTimes(1)
  })

  it('should handle form submission with valid credentials', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue({ success: true })
    const onSuccess = jest.fn()
    render(<LoginForm onSuccess={onSuccess} />)

    await user.type(screen.getByLabelText('Username'), 'testuser')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123')
      expect(mockRouter.push).toHaveBeenCalledWith('/')
      expect(mockRouter.refresh).toHaveBeenCalled()
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('should display error message on login failure', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue({ success: false, error: 'Invalid credentials' })
    render(<LoginForm />)

    await user.type(screen.getByLabelText('Username'), 'testuser')
    await user.type(screen.getByLabelText('Password'), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('should show loading state during submission', async () => {
    const user = userEvent.setup()
    mockLogin.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100)))
    render(<LoginForm />)

    await user.type(screen.getByLabelText('Username'), 'testuser')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled()
  })

  it('should require username and password', () => {
    render(<LoginForm />)
    const usernameInput = screen.getByLabelText('Username')
    const passwordInput = screen.getByLabelText('Password')
    expect(usernameInput).toBeRequired()
    expect(passwordInput).toBeRequired()
  })

  it('should call onSuccess callback on successful login', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue({ success: true })
    const onSuccess = jest.fn()
    render(<LoginForm onSuccess={onSuccess} />)

    await user.type(screen.getByLabelText('Username'), 'testuser')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
  })
})

