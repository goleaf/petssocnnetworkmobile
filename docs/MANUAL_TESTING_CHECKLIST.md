# Manual Testing Checklist - Capacitor Integration

This checklist covers manual testing procedures for Capacitor features including deep links, camera uploads, and push notifications.

## Pre-Testing Setup

- [ ] App is built and installed on device/emulator
- [ ] Development server is running (if testing with dev server)
- [ ] Firebase project is configured with FCM (for push notifications)
- [ ] `google-services.json` is present in `mobile/android/app/`

---

## Deep Link Testing

### Test Case 1: Basic Deep Link with Slug
**Steps:**
1. Ensure app is closed or in background
2. Open terminal/command prompt
3. Run: `adb shell am start -a android.intent.action.VIEW -d "mypets://wiki/test-article" com.pawsocial.app`
4. Observe app behavior

**Expected Results:**
- [ ] App opens (if closed) or comes to foreground (if in background)
- [ ] App navigates to `/wiki/test-article` page
- [ ] Wiki article page loads (or shows "not found" if slug doesn't exist)
- [ ] URL in WebView contains `/wiki/test-article`

### Test Case 2: Deep Link Without Slug
**Steps:**
1. Ensure app is closed or in background
2. Run: `adb shell am start -a android.intent.action.VIEW -d "mypets://wiki" com.pawsocial.app`

**Expected Results:**
- [ ] App opens
- [ ] App navigates to `/wiki` (wiki index page)
- [ ] Wiki listing page loads

### Test Case 3: Deep Link with Invalid Slug
**Steps:**
1. Run: `adb shell am start -a android.intent.action.VIEW -d "mypets://wiki/nonexistent-article-12345" com.pawsocial.app`

**Expected Results:**
- [ ] App opens
- [ ] App navigates to `/wiki/nonexistent-article-12345`
- [ ] Page shows appropriate "not found" or error message
- [ ] App does not crash

### Test Case 4: Deep Link While App is Running
**Steps:**
1. Open app manually
2. Navigate to a different page (e.g., `/`)
3. Run deep link command: `adb shell am start -a android.intent.action.VIEW -d "mypets://wiki/test-article" com.pawsocial.app`

**Expected Results:**
- [ ] App comes to foreground
- [ ] App navigates from current page to wiki article
- [ ] Navigation is smooth (no flickering or double-loading)

### Test Case 5: Multiple Sequential Deep Links
**Steps:**
1. Run first deep link: `adb shell am start -a android.intent.action.VIEW -d "mypets://wiki/article-1" com.pawsocial.app`
2. Wait 2 seconds
3. Run second deep link: `adb shell am start -a android.intent.action.VIEW -d "mypets://wiki/article-2" com.pawsocial.app`

**Expected Results:**
- [ ] Both deep links are handled correctly
- [ ] App navigates to second article
- [ ] No navigation conflicts or errors

---

## Camera Upload to Wiki Testing

### Test Case 6: Camera Upload - New Wiki Article
**Steps:**
1. Open app and log in (if required)
2. Navigate to Wiki → Create Article
3. Fill in article title and other required fields
4. Click on "Upload Cover Image" or image upload button
5. Select "Take Photo" or "Camera" option
6. Grant camera permission if prompted (first time only)
7. Take a photo using the camera
8. Confirm/crop the photo if prompted
9. Save the wiki article

**Expected Results:**
- [ ] Camera permission dialog appears (first time)
- [ ] Camera opens successfully
- [ ] Photo can be taken
- [ ] Photo is captured and returned to the form
- [ ] Photo preview appears in the form
- [ ] Photo is saved with the article
- [ ] Article displays with the uploaded image

### Test Case 7: Camera Upload - Edit Existing Wiki Article
**Steps:**
1. Navigate to an existing wiki article you created
2. Click "Edit" button
3. Click on existing cover image or "Change Image"
4. Select "Take Photo"
5. Take a new photo
6. Save changes

**Expected Results:**
- [ ] Camera opens successfully
- [ ] New photo replaces old image
- [ ] Article saves with new image
- [ ] Updated image displays on article page

### Test Case 8: Camera Permission Denied
**Steps:**
1. Open app settings and deny camera permission
2. Attempt to upload photo via camera in wiki form
3. Observe behavior

**Expected Results:**
- [ ] App handles permission denial gracefully
- [ ] Error message or guidance is shown to user
- [ ] Option to open settings is provided (if applicable)
- [ ] App does not crash

### Test Case 9: Camera Upload - Different Image Formats
**Steps:**
1. Test uploading photo with various scenarios:
   - Take photo in portrait orientation
   - Take photo in landscape orientation
   - Take photo with flash on/off

**Expected Results:**
- [ ] All orientations work correctly
- [ ] Images are properly oriented in preview
- [ ] Images save correctly regardless of orientation
- [ ] Flash settings don't affect image capture

### Test Case 10: Camera Upload Error Handling
**Steps:**
1. While camera is open, quickly minimize app
2. Or, take photo but cancel before confirming
3. Return to wiki form

**Expected Results:**
- [ ] App handles interruption gracefully
- [ ] Form state is preserved
- [ ] User can retry camera upload
- [ ] No errors or crashes

---

## Push Notifications Testing

### Test Case 11: Push Notification Registration
**Steps:**
1. Open app for the first time
2. Check if notification permission is requested
3. Grant notification permission
4. Check device logs or Firebase console for registration token

**Expected Results:**
- [ ] Permission dialog appears (Android 13+)
- [ ] App can register for push notifications
- [ ] Registration token is obtained (check logs)
- [ ] Token is sent to backend (if configured)

### Test Case 12: Receive Push Notification - App in Foreground
**Steps:**
1. Ensure app is open and in foreground
2. Send test notification via Firebase Console
3. Observe notification behavior

**Expected Results:**
- [ ] Notification appears (according to presentationOptions)
- [ ] Notification shows badge, sound, and alert
- [ ] Tapping notification navigates appropriately
- [ ] App handles notification data correctly

### Test Case 13: Receive Push Notification - App in Background
**Steps:**
1. Minimize app or put in background
2. Send test notification via Firebase Console
3. Observe notification in system tray

**Expected Results:**
- [ ] Notification appears in system notification tray
- [ ] Notification shows correct title, body, and icon
- [ ] Tapping notification opens app
- [ ] App navigates to appropriate screen based on notification data

### Test Case 14: Receive Push Notification - App Closed
**Steps:**
1. Close app completely
2. Send test notification via Firebase Console
3. Observe notification in system tray
4. Tap notification

**Expected Results:**
- [ ] Notification appears in system tray
- [ ] Tapping notification launches app
- [ ] App opens to correct screen/content
- [ ] App processes notification data correctly

---

## Integration Testing

### Test Case 15: Camera Upload → Deep Link Flow
**Steps:**
1. Create a new wiki article using camera upload
2. Save the article
3. Copy the article slug
4. Test deep link: `adb shell am start -a android.intent.action.VIEW -d "mypets://wiki/[slug]" com.pawsocial.app`

**Expected Results:**
- [ ] Article was created successfully with camera image
- [ ] Deep link opens the correct article
- [ ] Camera-uploaded image displays correctly
- [ ] All features work together seamlessly

### Test Case 16: Performance - Multiple Rapid Actions
**Steps:**
1. Rapidly open and close camera multiple times
2. Take multiple photos in quick succession
3. Navigate via deep links multiple times rapidly

**Expected Results:**
- [ ] No crashes or freezes
- [ ] App remains responsive
- [ ] All actions complete successfully
- [ ] Memory usage remains reasonable

---

## Edge Cases and Error Scenarios

### Test Case 17: Low Storage Space
**Steps:**
1. Fill device storage to near capacity
2. Attempt camera upload

**Expected Results:**
- [ ] App handles low storage gracefully
- [ ] Appropriate error message is shown
- [ ] App does not crash

### Test Case 18: Network Issues During Upload
**Steps:**
1. Enable airplane mode
2. Attempt to save wiki article with camera image

**Expected Results:**
- [ ] App handles network error gracefully
- [ ] Image is saved locally (if applicable)
- [ ] User can retry when network is available
- [ ] Error message is clear and actionable

### Test Case 19: Deep Link with Special Characters
**Steps:**
1. Create wiki article with slug containing special characters
2. Test deep link with that slug

**Expected Results:**
- [ ] Deep link URL is properly encoded
- [ ] App handles special characters correctly
- [ ] Article opens successfully

---

## Test Results Summary

**Date:** _______________
**Tester:** _______________
**Device/Emulator:** _______________
**Android Version:** _______________
**App Version:** _______________

### Pass/Fail Summary
- Deep Links: ___/5 tests passed
- Camera Upload: ___/5 tests passed
- Push Notifications: ___/4 tests passed
- Integration: ___/2 tests passed
- Edge Cases: ___/3 tests passed

**Total:** ___/19 tests passed

### Known Issues
(List any issues found during testing)

### Notes
(Additional observations or comments)

---

## Testing Commands Reference

### Deep Link Testing Commands
```bash
# Basic wiki article deep link
adb shell am start -a android.intent.action.VIEW -d "mypets://wiki/test-article" com.pawsocial.app

# Wiki index deep link
adb shell am start -a android.intent.action.VIEW -d "mypets://wiki" com.pawsocial.app

# Check current WebView URL (requires additional setup)
adb logcat | grep -i "capacitor"
```

### Build Commands
```bash
# Build Next.js static export
pnpm build

# Sync Capacitor
npx cap sync

# Open Android Studio
npx cap open android
```

### Testing Tools
- **ADB**: Android Debug Bridge for deep link testing
- **Firebase Console**: For sending test push notifications
- **Android Studio Logcat**: For viewing app logs and debugging

