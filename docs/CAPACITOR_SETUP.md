# Capacitor Setup Documentation

This document outlines the Capacitor integration for the PawSocial mobile app, including deep links, camera uploads, and push notifications.

## Configuration Summary

### Capacitor Config (`capacitor.config.ts`)
- **App ID**: `com.pawsocial.app`
- **App Name**: PawSocial
- **Web Directory**: `out` (Next.js static export)
- **Android Path**: `mobile/android`
- **Deep Link Scheme**: `mypets://`
- **Asset Server**: Configured for development with cleartext traffic

### Android Manifest (`mobile/android/app/src/main/AndroidManifest.xml`)
- Deep link intent filter: `mypets://wiki/*`
- Camera permissions (including Android 13+ media permissions)
- Filesystem permissions
- Push notification permissions (FCM)
- File provider for file sharing

## Installed Plugins

The following Capacitor plugins have been installed:

1. **@capacitor/app** - App lifecycle and deep link handling
2. **@capacitor/camera** - Camera access and photo capture
3. **@capacitor/filesystem** - File system operations
4. **@capacitor/splash-screen** - Splash screen control
5. **@capacitor/push-notifications** - Push notifications (FCM)

## Deep Link Handling

### URL Scheme
- **Scheme**: `mypets://`
- **Pattern**: `mypets://wiki/:slug`

### Implementation
The deep link handler is implemented in `components/deep-link-handler.tsx` and automatically registered in `app/layout.tsx`. It:

1. Listens for `appUrlOpen` events from Capacitor
2. Parses `mypets://wiki/:slug` URLs
3. Routes to `/wiki/:slug` in the Next.js app
4. Falls back to `/wiki` if no slug is provided

### Example Deep Links
- `mypets://wiki/dog-care-guide` → Opens `/wiki/dog-care-guide`
- `mypets://wiki` → Opens `/wiki` (wiki index)

### Testing Deep Links

#### Via ADB (Android Debug Bridge)
```bash
# Test deep link with slug
adb shell am start -a android.intent.action.VIEW -d "mypets://wiki/test-article" com.pawsocial.app

# Test deep link without slug
adb shell am start -a android.intent.action.VIEW -d "mypets://wiki" com.pawsocial.app
```

#### Instrumented Tests
Run the instrumented tests located at:
```
mobile/android/app/src/androidTest/java/com/pawsocial/app/DeepLinkInstrumentedTest.java
```

## Camera Upload Flow

The camera plugin is configured to work with the wiki image upload functionality. A utility is provided at `lib/utils/camera.ts` for easy integration.

### Usage Example

```typescript
import { capturePhoto, pickPhoto, isCapacitorAvailable } from "@/lib/utils/camera"

// In your component
const handleCameraUpload = async () => {
  try {
    if (!isCapacitorAvailable()) {
      // Fallback to file input in web
      alert("Camera is only available in the mobile app")
      return
    }

    const photo = await capturePhoto({
      quality: 90,
      allowEditing: true,
      source: CameraSource.Camera, // or CameraSource.Photos for gallery
    })

    // Use the dataUrl (base64) in your form
    setFormData({ ...formData, coverImage: photo.dataUrl })
  } catch (error) {
    console.error("Camera error:", error)
    // Handle error (user cancelled, permission denied, etc.)
  }
}
```

### Camera Permissions
- `CAMERA` - Required for taking photos
- `READ_MEDIA_IMAGES` - Required for Android 13+ to read saved photos
- `READ_EXTERNAL_STORAGE` (max SDK 32) - Legacy storage access
- `WRITE_EXTERNAL_STORAGE` (max SDK 29) - Legacy write access

### Integration with Wiki Form

To add camera upload to the wiki form, you can:

1. Import the camera utility: `import { capturePhoto, pickPhoto } from "@/lib/utils/camera"`
2. Add a button next to the cover image URL input
3. Call `capturePhoto()` or `pickPhoto()` when clicked
4. Set the returned `dataUrl` as the `coverImage` value in the form

The data URL format (base64) works directly with the current wiki form implementation.

## Push Notifications (FCM)

Push notifications are configured using Firebase Cloud Messaging (FCM). 

### Setup Requirements
1. Add `google-services.json` to `mobile/android/app/` directory
2. Configure Firebase project with FCM enabled
3. Request notification permissions at runtime

### Configuration
- Default notification icon: `@mipmap/ic_launcher`
- Presentation options: badge, sound, alert

## Build and Deployment

### Building the App

1. **Build Next.js static export:**
   ```bash
   pnpm build
   ```

2. **Sync Capacitor:**
   ```bash
   npx cap sync
   ```

3. **Open Android Studio:**
   ```bash
   npx cap open android
   ```

4. **Build APK/AAB in Android Studio**

### Development Server

For development with hot reload:
1. Start Next.js dev server: `pnpm dev`
2. The capacitor config uses `https://localhost:3000` for development
3. Build and run in Android Studio

## Manual Testing Checklist

See `MANUAL_TESTING_CHECKLIST.md` for detailed manual testing procedures.

## Troubleshooting

### Deep Links Not Working
1. Verify intent filter in `AndroidManifest.xml`
2. Check that `DeepLinkHandler` component is mounted
3. Verify URL scheme matches (`mypets://wiki/*`)
4. Test with ADB command above

### Camera Not Opening
1. Check permissions are granted in app settings
2. Verify Camera plugin is installed and synced
3. Check Android version compatibility (requires API 23+)

### Push Notifications Not Receiving
1. Verify `google-services.json` is present
2. Check FCM configuration in Firebase console
3. Verify notification permissions are granted
4. Check device/emulator has Google Play Services

### Build Errors
1. Ensure `pnpm build` runs successfully first
2. Run `npx cap sync` after any plugin changes
3. Clean and rebuild in Android Studio: `Build > Clean Project` then `Build > Rebuild Project`

