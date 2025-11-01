// Manual mock for date-fns
const actualDateFns = jest.requireActual('date-fns')

const formatDistanceToNowFn = (date, options) => {
  const now = new Date()
  const dateObj = date instanceof Date ? date : new Date(date)
  const diffMs = Math.abs(now.getTime() - dateObj.getTime())
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 60) {
    return options?.addSuffix ? `${diffMins} minutes ago` : `${diffMins} minutes`
  } else if (diffHours < 24) {
    return options?.addSuffix ? `${diffHours} hours ago` : `${diffHours} hours`
  } else {
    return options?.addSuffix ? `${diffDays} days ago` : `${diffDays} days`
  }
}

// Create a minimal mock that only exports what we need
const mockModule = {
  ...actualDateFns,
  formatDistanceToNow: formatDistanceToNowFn,
  __esModule: true,
}

mockModule.default = mockModule

module.exports = mockModule

