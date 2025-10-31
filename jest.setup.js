// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// React 19 compatibility fix
// Strategy: Patch react-dom/test-utils to provide act that doesn't require React.act
// Then set React.act to use that implementation
jest.mock('react-dom/test-utils', () => {
  const actualTestUtils = jest.requireActual('react-dom/test-utils')
  
  // Get the internal act implementation
  // We need to bypass the React.act check in react-dom/test-utils
  const React = jest.requireActual('react')
  
  // Create act that directly uses React's scheduler without calling React.act
  // This is a workaround - we'll use the internal implementation
  const internalAct = (callback) => {
    // Use React's internal scheduler
    const ReactDOM = require('react-dom')
    
    // Try to use flushSync which is the internal mechanism act uses
    if (ReactDOM.flushSync) {
      try {
        return ReactDOM.flushSync(callback)
      } catch (error) {
        // If flushSync fails (e.g., during passive effects), use originalAct
        // but ensure React.act exists first
        if (!React.act) {
          React.act = internalAct
        }
        return actualTestUtils.act(callback)
      }
    }
    
    // Fallback: use the actual test-utils act (it will work once React.act is set)
    if (!React.act) {
      React.act = internalAct
    }
    return actualTestUtils.act(callback)
  }
  
  // Set React.act first so actualTestUtils.act can use it if needed
  if (!React.act) {
    React.act = internalAct
  }
  
  return {
    ...actualTestUtils,
    act: React.act || internalAct,
  }
})

// Now mock react to provide React.act
jest.mock('react', () => {
  const actualReact = jest.requireActual('react')
  const testUtils = require('react-dom/test-utils')
  
  if (!actualReact.act) {
    actualReact.act = testUtils.act
  }
  
  return actualReact
})

import * as React from 'react'

// Ensure React is available globally
global.React = React

// Export act for tests
if (React.act) {
  global.act = React.act
}

// Mock date-fns to avoid locale issues in tests
// Uses manual mock from __mocks__/date-fns.js
jest.mock('date-fns')

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      refresh: jest.fn(),
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

// Clear localStorage before each test
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

