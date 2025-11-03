// Learn more: https://github.com/testing-library/jest-dom

// Fix React 19 compatibility - use manual mock
// React 19 moved act from react-dom/test-utils to react
// The testing library checks React.act first, then falls back to react-dom/test-utils.act
jest.mock('react', () => {
  const originalReact = jest.requireActual('react')
  const { act } = originalReact
  
  // Create React object with act attached
  const React = {
    ...originalReact,
    act,
  }
  
  // Ensure all named exports are available
  Object.keys(originalReact).forEach((key) => {
    if (!React[key]) {
      React[key] = originalReact[key]
    }
  })
  
  // Also ensure default export has act
  if (React.default) {
    React.default = {
      ...React.default,
      act,
    }
  } else {
    React.default = React
  }
  
  return React
})

// Patch react-dom/test-utils.act as fallback
const ReactDOMTestUtils = require('react-dom/test-utils')
const { act } = require('react')
if (ReactDOMTestUtils && !ReactDOMTestUtils.act) {
  ReactDOMTestUtils.act = act
}

// Now import testing library after React is mocked
import '@testing-library/jest-dom'

// Polyfill TextEncoder/TextDecoder for Node.js environments
import { TextEncoder, TextDecoder } from 'util'
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

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
}

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

