export type ServerUsernameHistory = {
  userId: string
  previousUsername: string
  newUsername: string
  changedAt: string
}

let USERNAME_HISTORY: ServerUsernameHistory[] = []

export function getServerUsernameHistory(): ServerUsernameHistory[] {
  return USERNAME_HISTORY
}

export function addServerUsernameHistory(record: ServerUsernameHistory) {
  USERNAME_HISTORY.push(record)
}

export function isUsernameReservedByOther(username: string, currentUserId?: string): boolean {
  const candidate = username.toLowerCase()
  return USERNAME_HISTORY.some((r) => r.previousUsername.toLowerCase() === candidate && r.userId !== currentUserId)
}

export function isUsernameReservedWithinDays(username: string, days: number, currentUserId?: string): boolean {
  const candidate = username.toLowerCase()
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  return USERNAME_HISTORY.some(
    (r) => r.userId !== currentUserId && r.previousUsername.toLowerCase() === candidate && new Date(r.changedAt).getTime() >= cutoff,
  )
}
