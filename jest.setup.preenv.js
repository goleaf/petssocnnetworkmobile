// Pre-environment Jest setup: mock modules that must be replaced
// before test files import them.

// Spy-friendly mock for storage-upload used by upload tests
jest.mock('@/lib/storage-upload', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const raw = require('./tests/shims/spyon-storage-upload.ts')
  const shim = raw && raw.default ? raw.default : raw
  const proxy = new Proxy(shim, {
    defineProperty(target, prop, descriptor) {
      try {
        if ((prop === 'getSignedUploadUrl' || prop === 'getImageDimensions') && descriptor && 'value' in descriptor && typeof descriptor.value === 'function') {
          if (prop === 'getSignedUploadUrl' && typeof target.__setGetSignedImpl === 'function') {
            target.__setGetSignedImpl(descriptor.value)
            return true
          }
          if (prop === 'getImageDimensions' && typeof target.__setGetImageDimensionsImpl === 'function') {
            target.__setGetImageDimensionsImpl(descriptor.value)
            return true
          }
        }
      } catch {}
      try {
        return Reflect.defineProperty(target, prop, descriptor)
      } catch {
        return false
      }
    },
  })
  return proxy
})

// Intercept Object.defineProperty for module namespace objects to allow jest.spyOn
// on ESM namespace to behave when redefining our storage-upload methods.
;(() => {
  const realDefine = Object.defineProperty
  const realReflectDefine = Reflect.defineProperty
  Object.defineProperty = function (obj, prop, descriptor) {
    try {
      return realDefine(obj, prop, descriptor)
    } catch (e) {
      try {
        const tag = Object.prototype.toString.call(obj)
        if (tag === '[object Module]' && (prop === 'getSignedUploadUrl' || prop === 'getImageDimensions')) {
          // Route to our shim setters instead of redefining the namespace property
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const raw = require('./tests/shims/spyon-storage-upload.ts')
          const shim = raw && raw.default ? raw.default : raw
          if (descriptor && 'value' in descriptor && typeof descriptor.value === 'function') {
            if (prop === 'getSignedUploadUrl' && typeof shim.__setGetSignedImpl === 'function') {
              shim.__setGetSignedImpl(descriptor.value)
              return obj
            }
            if (prop === 'getImageDimensions' && typeof shim.__setGetImageDimensionsImpl === 'function') {
              shim.__setGetImageDimensionsImpl(descriptor.value)
              return obj
            }
          }
        }
      } catch {}
      throw e
    }
  }
  // Patch Reflect.defineProperty as well
  Reflect.defineProperty = function (obj, prop, descriptor) {
    try {
      return realReflectDefine(obj, prop, descriptor)
    } catch (e) {
      try {
        const tag = Object.prototype.toString.call(obj)
        if (tag === '[object Module]' && (prop === 'getSignedUploadUrl' || prop === 'getImageDimensions')) {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const raw = require('./tests/shims/spyon-storage-upload.ts')
          const shim = raw && raw.default ? raw.default : raw
          if (descriptor && 'value' in descriptor && typeof descriptor.value === 'function') {
            if (prop === 'getSignedUploadUrl' && typeof shim.__setGetSignedImpl === 'function') {
              shim.__setGetSignedImpl(descriptor.value)
              return true
            }
            if (prop === 'getImageDimensions' && typeof shim.__setGetImageDimensionsImpl === 'function') {
              shim.__setGetImageDimensionsImpl(descriptor.value)
              return true
            }
          }
        }
      } catch {}
      throw e
    }
  }
})()
