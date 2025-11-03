// Mock React to ensure React.act is available for React 19 compatibility
const actualReact = jest.requireActual('react')
const { act } = actualReact

// Create React object with act attached
const React = {
  ...actualReact,
  act,
}

// Ensure default export has act too
if (React.default) {
  React.default.act = act
}

// Also ensure named export act exists
React.act = act

module.exports = React
module.exports.act = act


