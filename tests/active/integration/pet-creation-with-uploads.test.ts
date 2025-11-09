import { initializeStorage, addPet, getPets } from '@/lib/storage'
import type { Pet } from '@/lib/types'
import * as StorageUpload from '../../shims/spyon-storage-upload'

describe('Integration: Pet creation with photo uploads', () => {
  beforeEach(() => {
    initializeStorage()
  })

  it('creates pet record in storage', () => {
    const pet: Pet = {
      id: `pet_${Date.now()}`,
      ownerId: '1',
      name: 'Integration Pup',
      species: 'dog',
      followers: [],
    }
    addPet(pet)
    const all = getPets()
    const found = all.find((p) => p.id === pet.id)
    expect(found).toBeTruthy()
    expect(found?.name).toBe('Integration Pup')
  })

  it('uploads image to storage via signed URL', async () => {
    // Some Jest environments treat module namespace objects as non-configurable, which
    // breaks jest.spyOn on ESM/CJS interop. Prefer the shim's setter when available.
    let getSignedSpy: jest.SpyInstance | jest.Mock
    let ShimRef: any = StorageUpload as any
    if (!ShimRef.__setGetSignedImpl && ShimRef.default) {
      ShimRef = ShimRef.default
    }
    if (ShimRef.__setGetSignedImpl) {
      const spy = jest.fn().mockResolvedValue({
        uploadUrl: 'https://example.storage/upload',
        fileUrl: 'https://cdn.example.com/pets/integration-pup.jpg',
        expiresIn: 300,
      })
      ShimRef.__setGetSignedImpl(spy)
      getSignedSpy = spy as any
    } else {
      // Fallback for environments that allow spyOn
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      getSignedSpy = jest.spyOn(StorageUpload, 'getSignedUploadUrl').mockResolvedValue({
        uploadUrl: 'https://example.storage/upload',
        fileUrl: 'https://cdn.example.com/pets/integration-pup.jpg',
        expiresIn: 300,
      })
    }

    // Use fetch based path to avoid XHR; test uploadImage()
    const file = new File([new Blob(['abc'])], 'test.jpg', { type: 'image/jpeg' })

    // Mock getImageDimensions
    if (ShimRef.__setGetImageDimensionsImpl) {
      ShimRef.__setGetImageDimensionsImpl(jest.fn().mockResolvedValue({ width: 100, height: 100 }))
    } else {
      jest.spyOn(StorageUpload as any, 'getImageDimensions').mockResolvedValue({ width: 100, height: 100 })
    }

    // Mock fetch PUT to signed URL
    const origFetch = global.fetch as jest.Mock
    origFetch.mockImplementation(async (input: any, init?: any) => {
      const url = typeof input === 'string' ? input : input?.toString?.()
      if (url === '/api/upload/signed-url') {
        // next: handled by getSignedUploadUrl spy above; but keep default
      }
      if (url === 'https://example.storage/upload' && init?.method === 'PUT') {
        return new Response('', { status: 200 })
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    })

    const { uploadImage } = await import('../../shims/spyon-storage-upload')
    const result = await uploadImage(file, 'pets')
    expect(getSignedSpy).toHaveBeenCalled()
    expect(result.url).toContain('cdn.example.com/pets/')
    expect(result.width).toBe(100)
    expect(result.height).toBe(100)
  })
})
