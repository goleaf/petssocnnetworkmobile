export function isValidUsername(username: string): boolean {
  const u = (username || '').trim()
  return /^[a-zA-Z0-9_\-.]{3,20}$/.test(u)
}

export function isValidEmail(email: string): boolean {
  const e = (email || '').trim()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
}

export function isValidBio(bio: string): boolean {
  if (typeof bio !== 'string') return false
  return bio.length <= 1000
}

