import React from 'react'
import { render } from '@testing-library/react'
import ProfileHeader from '@/components/profile/ProfileHeader'

const baseUser = {
  id: 'u1',
  email: 'u1@example.com',
  username: 'uploader',
  fullName: 'Uploader User',
  joinedAt: '2023-06-15T00:00:00.000Z',
  followers: [],
  following: [],
  avatar: '/avatar.png',
  coverPhoto: '/cover.jpg',
  location: 'Berlin, Germany',
}

describe('ProfileHeader uploads', () => {
  beforeEach(() => {
    if (typeof global.fetch === 'function' && 'mockClear' in (global.fetch as any)) {
      (global.fetch as jest.Mock).mockClear()
    }
  })

  it('posts avatar to profile-photo endpoint', async () => {
    const { container } = render(
      <ProfileHeader user={{ ...baseUser }} isOwnProfile postsCount={0} />,
    )
    const inputs = container.querySelectorAll('input[type="file"]')
    // First input is cover, second is avatar according to component structure
    const avatarInput = inputs[1] as HTMLInputElement
    const file = new File([new Uint8Array([1,2,3])], 'avatar.jpg', { type: 'image/jpeg' })
    const ev = new Event('change', { bubbles: true })
    Object.defineProperty(avatarInput, 'files', { value: [file] })
    avatarInput.dispatchEvent(ev)

    // fetch called with profile-photo endpoint
    expect(global.fetch).toHaveBeenCalled()
    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string
    expect(url).toBe(`/api/users/${baseUser.id}/profile-photo`)
  })

  it('posts cover to cover-photo endpoint', async () => {
    const { container } = render(
      <ProfileHeader user={{ ...baseUser }} isOwnProfile postsCount={0} />,
    )
    const inputs = container.querySelectorAll('input[type="file"]')
    const coverInput = inputs[0] as HTMLInputElement
    const file = new File([new Uint8Array([4,5,6])], 'cover.jpg', { type: 'image/jpeg' })
    const ev = new Event('change', { bubbles: true })
    Object.defineProperty(coverInput, 'files', { value: [file] })
    coverInput.dispatchEvent(ev)

    expect(global.fetch).toHaveBeenCalled()
    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string
    expect(url).toBe(`/api/users/${baseUser.id}/cover-photo`)
  })
})

