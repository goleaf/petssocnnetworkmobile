# Implementation Plan

- [ ] 1. Set up database schema and core data models
  - Create Prisma schema for Conversation, ConversationParticipant, Message, MessageReaction, MessageReadReceipt, MessageRequest, StarredMessage, ScheduledMessage, CallRecord, and UserPresence models
  - Add necessary indexes for query optimization (conversationId+createdAt, userId+updatedAt, etc.)
  - Create database migration files
  - Run migrations to create tables
  - _Requirements: 1.1, 1.2, 2.1, 3.1, 6.1, 7.1, 16.1, 18.1, 20.1, 19.1, 29.1_

- [ ] 1.1. Implement core messaging API endpoints
- [ ] 1.2. Create conversation management endpoints
  - Write POST /api/messages/conversations endpoint to create new conversations
  - Write GET /api/messages/conversations endpoint with cursor-based pagination
  - Write PATCH /api/messages/conversations/:id endpoint for updating conversation settings (pin, mute, archive)
  - Write DELETE /api/messages/conversations/:id endpoint
  - Add authentication middleware to verify user access
  - _Requirements: 1.1, 7.1, 7.3, 17.1_

- [ ] 1.3. Create message CRUD endpoints
  - Write POST /api/messages endpoint to send messages with validation
  - Write GET /api/messages endpoint with conversationId filter and cursor pagination
  - Write PATCH /api/messages/:id endpoint for editing messages (15-minute window check)
  - Write DELETE /api/messages/:id endpoint with "delete for me" and "delete for everyone" options (1-hour window check)
  - Implement message ownership verification
  - _Requirements: 2.1, 2.2, 12.1, 12.2, 12.6, 13.1, 13.2, 13.3, 13.5_

- [ ] 1.4. Create media upload endpoints
  - Write POST /api/messages/media/upload endpoint for image/video/audio uploads
  - Implement image compression (max 2MB, WebP format)
  - Implement video compression (HD quality, max 100MB, 5-minute duration limit)
  - Generate thumbnails for images (150x150, 300x300, 600x600)
  - Store media files in S3-compatible storage
  - Return media URLs for message attachment
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6, 3.7, 4.5_

