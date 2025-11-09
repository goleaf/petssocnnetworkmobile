import { isValidUsername, isValidEmail, isValidBio } from '@/lib/utils/validators'

describe('Profile field validation', () => {
  test('username format allows letters, numbers, underscore, hyphen, dot (3-20)', () => {
    expect(isValidUsername('john_doe')).toBe(true)
    expect(isValidUsername('john-doe')).toBe(true)
    expect(isValidUsername('john.doe')).toBe(true)
    expect(isValidUsername('a1_-.')).toBe(true)
    expect(isValidUsername('ab')).toBe(false) // too short
    expect(isValidUsername('this_is_way_too_long_for_username')).toBe(false)
    expect(isValidUsername('inv@lid')).toBe(false)
    expect(isValidUsername('white space')).toBe(false)
  })

  test('email format basic validation', () => {
    expect(isValidEmail('user@example.com')).toBe(true)
    expect(isValidEmail('user.name+tag@example.co.uk')).toBe(true)
    expect(isValidEmail('invalid-email')).toBe(false)
    expect(isValidEmail('user@')).toBe(false)
    expect(isValidEmail('user@domain')).toBe(false)
  })

  test('bio length must be <= 1000 chars', () => {
    expect(isValidBio('short')).toBe(true)
    expect(isValidBio('a'.repeat(1000))).toBe(true)
    expect(isValidBio('a'.repeat(1001))).toBe(false)
  })
})

