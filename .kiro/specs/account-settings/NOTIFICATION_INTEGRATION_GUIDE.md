# Notification Settings Integration Guide

## Quick Start

To integrate the notification settings into your settings page, follow these steps:

### 1. Import the Component

Add this import to your settings page (`app/[locale]/settings/page.tsx`):

```typescript
import { NotificationSettingsSection } from "@/components/settings/notification-settings"
```

### 2. Add to Settings Page

Add the notification settings section after your Privacy Settings section:

```tsx
{/* Notification Settings Section */}
<div className="space-y-6">
  <h2 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-4">Notification Settings</h2>
  <NotificationSettingsSection userId={user.id} />
</div>
```

### 3. Verify Database Schema

Ensure your Prisma schema has the `notificationSettings` field on the User model:

```prisma
model User {
  // ... other fields
  notificationSettings  Json?
  // ... other fields
}
```

This field should already exist from Task 1 of the account settings implementation.

## Component Structure

The notification settings are organized into 5 main components:

1. **NotificationCategories** - Master toggles for 9 notification categories
2. **NotificationChannels** - Individual channel configuration (In-App, Push, Email, SMS)
3. **EmailDigestSettings** - Email digest frequency and timing
4. **QuietHoursSettings** - Quiet hours configuration with time ranges and days
5. **NotificationPreviewSettings** - Preview and lock screen settings

All components are combined in the `NotificationSettingsSection` wrapper.

## API Usage

### Server Actions

Two server actions are available:

```typescript
// Get notification settings
const result = await getNotificationSettingsAction()
if (result.success) {
  const settings = result.settings
}

// Update notification settings
const result = await updateNotificationSettingsAction(updatedSettings)
if (result.success) {
  // Settings saved successfully
}
```

### Service Functions

The notification service provides several utility functions:

```typescript
import {
  getNotificationSettings,
  updateNotificationSettings,
  shouldSendNotification,
  getNotificationCategories
} from '@/lib/services/notifications'

// Get settings for a user
const settings = await getNotificationSettings(userId)

// Update settings
await updateNotificationSettings(userId, partialSettings)

// Check if notification should be sent
const shouldSend = shouldSendNotification(
  settings,
  'push',           // channel
  'interactions',   // category
  'normal'          // priority
)

// Get list of categories
const categories = getNotificationCategories()
```

## Notification Logic

### When to Send Notifications

Use the `shouldSendNotification()` function to determine if a notification should be sent:

```typescript
const settings = await getNotificationSettings(userId)

// Check before sending push notification
if (shouldSendNotification(settings, 'push', 'social', 'normal')) {
  // Send push notification
}

// Check before sending email
if (shouldSendNotification(settings, 'email', 'messages', 'high')) {
  // Send email notification
}
```

The function checks:
1. Is the channel enabled?
2. Is the category allowed for this channel?
3. Does the priority meet the threshold?
4. Are we in quiet hours (for push notifications)?

### Quiet Hours Logic

Quiet hours only affect push notifications. During quiet hours:
- Push notifications are suppressed (unless critical and `allowCritical` is true)
- Email notifications are queued for delivery after quiet hours
- In-app notifications are still shown (without sound)

### Priority Levels

Four priority levels are supported:
- `low` - General updates, non-urgent information
- `normal` - Standard notifications
- `high` - Important notifications requiring attention
- `urgent` - Critical notifications (security alerts, emergencies)

Urgent notifications bypass quiet hours if `allowCritical` is enabled.

## Testing

### Unit Tests

Run the notification service tests:

```bash
npm test tests/active/notifications-service.test.ts
```

### Manual Testing Checklist

1. **Load Settings**
   - [ ] Settings page loads without errors
   - [ ] All 5 notification cards are visible
   - [ ] Default settings are displayed correctly

2. **Category Toggles**
   - [ ] Toggle a category on/off
   - [ ] Verify state persists after page reload
   - [ ] Expand category to see details

3. **Channel Configuration**
   - [ ] Enable/disable each channel
   - [ ] Change frequency settings
   - [ ] Verify SMS warning appears when enabled

4. **Email Digest**
   - [ ] Select different frequencies
   - [ ] Set daily digest time
   - [ ] Set weekly digest day
   - [ ] Verify security alert notice is visible

5. **Quiet Hours**
   - [ ] Enable quiet hours
   - [ ] Set time range
   - [ ] Select active days
   - [ ] Toggle critical notifications

6. **Preview Settings**
   - [ ] Toggle preview on/off
   - [ ] Toggle lock screen display
   - [ ] Verify privacy warning is shown

7. **Persistence**
   - [ ] Make changes and reload page
   - [ ] Verify all settings are preserved
   - [ ] Check success messages appear

## Troubleshooting

### Settings Not Loading

If settings don't load:
1. Check browser console for errors
2. Verify user is authenticated
3. Check database connection
4. Verify `notificationSettings` field exists in User model

### Settings Not Saving

If settings don't save:
1. Check network tab for failed requests
2. Verify server action is being called
3. Check server logs for errors
4. Verify Prisma client is properly initialized

### TypeScript Errors

If you see TypeScript errors:
1. Ensure all types are imported from `@/lib/types/settings`
2. Run `npm run typecheck` to see all errors
3. Verify Prisma schema is up to date
4. Run `npx prisma generate` if needed

## Next Steps

After integration, consider:

1. **Implement Notification Delivery**
   - Use `shouldSendNotification()` in your notification sending logic
   - Implement email digest batching
   - Implement quiet hours queue

2. **Add Analytics**
   - Track which settings users change most
   - Monitor notification delivery rates
   - Track opt-out rates by category

3. **Enhance UI**
   - Add notification preview in settings
   - Add "Test notification" button
   - Add notification history view

4. **Performance**
   - Cache notification settings in memory
   - Batch notification checks
   - Optimize database queries

## Support

For issues or questions:
1. Check the TASK_9_SUMMARY.md for implementation details
2. Review the test file for usage examples
3. Check the design document for architecture details