- [ ] 1.5. Create message reaction endpoints
  - Write POST /api/messages/:id/reactions endpoint to add reactions
  - Write DELETE /api/messages/:id/reactions/:emoji endpoint to remove reactions
  - Write GET /api/messages/:id/reactions endpoint to list users who reacted
  - Implement unique constraint (messageId, userId, emoji)
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 1.6. Create read receipt endpoints
  - Write POST /api/messages/:id/read endpoint to mark message as read
  - Write GET /api/messages/:id/read-receipts endpoint for group chat read status
  - Implement privacy setting check (respect user's read receipt preferences)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 1.7. Implement WebSocket server for real-time features
- [ ] 1.8. Set up Socket.io server
  - Install and configure Socket.io server in Next.js API route
  - Implement authentication middleware for WebSocket connections
  - Create connection/disconnection handlers
  - Set up heartbeat mechanism (30-second intervals)
  - Implement automatic reconnection logic with exponential backoff
  - _Requirements: 5.1, 29.1, 29.2_

- [ ] 1.9. Implement real-time message delivery
  - Create socket event handler for 'message:new' to broadcast new messages
  - Create socket event handler for 'message:updated' to broadcast message edits
  - Create socket event handler for 'message:deleted' to broadcast deletions
  - Implement room-based broadcasting (subscribe to conversationId rooms)
  - Add message deduplication logic using messageId
  - _Requirements: 2.1, 2.3, 12.5, 13.6_

- [ ] 1.10. Implement typing indicators
  - Create socket event handler for 'typing:start' to broadcast typing status
  - Create socket event handler for 'typing:stop' to broadcast typing stop
  - Implement 5-second auto-stop timer for typing indicators
  - Add batching logic (max once per second per user)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 1.11. Implement online presence system
  - Create socket event handler to update UserPresence on connection
  - Update lastSeenAt timestamp on heartbeat
  - Set status to 'offline' on disconnection
  - Broadcast presence updates to user's contacts
  - Implement privacy setting check for online status visibility
  - _Requirements: 29.1, 29.2, 29.3, 29.4, 29.5_

- [ ] 1.12. Implement real-time reactions and read receipts
  - Create socket event handler for 'message:reaction' to broadcast reactions
  - Create socket event handler for 'message:read' to broadcast read receipts
  - Implement batching for read receipts (every 2 seconds or 10 messages)
  - _Requirements: 10.6, 6.1, 6.2_

- [ ] 1.13. Build message inbox UI component
- [ ] 1.14. Create conversation list component
  - Build ConversationList component with virtual scrolling
  - Display conversation card with profile photo (40x40px circular), name, username, last message preview (60 chars), timestamp
  - Show unread indicator (blue dot or count badge)
  - Show online status indicator
  - Show message status icons (sending, sent, delivered, read)
  - Implement sorting by most recent activity
  - Display pinned conversations at top with pin icon
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 1.15. Implement swipe gestures and quick actions
  - Add swipe-right gesture to mark conversation as unread
  - Add swipe-left gesture to show delete, archive, mute options
  - Implement action handlers for each quick action
  - Add visual feedback for swipe gestures
  - _Requirements: 1.5, 1.6_

- [ ] 1.16. Add inbox search and filtering
  - Create search input component for conversations
  - Implement client-side filtering by contact name and message content
  - Add filter tabs (all, unread, archived, requests)
  - Update conversation list based on active filter
  - _Requirements: 14.1, 14.4_

- [ ] 1.17. Integrate WebSocket for real-time inbox updates
  - Subscribe to WebSocket events on component mount
  - Update conversation list on 'message:new' event
  - Update last message preview and timestamp
  - Increment unread count for non-active conversations
  - Sort conversations by most recent activity
  - _Requirements: 2.1, 2.3_

- [ ] 1.18. Build chat thread UI component
- [ ] 1.19. Create message thread component with pagination
  - Build MessageThread component with infinite scroll
  - Fetch initial 50 messages on load
  - Implement cursor-based pagination for older messages
  - Add "Load more" trigger when scrolling near top
  - Implement auto-scroll to bottom on new messages (if already at bottom)
  - Add "Jump to bottom" button when scrolled up
  - _Requirements: 28.1, 28.2, 28.3_

- [ ] 1.20. Implement message rendering components
  - Create TextMessage component with link detection and @mention highlighting
  - Create MediaMessage component with thumbnail and full-resolution loading
  - Create VoiceMessage component with waveform visualization and playback controls
  - Create SystemMessage component for calls, member changes, settings updates
  - Implement message grouping by sender and time
  - Display sender name and profile photo for group chats
  - _Requirements: 2.6, 2.7, 3.6, 3.7, 4.6, 7.6_

- [ ] 1.21. Add message status indicators
  - Display sending indicator (grey clock icon) for pending messages
  - Display sent status (single grey checkmark) when server confirms
  - Display delivered status (double grey checkmarks) when recipient receives
  - Display read status (double blue checkmarks) when recipient reads
  - Display failed status (red exclamation icon) with retry button
  - _Requirements: 2.2, 2.3, 2.4, 2.5, 6.2_

- [ ] 1.22. Implement message interactions
  - Add long-press menu with options: Reply, Edit, Delete, Forward, Star, Report
  - Add swipe-right gesture for quick reply
  - Display reaction picker on long-press with quick reactions (❤️, 👍, 😂, 😮, 😢, 😡)
  - Show reactions below message bubble with counts
  - Implement tap on reaction to add/remove user's reaction
  - Implement tap on reaction count to show list of users
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 11.1_

- [ ] 1.23. Add typing indicators to chat header
  - Display "[Name] is typing..." with animated dots when single user types
  - Display "John and Sarah are typing..." for multiple users in group
  - Display "John, Sarah, and 2 others are typing..." for 4+ users
  - Hide typing indicator after 5 seconds of inactivity
  - _Requirements: 5.2, 5.3, 5.4_

- [ ] 1.24. Integrate WebSocket for real-time thread updates
  - Subscribe to conversation-specific WebSocket room
  - Add new messages to thread on 'message:new' event
  - Update message content on 'message:updated' event
  - Remove message on 'message:deleted' event
  - Update reactions on 'message:reaction' event
  - Update read receipts on 'message:read' event
  - Show/hide typing indicators on 'typing:start' and 'typing:stop' events
  - _Requirements: 2.1, 12.5, 13.6, 10.6, 6.1, 5.1_

- [ ] 1.25. Build message composer UI component
- [ ] 1.26. Create text input with auto-expand
  - Build textarea component that auto-expands from 1 to 5 lines
  - Implement character counter (optional, for future limits)
  - Add send button that enables when text is entered
  - Implement draft auto-save every 2 seconds to local storage
  - Restore draft on component mount
  - _Requirements: 2.1_

- [ ] 1.27. Implement @mention autocomplete
  - Detect @ character in text input
  - Show dropdown with conversation participants
  - Implement search/filter by name
  - Insert mention on selection with blue highlighting
  - Store mention metadata for notification targeting
  - _Requirements: 2.7, 9.1, 9.2_

- [ ] 1.28. Add media picker and preview
  - Create media picker button with camera and gallery options
  - Implement multi-select (up to 10 items)
  - Display thumbnail previews in composer with X button to remove
  - Show upload progress per media item
  - Add cancel upload option
  - _Requirements: 3.1, 3.2, 3.5_

- [ ] 1.29. Implement voice recording
  - Create microphone button with tap-and-hold to record
  - Display animated waveform during recording
  - Show recording duration with 5-minute max limit
  - Implement slide-up gesture to lock recording (hands-free mode)
  - Implement slide-left gesture to cancel recording
  - Send voice message on release with waveform and duration
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 1.30. Add reply and edit modes
  - Display quoted message preview when replying
  - Show connecting line from quote to new message
  - Pre-fill composer with existing text when editing
  - Show "Editing" label in composer header
  - Clear reply/edit mode after sending or canceling
  - _Requirements: 11.1, 11.2, 12.1_

- [ ] 1.31. Implement message sending with optimistic UI
  - Generate temporary message ID on send
  - Add message to thread immediately with "sending" status
  - Upload media files first (if any) with progress tracking
  - Send message via API with media URLs
  - Replace temporary message with server response
  - Handle send failures with retry option
  - Emit 'typing:stop' event on send
  - _Requirements: 2.1, 2.2, 2.5, 3.5, 5.5_

- [ ] 1.32. Add schedule message feature
  - Implement long-press on send button to show "Schedule Message" option
  - Create date and time picker modal
  - Display scheduled messages in thread with "Scheduled" indicator and clock icon
  - Allow tap on scheduled message to edit or cancel
  - _Requirements: 20.1, 20.2, 20.3, 20.4_

- [ ] 1.33. Implement group chat features
- [ ] 1.34. Create group creation flow
  - Build "New Group" button in inbox
  - Create member selection screen with search and multi-select (2-256 participants)
  - Add group details form (name 1-50 chars, optional icon upload, description 200 chars)
  - Send API request to create group
  - Navigate to new group chat on success
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 1.35. Build group info panel
  - Create group header with name, icon, and member count
  - Implement tap on header to open group info panel
  - Display all members list with profile photos and names
  - Show admin badge next to Group_Admin users
  - Add "Add Members" button
  - Add "Leave Group" button with confirmation
  - _Requirements: 7.4, 7.5, 8.5_

- [ ] 1.36. Implement group settings and permissions
  - Create group settings screen (accessible by admins only)
  - Add toggle for "Who Can Send Messages" (everyone / admins only)
  - Add toggle for "Who Can Add Members" (everyone / admins only)
  - Implement permission checks on message send
  - Implement permission checks on member add/remove
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 1.37. Add member management features
  - Implement "Add Members" flow with contact picker
  - Implement "Remove Member" option (admin only) with confirmation
  - Implement "Make Admin" option (admin only)
  - Implement "Remove Admin" option (admin only)
  - Send notifications to affected users
  - Update group member list in real-time
  - _Requirements: 8.2, 8.3_

- [ ] 1.38. Implement @everyone and @all mentions
  - Detect @everyone or @all in group messages
  - Check if sender is admin before allowing
  - Prevent non-admin users from using @everyone/@all
  - Send notifications to all group members when used
  - _Requirements: 9.3, 9.4, 9.5_

- [ ] 1.39. Implement message editing and deletion
- [ ] 1.40. Add message edit functionality
  - Check if message was sent within 15 minutes
  - Open composer with current text pre-filled
  - Send PATCH request to update message
  - Store original content in edit history
  - Display "Edited" label on message
  - Implement tap on "Edited" to show edit history with timestamps
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.6_

- [ ] 1.41. Add message deletion functionality
  - Show "Delete for Me" and "Delete for Everyone" options
  - Check if message was sent within 1 hour for "Delete for Everyone"
  - Implement "Delete for Me" to hide message locally
  - Implement "Delete for Everyone" to remove for all participants
  - Display "You deleted this message" or "[Name] deleted this message" placeholder
  - Delete associated media files from storage
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

- [ ] 1.42. Implement message search functionality
- [ ] 1.43. Create in-conversation search
  - Add search icon to chat header
  - Create search interface with keyword input
  - Implement search query to find messages containing keywords
  - Highlight matches in yellow
  - Show match count and next/previous navigation buttons
  - Scroll to selected search result
  - _Requirements: 14.1, 14.2, 14.3, 14.5_

- [ ] 1.44. Create global message search
  - Add search across all conversations
  - Display results grouped by conversation with message previews
  - Implement filters (date range, message type, sender)
  - Navigate to message in conversation on tap
  - _Requirements: 14.4, 14.6_

- [ ] 1.45. Implement message forwarding
  - Add "Forward" option to message long-press menu
  - Create contact picker with search for recipient selection
  - Allow selecting multiple recipients
  - Add optional comment field before forwarding
  - Create forwarded message with "Forwarded" label
  - Track forward count per message per user
  - Prevent forwarding if count reaches 5
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 1.46. Implement starred messages feature
  - Add "Star" option to message long-press menu
  - Create StarredMessage record on star
  - Add "Starred Messages" section in settings
  - Display all starred messages organized by conversation
  - Implement search within starred messages
  - Navigate to original message on tap
  - Add "Unstar" option to remove from collection
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

- [ ] 1.47. Implement message request system
- [ ] 1.48. Create message request filtering logic
  - Check if sender is follower before delivering message
  - Check user's privacy settings ("Who Can Message Me")
  - Create MessageRequest record for non-follower messages
  - Prevent notification for message requests
  - _Requirements: 16.1, 16.2, 16.6_

- [ ] 1.49. Build message requests UI
  - Create "Message Requests" folder in inbox
  - Display pending requests with message previews
  - Prevent marking requests as read on view
  - Add "Accept" and "Decline" buttons
  - Move conversation to main inbox on accept
  - Delete conversation on decline without notifying sender
  - _Requirements: 16.3, 16.4, 16.5_

- [ ] 1.50. Implement conversation muting
  - Add "Mute" option to conversation menu
  - Create mute duration picker (1 hour, 8 hours, 1 week, until unmuted)
  - Update ConversationParticipant with mute settings
  - Prevent push notifications for muted conversations
  - Continue receiving and marking messages as unread
  - Display muted icon on conversation card
  - Auto-unmute when duration expires via background job
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

- [ ] 1.51. Implement voice and video calls
- [ ] 1.52. Set up WebRTC signaling server
  - Create WebRTC signaling endpoints for call initiation
  - Implement ICE candidate exchange via WebSocket
  - Set up STUN/TURN servers for NAT traversal
  - Create call state management (calling, ringing, active, ended)
  - _Requirements: 19.1, 19.2, 19.3_

- [ ] 1.53. Build voice call UI
  - Add phone icon to chat header
  - Create calling screen with contact photo and name
  - Display incoming call notification with Answer/Decline buttons
  - Play ringtone for incoming calls
  - Show call duration timer during active call
  - Add mute/unmute, speaker, and end call buttons
  - _Requirements: 19.1, 19.2, 19.3, 19.4_

- [ ] 1.54. Build video call UI
  - Add video camera icon to chat header
  - Create video call screen with camera preview
  - Display remote video stream
  - Add front/rear camera switch button
  - Add mute audio button
  - Add disable video button
  - Add screen share option
  - _Requirements: 19.5, 19.6_

- [ ] 1.55. Implement call recording and history
  - Create CallRecord on call end with type, duration, status
  - Display system message in chat showing call details
  - Store call history for user reference
  - _Requirements: 19.7_

- [ ] 1.56. Implement disappearing messages
  - Add "Disappearing Messages" toggle in conversation settings
  - Create duration picker (24 hours, 7 days, 90 days)
  - Display visual indicator in chat header when enabled
  - Show countdown timer in message bubbles
  - Create background job to delete expired messages
  - Delete associated media from storage on expiration
  - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5_

- [ ] 1.57. Implement chat export functionality
  - Add "Export Chat" option in conversation settings
  - Create export options modal (include media, date range, format: JSON/TXT/HTML)
  - Create background job to compile export data
  - Generate export file with messages and optional media
  - Send notification with download link (7-day expiration)
  - _Requirements: 22.1, 22.2, 22.3, 22.4, 22.5_

- [ ] 1.58. Implement push notifications
- [ ] 1.59. Set up push notification service
  - Integrate Firebase Cloud Messaging (FCM) for Android
  - Integrate Apple Push Notification service (APNs) for iOS
  - Store device tokens in database
  - Create notification sending service
  - _Requirements: 23.1_

- [ ] 1.60. Implement notification triggers
  - Send push notification when message received and app backgrounded
  - Include sender profile photo, name, and message preview (100 chars)
  - Respect privacy settings (hide preview if disabled)
  - Format group chat notifications as "[Sender] in [Group]: preview"
  - Send notification for @mentions even if group is muted
  - Open app to conversation on notification tap
  - _Requirements: 23.1, 23.2, 23.3, 23.4, 23.5, 23.6_

- [ ] 1.61. Implement offline message queue and sync
  - Create local storage queue for messages sent while offline
  - Display "waiting to send" status for queued messages
  - Implement automatic retry when connection restored
  - Send queued messages in order
  - Display failed status with manual retry button after multiple failures
  - Implement message deduplication using messageId
  - _Requirements: 24.1, 24.2, 24.3, 24.4, 24.5_

- [ ] 1.62. Implement reporting and moderation
- [ ] 1.63. Create message reporting flow
  - Add "Report" option to message long-press menu
  - Create report reason picker (spam, harassment, inappropriate content, scam/fraud, impersonation)
  - Send report to moderation queue with message content and context
  - Display confirmation to reporter
  - _Requirements: 25.1, 25.2_

- [ ] 1.64. Build moderation queue interface
  - Create admin moderation dashboard
  - Display reported messages with context
  - Add moderation actions (warn sender, delete message, suspend/ban account)
  - Send feedback to reporter about outcome
  - Auto-flag messages with multiple reports for priority review
  - _Requirements: 25.3, 25.4, 25.5_

- [ ] 1.65. Implement user blocking and restricting
- [ ] 1.66. Create blocking functionality
  - Add "Block User" option to conversation menu
  - Prevent blocked user from sending messages, making calls, or viewing profile
  - Display "Message not delivered" to blocked user without revealing block
  - Create blocked users list in settings with unblock option
  - _Requirements: 26.1, 26.2, 26.3_

- [ ] 1.67. Create restricting functionality
  - Add "Restrict User" option (softer than block)
  - Move restricted user's messages to message requests folder
  - Prevent read receipts for restricted users
  - Don't send notifications for restricted user messages
  - _Requirements: 26.4, 26.5_

- [ ] 1.68. Implement spam detection and prevention
- [ ] 1.69. Create rate limiting system
  - Implement rate limit for non-followers (50 messages/hour)
  - Implement rate limit for new conversations (10/day)
  - Return 429 error when limits exceeded
  - _Requirements: 27.1, 27.2_

- [ ] 1.70. Implement spam pattern detection
  - Create spam detection service with pattern matching
  - Check for repeated messages, excessive links, suspicious content
  - Automatically filter detected spam to spam folder
  - _Requirements: 27.3_

- [ ] 1.71. Implement link and media safety scanning
  - Integrate safe browsing API for link scanning
  - Warn users before delivering messages with suspicious links
  - Scan uploaded media for inappropriate content (NSFW, violence, illegal)
  - Block flagged media from being sent
  - _Requirements: 27.4, 27.5_

- [ ] 1.72. Implement poll feature for group chats
  - Add "Poll" option to message composer in group chats
  - Create poll creation form (question 200 chars, 2-10 options 50 chars each)
  - Add poll settings (multiple votes, anonymous voting, deadline)
  - Display poll as special message type with voting buttons
  - Update poll results in real-time with percentage bars
  - Close voting when creator ends poll or deadline arrives
  - Display final results
  - _Requirements: 30.1, 30.2, 30.3, 30.4, 30.5_

- [ ] 1.73. Implement performance optimizations
- [ ] 1.74. Add lazy loading for media
  - Load thumbnails first for images
  - Load full-resolution only when tapped
  - Cancel media load when scrolled away
  - Implement progressive JPEG loading
  - _Requirements: 28.4, 28.5_

- [ ] 1.75. Optimize WebSocket message batching
  - Batch typing indicators (max once per second)
  - Batch read receipts (every 2 seconds or 10 messages)
  - Batch presence updates (every 30 seconds)
  - _Requirements: 5.1, 6.1_

- [ ] 1.76. Implement virtual scrolling and memoization
  - Use virtual scrolling for conversation list (1000+ conversations)
  - Use virtual scrolling for message thread (10,000+ messages)
  - Memoize message components with React.memo
  - Debounce typing indicators (300ms)
  - Throttle scroll events (100ms)
  - _Requirements: 28.1, 28.2, 28.3_

- [ ] 1.77. * 1.77. Write integration tests for core flows
  - Test message send and receive flow
  - Test WebSocket real-time delivery
  - Test read receipts flow
  - Test group chat creation and messaging
  - Test message requests flow
  - Test blocking and restricting users
  - Test spam detection and rate limiting
  - _Requirements: All_

- [ ] 1.78. * 1.78. Write E2E tests for critical user journeys
  - Test complete conversation flow (send, receive, reply)
  - Test media sharing flow (upload, send, view)
  - Test voice call flow (initiate, answer, end)
  - Test group chat flow (create, add members, send message)
  - Test message editing and deletion
  - Test reporting and moderation flow
  - _Requirements: All_
