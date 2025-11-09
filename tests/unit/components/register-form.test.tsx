import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import { RegisterForm } from '@/components/auth/register-form'
import { useAuth } from '@/lib/auth'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

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
const mockFetch = jest.fn()

const mockUsernameAvailable = () => {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ available: true }),
  })
}

const waitForUsernameAvailability = async () => {
  await waitFor(() => expect(mockFetch).toHaveBeenCalled())
  await waitFor(() => expect(screen.getByRole('button', { name: /create account/i })).not.toBeDisabled())
}

const fillRequiredFields = async (
  user: ReturnType<typeof userEvent.setup>,
  overrides: {
    fullName?: string
    username?: string
    email?: string
    password?: string
    confirmPassword?: string
    dateOfBirth?: string
    acceptPolicies?: boolean
    waitForUsername?: boolean
  } = {},
) => {
  const {
    fullName = 'John Doe',
    username = 'johndoe',
    email = 'john@example.com',
    password = 'Password1!',
    confirmPassword = password,
    dateOfBirth = '2000-01-01',
    acceptPolicies = true,
    waitForUsername = true,
  } = overrides

  await user.type(screen.getByLabelText('Full Name'), fullName)
  await user.type(screen.getByLabelText('Username'), username)
  await user.type(screen.getByLabelText('Email'), email)
  await user.type(screen.getByLabelText('Password'), password)
  await user.type(screen.getByLabelText('Confirm Password'), confirmPassword)
  await user.type(screen.getByLabelText('Date of Birth'), dateOfBirth)

  if (acceptPolicies) {
    await user.click(screen.getByLabelText(/i agree to/i))
  }

  if (waitForUsername) {
    await waitForUsernameAvailability()
  }
}

describe('RegisterForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUsernameAvailable()
    mockFetch.mockClear()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useAuth as jest.Mock).mockReturnValue({
      register: mockRegister,
    })
    ;(global as any).fetch = mockFetch
  })

  it('should render register form with new fields', () => {
    render(<RegisterForm />)
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Username')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Date of Birth')).toBeInTheDocument()
    expect(screen.getByLabelText(/i agree to/i)).toBeInTheDocument()
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
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    mockRegister.mockResolvedValue({ success: true, requiresVerification: true, verificationExpiresAt: expiresAt })
    const onSuccess = jest.fn()
    render(<RegisterForm onSuccess={onSuccess} />)

    await fillRequiredFields(user)
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        email: 'john@example.com',
        password: 'Password1!',
        username: 'johndoe',
        fullName: 'John Doe',
        dateOfBirth: '2000-01-01',
        acceptedPolicies: true,
      })
      expect(onSuccess).toHaveBeenCalled()
      expect(screen.getByText(/verification link/i)).toBeInTheDocument()
    })
  })

  it('should display error when passwords do not match', async () => {
    const user = userEvent.setup()
    render(<RegisterForm />)

    await fillRequiredFields(user, { confirmPassword: 'differentpassword' })
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getAllByText(/passwords do not match/i).length).toBeGreaterThan(0)
    })
    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('should display error when password is too short', async () => {
    const user = userEvent.setup()
    render(<RegisterForm />)

    await fillRequiredFields(user, { password: 'Short1!', confirmPassword: 'Short1!' })
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByText(/uppercase, lowercase, number, and special character/i)).toBeInTheDocument()
    })
    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('should block underage users', async () => {
    const user = userEvent.setup()
    render(<RegisterForm />)

    await fillRequiredFields(user, { dateOfBirth: '2015-01-01' })
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByText(/at least 13 years old/i)).toBeInTheDocument()
    })
    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('should require accepting terms', async () => {
    const user = userEvent.setup()
    render(<RegisterForm />)

    await fillRequiredFields(user, { acceptPolicies: false })
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByText(/please accept the terms/i)).toBeInTheDocument()
    })
    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('should display error on registration failure', async () => {
    const user = userEvent.setup()
    mockRegister.mockResolvedValue({ success: false, error: 'Email already exists' })
    render(<RegisterForm />)

    await fillRequiredFields(user)
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument()
    })
  })

  it('should redirect when session is created immediately', async () => {
    const user = userEvent.setup()
    mockRegister.mockResolvedValue({ success: true, sessionCreated: true })
    render(<RegisterForm />)

    await fillRequiredFields(user)
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/')
      expect(mockRouter.refresh).toHaveBeenCalled()
    })
  })

  it('should show loading state during submission', async () => {
    const user = userEvent.setup()
    mockRegister.mockImplementation(
      () =>
        new Promise((resolve) => setTimeout(() => resolve({ success: true, requiresVerification: true }), 50)),
    )
    render(<RegisterForm />)

    await fillRequiredFields(user)
    const submitButton = screen.getByRole('button', { name: /create account/i })
    await user.click(submitButton)

    expect(submitButton).toBeDisabled()
  })

  it('should mark inputs as required', () => {
    render(<RegisterForm />)
    expect(screen.getByLabelText('Full Name')).toBeRequired()
    expect(screen.getByLabelText('Username')).toBeRequired()
    expect(screen.getByLabelText('Email')).toBeRequired()
    expect(screen.getByLabelText('Password')).toBeRequired()
    expect(screen.getByLabelText('Confirm Password')).toBeRequired()
    expect(screen.getByLabelText('Date of Birth')).toBeRequired()
  })

  it('should call onSuccess callback on successful registration', async () => {
    const user = userEvent.setup()
    mockRegister.mockResolvedValue({ success: true })
    const onSuccess = jest.fn()
    render(<RegisterForm onSuccess={onSuccess} />)

    await fillRequiredFields(user)
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
  })
})
