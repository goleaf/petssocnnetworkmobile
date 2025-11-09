import { getSignedUploadUrl, getImageDimensions } from '@/lib/storage-upload'

export async function uploadImageWithProgress(params: {
  file: File
  folder?: string
  onProgress?: (percent: number) => void
  signal?: AbortSignal
}): Promise<{ url: string; width: number; height: number; size: number; mimeType: string }>
{
  const { file, folder = 'pets', onProgress, signal } = params
  if (!file.type.startsWith('image/')) throw new Error('File must be an image')
  const MAX_SIZE = 10 * 1024 * 1024
  if (file.size > MAX_SIZE) throw new Error('Image size must be less than 10MB')

  const { width, height } = await getImageDimensions(file)
  const extension = file.name.split('.').pop() || 'jpg'
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`
  const { uploadUrl, fileUrl } = await getSignedUploadUrl(fileName, file.type, file.size, folder)

  // PUT via XHR to track progress
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.upload.onprogress = (evt) => {
      if (onProgress && evt.lengthComputable) onProgress(Math.round((evt.loaded / evt.total) * 100))
    }
    xhr.onerror = () => reject(new Error('Upload failed'))
    xhr.onabort = () => reject(new Error('Upload aborted'))
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error(`Upload error: ${xhr.status}`))
    }
    if (signal) signal.addEventListener('abort', () => { try { xhr.abort() } catch {} })
    xhr.open('PUT', uploadUrl, true)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.send(file)
  })

  return { url: fileUrl, width, height, size: file.size, mimeType: file.type }
}

export async function uploadFileWithProgress(params: {
  file: File
  folder?: string
  onProgress?: (percent: number) => void
  signal?: AbortSignal
}): Promise<{ url: string; size: number; mimeType: string }>
{
  const { file, folder = 'pets', onProgress, signal } = params
  const extension = file.name.split('.').pop() || 'dat'
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`
  const { uploadUrl, fileUrl } = await getSignedUploadUrl(fileName, file.type || 'application/octet-stream', file.size, folder)

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.upload.onprogress = (evt) => {
      if (onProgress && evt.lengthComputable) onProgress(Math.round((evt.loaded / evt.total) * 100))
    }
    xhr.onerror = () => reject(new Error('Upload failed'))
    xhr.onabort = () => reject(new Error('Upload aborted'))
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error(`Upload error: ${xhr.status}`))
    }
    if (signal) signal.addEventListener('abort', () => { try { xhr.abort() } catch {} })
    xhr.open('PUT', uploadUrl, true)
    if (file.type) xhr.setRequestHeader('Content-Type', file.type)
    xhr.send(file)
  })

  return { url: fileUrl, size: file.size, mimeType: file.type || 'application/octet-stream' }
}
