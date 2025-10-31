import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import { RegisterForm } from '../register-form'
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

const mockRegister = jest.fn()

describe('RegisterForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useAuth as jest.Mock).mockReturnValue({
      register: mockRegister,
    })
  })

  it('should render register form', () => {
    render(<RegisterForm />)
    expect(screen.getAllByText('Create Account').length).toBeGreaterThan(0)
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Username')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /create account/i }).length).toBeGreaterThan(0)
  })

  it('should show login link when onSwitchToLogin is provided', () => {
    const onSwitchToLogin = jest.fn()
    render(<RegisterForm onSwitchToLogin={onSwitchToLogin} />)
    const loginButton = screen.getByRole('button', { name: /already have an account/i })
    expect(loginButton).toBeInTheDocument()
  })

  it('should call onSwitchToLogin when login link is clicked', async () => {
    const user = userEvent.setup()
    const onSwitchToLogin = jest.fn()
    render(<RegisterForm onSwitchToLogin={onSwitchToLogin} />)
    const loginButton = screen.getByRole('button', { name: /already have an account/i })
    await user.click(loginButton)
    expect(onSwitchToLogin).toHaveBeenCalledTimes(1)
  })

  it('should handle form submission with valid data', async () => {
    const user = userEvent.setup()
    mockRegister.mockResolvedValue({ success: true })
    const onSuccess = jest.fn()
    render(<RegisterForm onSuccess={onSuccess} />)

    await user.type(screen.getByLabelText('Full Name'), 'John Doe')
    await user.type(screen.getByLabelText('Username'), 'johndoe')
    await user.type(screen.getByLabelText('Email'), 'john@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.type(screen.getByLabelText('Confirm Password'), 'password123')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        email: 'john@example.com',
        password: 'password123',
        username: 'johndoe',
        fullName: 'John Doe',
      })
      expect(mockRouter.push).toHaveBeenCalledWith('/')
      expect(mockRouter.refresh).toHaveBeenCalled()
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('should display error when passwords do not match', async () => {
    const user = userEvent.setup()
    render(<RegisterForm />)

    await user.type(screen.getByLabelText('Full Name'), 'John Doe')
    await user.type(screen.getByLabelText('Username'), 'johndoe')
    await user.type(screen.getByLabelText('Email'), 'john@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.type(screen.getByLabelText('Confirm Password'), 'different')
    
    const submitButton = screen.getAllByRole('button', { name: /create account/i })[0]
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    }, { timeout: 3000 })
    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('should display error when password is too short', async () => {
    const user = userEvent.setup()
    render(<RegisterForm />)

    await user.type(screen.getByLabelText('Full Name'), 'John Doe')
    await user.type(screen.getByLabelText('Username'), 'johndoe')
    await user.type(screen.getByLabelText('Email'), 'john@example.com')
    await user.type(screen.getByLabelText('Password'), '12345')
    await user.type(screen.getByLabelText('Confirm Password'), '12345')
    
    const submitButton = screen.getAllByRole('button', { name: /create account/i })[0]
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument()
    }, { timeout: 3000 })
    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('should display error on registration failure', async () => {
    const user = userEvent.setup()
    mockRegister.mockResolvedValue({ success: false, error: 'Email already exists' })
    render(<RegisterForm />)

    await user.type(screen.getByLabelText('Full Name'), 'John Doe')
    await user.type(screen.getByLabelText('Username'), 'johndoe')
    await user.type(screen.getByLabelText('Email'), 'john@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.type(screen.getByLabelText('Confirm Password'), 'password123')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument()
    })
  })

  it('should show loading state during submission', async () => {
    const user = userEvent.setup()
    mockRegister.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100)))
    render(<RegisterForm />)

    await user.type(screen.getByLabelText('Full Name'), 'John Doe')
    await user.type(screen.getByLabelText('Username'), 'johndoe')
    await user.type(screen.getByLabelText('Email'), 'john@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.type(screen.getByLabelText('Confirm Password'), 'password123')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(screen.getByRole('button', { name: /create account/i })).toBeDisabled()
  })

  it('should require all fields', () => {
    render(<RegisterForm />)
    expect(screen.getByLabelText('Full Name')).toBeRequired()
    expect(screen.getByLabelText('Username')).toBeRequired()
    expect(screen.getByLabelText('Email')).toBeRequired()
    expect(screen.getByLabelText('Password')).toBeRequired()
    expect(screen.getByLabelText('Confirm Password')).toBeRequired()
  })

  it('should call onSuccess callback on successful registration', async () => {
    const user = userEvent.setup()
    mockRegister.mockResolvedValue({ success: true })
    const onSuccess = jest.fn()
    render(<RegisterForm onSuccess={onSuccess} />)

    await user.type(screen.getByLabelText('Full Name'), 'John Doe')
    await user.type(screen.getByLabelText('Username'), 'johndoe')
    await user.type(screen.getByLabelText('Email'), 'john@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.type(screen.getByLabelText('Confirm Password'), 'password123')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
  })
})

