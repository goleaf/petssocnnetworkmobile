export async function uploadProfilePhoto(params: {
  userId: string
  file: File | Blob
  fileName?: string
  onProgress?: (percent: number) => void
  signal?: AbortSignal
}): Promise<{
  profilePhotoUrl: string
  urls: { original: string; large: string; medium: string; small: string; thumbnail: string }
}> {
  const { userId, file, fileName = 'profile.jpg', onProgress, signal } = params
  const formData = new FormData()
  const fileToSend = file instanceof File ? file : new File([file], fileName, { type: 'image/jpeg' })
  formData.append('photo', fileToSend, fileName)

  const url = `/api/users/${encodeURIComponent(userId)}/profile-photo`

  // Use XHR to track upload progress (fetch lacks upload progress events)
  const xhr = new XMLHttpRequest()
  const resPromise = new Promise<{
    profilePhotoUrl: string
    urls: { original: string; large: string; medium: string; small: string; thumbnail: string }
  }>((resolve, reject) => {
    xhr.upload.onprogress = (evt) => {
      if (!onProgress) return
      if (evt.lengthComputable) {
        const percent = Math.round((evt.loaded / evt.total) * 100)
        onProgress(percent)
      }
    }
    xhr.onerror = () => reject(new Error('Upload failed'))
    xhr.onabort = () => reject(new Error('Upload aborted'))
    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText)
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(json)
        } else {
          reject(new Error(json?.error || 'Upload error'))
        }
      } catch (e) {
        reject(new Error('Invalid server response'))
      }
    }
  })

  if (signal) {
    signal.addEventListener('abort', () => {
      try { xhr.abort() } catch {}
    })
  }

  xhr.open('POST', url, true)
  xhr.send(formData)
  return resPromise
}

export async function uploadCoverPhoto(params: {
  userId: string
  file: File | Blob
  fileName?: string
  onProgress?: (percent: number) => void
  signal?: AbortSignal
}): Promise<{ coverPhotoUrl: string; urls: { original: string; large: string; medium: string; small: string } }> {
  const { userId, file, fileName = 'cover.jpg', onProgress, signal } = params
  const formData = new FormData()
  const fileToSend = file instanceof File ? file : new File([file], fileName, { type: 'image/jpeg' })
  formData.append('photo', fileToSend, fileName)

  const url = `/api/users/${encodeURIComponent(userId)}/cover-photo`
  const xhr = new XMLHttpRequest()
  const resPromise = new Promise<{ coverPhotoUrl: string; urls: { original: string; large: string; medium: string; small: string } }>((resolve, reject) => {
    xhr.upload.onprogress = (evt) => {
      if (!onProgress) return
      if (evt.lengthComputable) onProgress(Math.round((evt.loaded / evt.total) * 100))
    }
    xhr.onerror = () => reject(new Error('Upload failed'))
    xhr.onabort = () => reject(new Error('Upload aborted'))
    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText)
        if (xhr.status >= 200 && xhr.status < 300) resolve(json)
        else reject(new Error(json?.error || 'Upload error'))
      } catch {
        reject(new Error('Invalid server response'))
      }
    }
  })
  if (signal) signal.addEventListener('abort', () => { try { xhr.abort() } catch {} })
  xhr.open('POST', url, true)
  xhr.send(formData)
  return resPromise
}

