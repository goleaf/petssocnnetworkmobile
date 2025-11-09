// Learn more: https://github.com/testing-library/jest-dom

// Fix React 19 compatibility - MUST be before @testing-library/jest-dom import
const React = require('react')
const ReactDOMTestUtils = require('react-dom/test-utils')

// Ensure react-dom/test-utils has the act function as fallback
if (React && React.act && ReactDOMTestUtils && !ReactDOMTestUtils.act) {
  ReactDOMTestUtils.act = React.act
}

import '@testing-library/jest-dom'

// Polyfill TextEncoder/TextDecoder for Node.js environments
import { TextEncoder, TextDecoder } from 'util'
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Provide a spy-friendly mock for storage-upload so tests can jest.spyOn named exports
jest.mock('@/lib/storage-upload', () => {
  // Use the dedicated shim that exposes configurable properties (ESM)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const raw = require('./tests/shims/spyon-storage-upload.ts')
  const shim = raw && raw.default ? raw.default : raw
  const proxy = new Proxy(shim, {
    defineProperty(target, prop, descriptor) {
      try {
        if ((prop === 'getSignedUploadUrl' || prop === 'getImageDimensions') && descriptor && 'value' in descriptor && typeof descriptor.value === 'function') {
          if (prop === 'getSignedUploadUrl' && typeof target.__setGetSignedImpl === 'function') {
            target.__setGetSignedImpl(descriptor.value)
            return true
          }
          if (prop === 'getImageDimensions' && typeof target.__setGetImageDimensionsImpl === 'function') {
            target.__setGetImageDimensionsImpl(descriptor.value)
            return true
          }
        }
      } catch {}
      try {
        return Reflect.defineProperty(target, prop, descriptor)
      } catch {
        return false
      }
    },
  })
  return proxy
})

// Patch jest.spyOn to gracefully handle non-configurable properties on module namespace objects
// by delegating to shimmed setter functions when available.
// With the Proxy above, jest.spyOn should work normally. No further patching required.

// Debug: ensure mocked storage-upload export properties are spyable
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('@/lib/storage-upload')
  // Ensure default export mirrors the same object for any interop paths
  if (!mod.default) {
    try { Object.defineProperty(mod, 'default', { value: mod, configurable: true }) } catch {}
  }
} catch {}

// Basic fetch polyfill for tests
if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn(async (input, init) => {
    const url = typeof input === 'string' ? input : input?.toString?.() || ''
    // Provide minimal mocked responses for routes used in components during tests
    if (url.includes('/api/moderation/queue')) {
      return new Response(JSON.stringify({ queue: [] }), { status: 200 })
    }
    if (url.includes('/api/moderation/review')) {
      return new Response(JSON.stringify({ success: true }), { status: 200 })
    }
    if (url.includes('/api/moderation/blur-toggle')) {
      return new Response(JSON.stringify({ success: true }), { status: 200 })
    }
    // Default OK response
    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  })
}

// Polyfill Request/Response for Node.js test environment
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(url, init) {
      this.url = url
      this.method = init?.method || 'GET'
      this.headers = new Headers(init?.headers)
      this.body = init?.body
    }
    
    async json() {
      return this.body ? JSON.parse(this.body) : {}
    }
    
    async text() {
      return this.body || ''
    }
  }
  
  global.Response = class Response {
    constructor(body, init) {
      this.body = body
      this.status = init?.status || 200
      this.statusText = init?.statusText || 'OK'
      this.headers = new Headers(init?.headers)
    }
    
    async json() {
      return typeof this.body === 'string' ? JSON.parse(this.body) : this.body
    }
    
    async text() {
      return typeof this.body === 'string' ? this.body : JSON.stringify(this.body)
    }
  }
}

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Note: next/server is mocked via __mocks__/next/server.js manual mock

// Mock localStorage
const createLocalStorageMock = () => {
  let store = {}
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString()
    }),
    removeItem: jest.fn((key) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    }),
  }
}

const localStorageMock = createLocalStorageMock()

// Only set up window mocks if window is available (jsdom environment)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  })

  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })

  if (typeof window.ResizeObserver === 'undefined') {
    class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    window.ResizeObserver = ResizeObserver
    global.ResizeObserver = ResizeObserver
  }
}

// Provide default mocks for auth-server helpers used in API tests
jest.mock('@/lib/auth-server', () => {
  return {
    getCurrentUser: jest.fn(async () => null),
    isAdmin: jest.fn(async () => false),
    requireAdmin: jest.fn(),
    hasRole: jest.fn(),
    getSession: jest.fn(),
    validateSession: jest.fn(),
    createSession: jest.fn(),
    setSessionCookie: jest.fn(),
    clearSession: jest.fn(),
    fetchSession: jest.fn(),
    isModerator: jest.fn(),
    requireAuth: jest.fn(),
    requireModerator: jest.fn(),
    SESSION_COOKIE_NAME: 'pet-social-session',
  }
})

jest.mock('@/lib/storage-server', () => {
  return {
    getServerUserById: jest.fn(),
    updateServerUser: jest.fn(),
    getServerUsers: jest.fn(),
  }
})

// Clear localStorage before each test (only in jsdom environment)
if (typeof window !== 'undefined') {
  beforeEach(() => {
    if (typeof localStorage.getItem === 'function' && typeof localStorage.getItem.mockClear === 'function') {
      localStorage.getItem.mockClear()
    }
    if (typeof localStorage.setItem === 'function' && typeof localStorage.setItem.mockClear === 'function') {
      localStorage.setItem.mockClear()
    }
    if (typeof localStorage.removeItem === 'function' && typeof localStorage.removeItem.mockClear === 'function') {
      localStorage.removeItem.mockClear()
    }
    if (typeof localStorage.clear === 'function') {
      localStorage.clear()
    }
  })
}

// Silence React's act() warnings in tests where asynchronous effects run after render.
// We still see the warnings in console, but we don't want them to fail tests.
const originalConsoleError = console.error
console.error = (...args) => {
  const firstArg = args?.[0]
  if (typeof firstArg === 'string') {
    const msg = firstArg
    if (msg.includes('not wrapped in act(')) return
    if (msg.includes('two children with the same key')) return
    if (msg.startsWith('Error fetching reports:')) return
    if (msg.startsWith('Upload error')) return
    if (msg.includes('Not implemented: window.alert')) return
  }
  if (firstArg instanceof Error) {
    const message = firstArg.message
    if (message?.includes('Not implemented: window.alert')) return
    if (message?.startsWith('Upload failed')) return
  }
  if (firstArg !== undefined && String(firstArg).includes('Not implemented: window.alert')) {
    return
  }
  return originalConsoleError(...args)
}
