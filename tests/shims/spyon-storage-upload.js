// Jest-only shim to make '@/lib/storage-upload' spyable with jest.spyOn.
// It re-exports a mutable object and rebinds uploadImage to call through
// the shim's own methods so spies are observed.

// Pure mockable shim for '@/lib/storage-upload' used only in tests
const shim = {}

Object.defineProperty(shim, '__esModule', { value: true })

// Spyable functions (jest.spyOn will override these)
Object.defineProperty(shim, 'getSignedUploadUrl', {
  value: async function getSignedUploadUrl() {
    return { uploadUrl: 'https://example.test/upload', fileUrl: 'https://example.test/file.jpg', expiresIn: 300 }
  },
  writable: true,
  enumerable: true,
  configurable: true,
})

Object.defineProperty(shim, 'uploadFileToStorage', {
  value: async function uploadFileToStorage() { /* no-op in tests */ },
  writable: true,
  enumerable: true,
  configurable: true,
})

Object.defineProperty(shim, 'getImageDimensions', {
  value: async function getImageDimensions() { return { width: 1, height: 1 } },
  writable: true,
  enumerable: true,
  configurable: true,
})

Object.defineProperty(shim, 'uploadImage', {
  value: async function uploadImage(file, folder = 'articles') {
    if (!file || typeof file !== 'object') throw new Error('File must be an image')
    if (!file.type || !String(file.type).startsWith('image/')) {
      throw new Error('File must be an image')
    }
    const MAX_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      throw new Error('Image size must be less than 10MB')
    }

    const dims = await shim.getImageDimensions(file)
    const extension = String(file.name || '').split('.').pop() || 'jpg'
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`
    const { uploadUrl, fileUrl } = await shim.getSignedUploadUrl(fileName, file.type, file.size, folder)
    await shim.uploadFileToStorage(file, uploadUrl)
    return {
      url: fileUrl,
      width: dims.width,
      height: dims.height,
      size: file.size,
      mimeType: file.type,
      isFlagged: false,
      blurOnWarning: true,
    }
  },
  writable: true,
  enumerable: true,
  configurable: true,
})

module.exports = shim
