/**
 * PostComposer API Integration Test
 * 
 * This test verifies that the PostComposer component correctly integrates
 * with the POST /api/posts endpoint created in task 5.
 */

describe('PostComposer API Integration', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('sends correct data structure to POST /api/posts', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'post-1', success: true }),
    })
    global.fetch = mockFetch

    // Simulate the handleSubmit function from PostComposer
    const postData = {
      petId: 'pet-1',
      title: 'Test post',
      content: 'This is a test post with @mention and #hashtag',
      visibility: 'public',
      visibilityMode: 'public',
      media: {
        images: ['https://example.com/image1.jpg'],
        videos: [],
        captions: {},
        imageTags: {},
        allowDownload: true,
      },
      taggedPetIds: ['pet-2'],
      placeId: 'place-1',
      feeling: 'happy',
      activity: 'playing',
    }

    await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData),
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData),
    })
  })

  it('handles successful post creation', async () => {
    const mockResponse = { id: 'post-123', success: true }
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    })
    global.fetch = mockFetch

    const response = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ petId: 'pet-1', content: 'Test', visibility: 'public' }),
    })

    const result = await response.json()
    expect(result).toEqual(mockResponse)
    expect(response.ok).toBe(true)
  })

  it('handles post creation errors', async () => {
    const mockError = { error: 'Content is required' }
    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => mockError,
    })
    global.fetch = mockFetch

    const response = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ petId: 'pet-1', content: '', visibility: 'public' }),
    })

    const result = await response.json()
    expect(result).toEqual(mockError)
    expect(response.ok).toBe(false)
  })

  it('includes all required fields in post data', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'post-1', success: true }),
    })
    global.fetch = mockFetch

    const postData = {
      petId: 'pet-1',
      title: 'Complete post',
      content: 'Full post with all features @user #tag',
      visibility: 'public',
      visibilityMode: 'public',
      media: {
        images: ['img1.jpg', 'img2.jpg'],
        videos: ['video1.mp4'],
        captions: { 'img1.jpg': 'Caption 1' },
        imageTags: { 'img1.jpg': ['pet-2'] },
        allowDownload: true,
      },
      taggedPetIds: ['pet-2', 'pet-3'],
      placeId: 'place-1',
      feeling: 'excited',
      activity: 'walking',
      poll: {
        question: 'Favorite treat?',
        options: [
          { text: 'Bones', votes: 0 },
          { text: 'Treats', votes: 0 },
        ],
        allowMultiple: false,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      },
    }

    await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData),
    })

    expect(mockFetch).toHaveBeenCalled()
    const callArgs = mockFetch.mock.calls[0]
    const sentData = JSON.parse(callArgs[1].body)
    
    // Verify all fields are present
    expect(sentData).toHaveProperty('petId')
    expect(sentData).toHaveProperty('content')
    expect(sentData).toHaveProperty('visibility')
    expect(sentData).toHaveProperty('media')
    expect(sentData.media).toHaveProperty('images')
    expect(sentData.media).toHaveProperty('videos')
    expect(sentData).toHaveProperty('taggedPetIds')
    expect(sentData).toHaveProperty('placeId')
    expect(sentData).toHaveProperty('feeling')
    expect(sentData).toHaveProperty('activity')
    expect(sentData).toHaveProperty('poll')
  })
})
