// Jest-only shim to make '@/lib/storage-upload' spyable with jest.spyOn.
// Export as ESM so that wildcard imports yield a plain object with
// configurable properties, allowing jest.spyOn to redefine them.

export type SignedUploadUrlResponse = {
  uploadUrl: string
  fileUrl: string
  expiresIn: number
}

let __getSignedImpl = async (
  _fileName: string,
  _fileType: string,
  _fileSize: number,
  _folder = 'articles',
): Promise<SignedUploadUrlResponse> => ({ uploadUrl: 'https://example.test/upload', fileUrl: 'https://example.test/file.jpg', expiresIn: 300 })

export const __setGetSignedImpl = (fn: typeof __getSignedImpl) => { __getSignedImpl = fn }
export const __getGetSignedImpl = () => __getSignedImpl

export const getSignedUploadUrl = async (
  fileName: string,
  fileType: string,
  fileSize: number,
  folder = 'articles',
): Promise<SignedUploadUrlResponse> => {
  return __getSignedImpl(fileName, fileType, fileSize, folder)
}

export const uploadFileToStorage = async (_file: File, _signedUrl: string): Promise<void> => {
  // no-op in tests
}

let __getImageDimsImpl = async (_file: File): Promise<{ width: number; height: number }> => ({ width: 1, height: 1 })
export const __setGetImageDimensionsImpl = (fn: typeof __getImageDimsImpl) => { __getImageDimsImpl = fn }
export const __getGetImageDimensionsImpl = () => __getImageDimsImpl

export const getImageDimensions = async (file: File): Promise<{ width: number; height: number }> => {
  return __getImageDimsImpl(file)
}

export const uploadImage = async (file: File, folder: string = 'articles') => {
  if (!file || typeof file !== 'object') throw new Error('File must be an image')
  if (!file.type || !String(file.type).startsWith('image/')) {
    throw new Error('File must be an image')
  }
  const MAX_SIZE = 10 * 1024 * 1024
  if (file.size > MAX_SIZE) {
    throw new Error('Image size must be less than 10MB')
  }

  const dims = await __getImageDimsImpl(file)
  const extension = String(file.name || '').split('.').pop() || 'jpg'
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`
  const { uploadUrl, fileUrl } = await __getSignedImpl(fileName, file.type, file.size, folder)
  await uploadFileToStorage(file, uploadUrl)
  return {
    url: fileUrl,
    width: dims.width,
    height: dims.height,
    size: file.size,
    mimeType: file.type,
    isFlagged: false,
    blurOnWarning: true,
  }
}

const defaultExport = {
  getSignedUploadUrl,
  uploadFileToStorage,
  getImageDimensions,
  uploadImage,
}

export default defaultExport
