# Requirements Document

## Introduction

This document specifies the requirements for a comprehensive Direct Messaging (DM) System that enables real-time communication between users in the pet social network. The system supports one-on-one conversations, group chats, rich media sharing, voice/video calls, and advanced messaging features to facilitate connections between pet owners, veterinarians, shelters, and other community members.

## Glossary

- **DM_System**: The Direct Messaging System that handles all messaging functionality
- **User**: An authenticated account holder who can send and receive messages
- **Conversation**: A messaging thread between two or more users (direct or group)
- **Message**: A single communication unit containing text, media, or other content
- **Message_Request**: A pending message from a non-follower awaiting acceptance
- **Read_Receipt**: A confirmation that a message has been viewed by the recipient
- **Typing_Indicator**: A real-time signal showing when a user is composing a message
- **WebSocket_Connection**: A persistent bidirectional connection for real-time updates
- **Optimistic_UI**: Immediate display of user actions before server confirmation
- **Message_Status**: The delivery state of a message (sending, sent, delivered, read, failed)
- **Group_Chat**: A conversation with three or more participants
- **Group_Admin**: A user with elevated permissions in a group chat
- **Media_Message**: A message containing images, videos, audio, or files
- **Voice_Call**: A real-time audio communication session
- **Video_Call**: A real-time audio and video communication session
- **Push_Notification**: A system notification delivered when the app is backgrounded
- **Disappearing_Message**: A message that auto-deletes after a specified time period
- **Message_Reaction**: An emoji response to a message
- **Forwarded_Message**: A message copied from one conversation to another
- **Starred_Message**: A message saved for quick reference
- **Muted_Conversation**: A conversation with notifications disabled

## Requirements

### Requirement 1

**User Story:** As a pet owner, I want to view my message inbox with all conversations, so that I can quickly see who has messaged me and access recent chats.

#### Acceptance Criteria

1. WHEN the User navigates to the messages section, THE DM_System SHALL display an inbox view containing all Conversations sorted by most recent activity
2. WHILE displaying the inbox, THE DM_System SHALL show for each Conversation: contact profile photo (40x40px circular), display name, username, last message preview (truncated to 60 characters), timestamp, unread indicator, online status, and message status icons
3. WHEN a Conversation has unread messages, THE DM_System SHALL display a blue dot or unread count badge on the conversation card
4. WHEN a Conversation is pinned, THE DM_System SHALL display it at the top of the inbox with a pin icon
5. WHERE the User swipes right on a conversation card, THE DM_System SHALL provide an action to mark as unread
6. WHERE the User swipes left on a conversation card, THE DM_System SHALL provide actions to delete, archive, or mute the conversation

### Requirement 2

**User Story:** As a user, I want to send text messages with rich formatting, so that I can communicate effectively with other pet owners.

#### Acceptance Criteria

1. WHEN the User types text in the message composer and presses send, THE DM_System SHALL create a Message record and display it immediately with "sending" status
2. WHILE the Message is being sent, THE DM_System SHALL show a sending indicator (grey clock icon) in the message bubble
3. WHEN the server confirms Message delivery, THE DM_System SHALL update the Message_Status from "sending" to "sent" with a single grey checkmark
4. WHEN the recipient's device receives the Message, THE DM_System SHALL update the Message_Status to "delivered" with double grey checkmarks
5. IF the Message send fails due to network or server error, THEN THE DM_System SHALL display a red exclamation icon with a retry option
6. WHEN the User includes a URL in the message text, THE DM_System SHALL automatically detect and underline the clickable link
7. WHEN the User includes an @mention in the message text, THE DM_System SHALL highlight the mention in blue

### Requirement 3

**User Story:** As a pet owner, I want to share photos and videos of my pets, so that I can show them to friends and get advice from veterinarians.

#### Acceptance Criteria

1. WHEN the User taps the camera button, THE DM_System SHALL provide options to take a photo/video instantly or select from gallery
2. WHERE the User selects multiple media items (up to 10), THE DM_System SHALL display thumbnails in the composer with an X button to remove each
3. WHEN the User adds a photo for sending, THE DM_System SHALL compress the image to a maximum of 2MB while maintaining quality
4. WHEN the User adds a video for sending, THE DM_System SHALL compress it to HD quality with a maximum size of 100MB and duration of 5 minutes
5. WHILE media is uploading, THE DM_System SHALL display upload progress per media item with a cancel option
6. WHEN a Media_Message is received, THE DM_System SHALL display images full-width in the bubble (max 300x400px) with tap-to-expand functionality
7. WHEN a video Media_Message is received, THE DM_System SHALL display a thumbnail with play button overlay and duration indicator

### Requirement 4

**User Story:** As a user, I want to send voice messages, so that I can quickly communicate without typing.

#### Acceptance Criteria

1. WHEN the User taps and holds the microphone button, THE DM_System SHALL start recording audio and display an animated waveform
2. WHILE recording, THE DM_System SHALL show the recording duration with a maximum limit of 5 minutes
3. WHERE the User slides finger up during recording, THE DM_System SHALL lock the recording for hands-free mode
4. WHERE the User slides finger left during recording, THE DM_System SHALL cancel the recording without sending
5. WHEN the User releases the microphone button, THE DM_System SHALL send the voice message with waveform visualization and duration
6. WHEN a voice message is received, THE DM_System SHALL display play/pause controls, waveform, duration, and playback position
7. WHEN the phone is held to the ear during voice message playback, THE DM_System SHALL route audio through the earpiece instead of speaker for privacy

### Requirement 5

**User Story:** As a user, I want to see when someone is typing, so that I know they are actively responding.

#### Acceptance Criteria

1. WHEN the User types in the message composer, THE DM_System SHALL broadcast a Typing_Indicator to the recipient via WebSocket_Connection
2. WHILE the recipient is typing, THE DM_System SHALL display "[Name] is typing..." with three animated dots in the chat header
3. WHEN multiple users are typing in a Group_Chat, THE DM_System SHALL display "John and Sarah are typing..." or "John, Sarah, and 2 others are typing..."
4. WHEN 5 seconds elapse without typing activity, THE DM_System SHALL stop displaying the Typing_Indicator
5. WHEN the User sends a message, THE DM_System SHALL immediately stop displaying the Typing_Indicator

### Requirement 6

**User Story:** As a user, I want to know when my messages have been read, so that I can confirm the recipient saw my message.

#### Acceptance Criteria

1. WHEN the recipient views a Message, THE DM_System SHALL create a Read_Receipt record and update the Message_Status to "read"
2. WHEN a Message is marked as read, THE DM_System SHALL display double blue checkmarks to the sender
3. WHEN viewing a Group_Chat message, THE DM_System SHALL display "Read by X" count with tap-to-view functionality showing all members who read the message
4. WHERE the User disables read receipts in privacy settings, THE DM_System SHALL not send Read_Receipt confirmations to other users
5. IF the User disables read receipts, THEN THE DM_System SHALL not display read receipt information from other users to maintain reciprocity

### Requirement 7

**User Story:** As a pet owner, I want to create group chats with multiple people, so that I can coordinate playdates or discuss pet care with several friends.

#### Acceptance Criteria

1. WHEN the User taps "New Group" and selects 2 to 256 participants, THE DM_System SHALL create a Group_Chat with the selected members
2. WHEN creating a Group_Chat, THE DM_System SHALL require a group name (1-50 characters) and allow optional group icon and description (200 characters)
3. WHEN a Group_Chat is created, THE DM_System SHALL send notifications to all invited users and add the conversation to their inbox
4. WHEN the User views a Group_Chat, THE DM_System SHALL display the group name, icon, and member count in the header
5. WHEN the User taps the Group_Chat header, THE DM_System SHALL display group info including all members list, add members button, and group settings
6. WHILE viewing Group_Chat messages, THE DM_System SHALL display the sender's name above each message group and profile photos for all senders

### Requirement 8

**User Story:** As a group admin, I want to manage group settings and members, so that I can maintain a well-organized group chat.

#### Acceptance Criteria

1. WHEN a Group_Chat is created, THE DM_System SHALL assign the creator as a Group_Admin by default
2. WHERE a Group_Admin promotes another member, THE DM_System SHALL grant that user admin privileges including add/remove members, change group settings, and delete any message
3. WHEN a Group_Admin changes group settings, THE DM_System SHALL allow configuration of who can send messages and who can add members
4. WHERE a Group_Admin enables "Only Admins Can Send Messages", THE DM_System SHALL prevent non-admin members from sending messages (announcement group mode)
5. WHEN viewing the members list, THE DM_System SHALL display a badge next to Group_Admin users

### Requirement 9

**User Story:** As a user, I want to mention specific people in group chats, so that I can get their attention in busy conversations.

#### Acceptance Criteria

1. WHEN the User types @ in a Group_Chat, THE DM_System SHALL display a dropdown of group members with search functionality
2. WHEN the User selects a member from the mention dropdown, THE DM_System SHALL insert the mention and highlight it in blue
3. WHEN a Message contains a mention of a specific user, THE DM_System SHALL send a notification to that user even if they muted the group
4. WHERE a Group_Admin types @everyone or @all, THE DM_System SHALL notify all group members
5. IF a non-admin user attempts to use @everyone or @all, THEN THE DM_System SHALL prevent the mention to avoid spam

### Requirement 10

**User Story:** As a user, I want to react to messages with emojis, so that I can quickly respond without typing.

#### Acceptance Criteria

1. WHEN the User long-presses a Message, THE DM_System SHALL display a reaction picker with quick reactions (❤️, 👍, 😂, 😮, 😢, 😡)
2. WHEN the User taps a reaction emoji, THE DM_System SHALL add the Message_Reaction and display it below the message bubble
3. WHEN the User taps an existing reaction they added, THE DM_System SHALL remove their Message_Reaction
4. WHEN multiple users react to the same Message, THE DM_System SHALL display reaction counts (e.g., "❤️ 5")
5. WHEN the User taps a reaction count, THE DM_System SHALL display a list of users who reacted with that emoji
6. WHEN a Message_Reaction is added, THE DM_System SHALL broadcast the update to all conversation participants via WebSocket_Connection for real-time display

### Requirement 11

**User Story:** As a user, I want to reply to specific messages, so that I can maintain context in busy conversations.

#### Acceptance Criteria

1. WHEN the User swipes right on a Message or long-presses and selects "Reply", THE DM_System SHALL display the quoted message preview in the composer
2. WHEN the User sends a reply, THE DM_System SHALL create a threaded Message with reference to the original message
3. WHEN displaying a replied Message, THE DM_System SHALL show the quoted message above the current message with a connecting line
4. WHEN the User taps a quoted message, THE DM_System SHALL scroll to the original message in the thread
5. WHERE the quoted message contains media, THE DM_System SHALL display a small thumbnail in the quote preview

### Requirement 12

**User Story:** As a user, I want to edit messages I sent, so that I can correct mistakes.

#### Acceptance Criteria

1. WHEN the User long-presses their own Message sent within 15 minutes and selects "Edit", THE DM_System SHALL open the composer with the current text pre-filled
2. WHEN the User saves the edited Message, THE DM_System SHALL update the message content and display an "Edited" label
3. WHEN a Message is edited, THE DM_System SHALL create a record in message edit history preserving the original content
4. WHEN the User taps the "Edited" label, THE DM_System SHALL display all previous versions of the message with timestamps
5. WHEN a Message is edited, THE DM_System SHALL broadcast the update to recipients via WebSocket_Connection for real-time display
6. IF more than 15 minutes have elapsed since sending, THEN THE DM_System SHALL not provide the edit option

### Requirement 13

**User Story:** As a user, I want to delete messages, so that I can remove content I no longer want visible.

#### Acceptance Criteria

1. WHEN the User long-presses their own Message and selects "Delete", THE DM_System SHALL provide options "Delete for Me" and "Delete for Everyone"
2. WHEN the User selects "Delete for Me", THE DM_System SHALL hide the Message from their view only while keeping it visible to other participants
3. WHERE the User selects "Delete for Everyone" within 1 hour of sending, THE DM_System SHALL remove the Message content for all participants and display "You deleted this message"
4. WHEN a Message is deleted for everyone, THE DM_System SHALL remove associated media files from storage
5. IF more than 1 hour has elapsed since sending, THEN THE DM_System SHALL only allow "Delete for Me" option
6. WHEN another user deletes a Message for everyone, THE DM_System SHALL display "[Name] deleted this message" placeholder

### Requirement 14

**User Story:** As a user, I want to search for messages in conversations, so that I can find important information quickly.

#### Acceptance Criteria

1. WHEN the User taps the search icon in the chat header, THE DM_System SHALL open a search interface for the current Conversation
2. WHEN the User enters search keywords, THE DM_System SHALL find all Messages containing those keywords and highlight matches in yellow
3. WHEN search results are displayed, THE DM_System SHALL show the match count and provide next/previous buttons to navigate between results
4. WHERE the User searches across all conversations, THE DM_System SHALL display results grouped by Conversation with message previews
5. WHEN the User taps a search result, THE DM_System SHALL navigate to that Message in the conversation thread
6. WHERE the User applies filters, THE DM_System SHALL support filtering by date range, message type (text, media, links, files), and sender

### Requirement 15

**User Story:** As a user, I want to forward messages to other conversations, so that I can share information easily.

#### Acceptance Criteria

1. WHEN the User long-presses a Message and selects "Forward", THE DM_System SHALL open a contact picker with search functionality
2. WHEN the User selects one or multiple recipients, THE DM_System SHALL allow adding an optional comment before forwarding
3. WHEN a Message is forwarded, THE DM_System SHALL create a Forwarded_Message with a "Forwarded" label preserving the original content
4. WHEN a Message is forwarded, THE DM_System SHALL track the forward count for spam prevention
5. IF a Message has been forwarded 5 times by a single user, THEN THE DM_System SHALL prevent further forwarding to limit spam propagation

### Requirement 16

**User Story:** As a user, I want to receive messages from non-followers as requests, so that I can control who can message me directly.

#### Acceptance Criteria

1. WHEN a non-follower sends a Message to the User, THE DM_System SHALL create a Message_Request instead of delivering to the main inbox
2. WHEN a Message_Request is created, THE DM_System SHALL not send a notification to the recipient to prevent spam
3. WHEN the User views the Message_Request folder, THE DM_System SHALL display pending requests with message previews without marking them as read
4. WHEN the User accepts a Message_Request, THE DM_System SHALL move the Conversation to the main inbox and allow future messages without approval
5. WHEN the User declines a Message_Request, THE DM_System SHALL delete the request without notifying the sender
6. WHERE the User's privacy settings specify "Who Can Message Me", THE DM_System SHALL enforce restrictions (Everyone, Friends, People I Follow, No One)

### Requirement 17

**User Story:** As a user, I want to mute conversations, so that I can temporarily disable notifications from busy chats.

#### Acceptance Criteria

1. WHEN the User selects "Mute" for a Conversation, THE DM_System SHALL provide duration options (1 hour, 8 hours, 1 week, until manually unmuted)
2. WHEN a Conversation is muted, THE DM_System SHALL stop sending Push_Notifications for new messages in that conversation
3. WHILE a Conversation is muted, THE DM_System SHALL continue to receive and mark messages as unread
4. WHEN viewing the inbox, THE DM_System SHALL display a muted icon on Muted_Conversations
5. WHEN the mute duration expires, THE DM_System SHALL automatically re-enable notifications for the conversation

### Requirement 18

**User Story:** As a user, I want to star important messages, so that I can easily find them later.

#### Acceptance Criteria

1. WHEN the User long-presses a Message and selects "Star", THE DM_System SHALL create a Starred_Message record
2. WHEN the User accesses "Starred Messages" from settings, THE DM_System SHALL display all starred messages organized by Conversation
3. WHEN viewing Starred_Messages, THE DM_System SHALL provide search functionality to find specific starred content
4. WHEN the User taps a Starred_Message, THE DM_System SHALL navigate to that message in its original conversation
5. WHEN the User unstars a Message, THE DM_System SHALL remove it from the Starred_Messages collection

### Requirement 19

**User Story:** As a user, I want to make voice and video calls, so that I can have real-time conversations with other pet owners.

#### Acceptance Criteria

1. WHEN the User taps the phone icon in a chat header, THE DM_System SHALL initiate a Voice_Call and display a calling screen with the contact's photo and name
2. WHEN a Voice_Call is incoming, THE DM_System SHALL display a full-screen notification with Answer and Decline buttons and play a ringtone
3. WHEN the recipient answers a Voice_Call, THE DM_System SHALL establish a WebRTC connection and display call duration timer
4. WHILE on a Voice_Call, THE DM_System SHALL provide mute/unmute, speaker, and end call buttons
5. WHEN the User taps the video camera icon, THE DM_System SHALL initiate a Video_Call with camera preview
6. WHILE on a Video_Call, THE DM_System SHALL provide front/rear camera switch, mute audio, disable video, and screen share options
7. WHEN a call ends, THE DM_System SHALL display a system message in the chat showing call type, duration, and timestamp

### Requirement 20

**User Story:** As a user, I want to schedule messages to send later, so that I can compose messages now and send them at the right time.

#### Acceptance Criteria

1. WHEN the User long-presses the send button, THE DM_System SHALL display a "Schedule Message" option with date and time picker
2. WHEN the User schedules a Message, THE DM_System SHALL queue the message with the scheduled timestamp
3. WHILE a Message is scheduled, THE DM_System SHALL display it in the thread with a "Scheduled" indicator and clock icon
4. WHEN the User taps a scheduled Message, THE DM_System SHALL provide options to edit or cancel the scheduled send
5. WHEN the scheduled time arrives, THE DM_System SHALL automatically send the Message via a background job

### Requirement 21

**User Story:** As a user, I want to enable disappearing messages, so that sensitive conversations auto-delete after a period.

#### Acceptance Criteria

1. WHEN the User enables disappearing messages in chat settings, THE DM_System SHALL provide duration options (24 hours, 7 days, 90 days)
2. WHEN disappearing messages are enabled, THE DM_System SHALL display a visual indicator in the chat header
3. WHILE disappearing messages are active, THE DM_System SHALL show a countdown timer in each message bubble
4. WHEN the expiration time arrives, THE DM_System SHALL automatically delete the Disappearing_Message from both sender and recipient devices
5. WHEN a Message is deleted due to expiration, THE DM_System SHALL remove associated media from storage

### Requirement 22

**User Story:** As a user, I want to export my chat history, so that I can keep records or switch devices.

#### Acceptance Criteria

1. WHEN the User selects "Export Chat" from conversation settings, THE DM_System SHALL provide options for including media and selecting date range
2. WHEN the User initiates an export, THE DM_System SHALL provide format options (JSON, TXT, HTML)
3. WHEN an export is requested, THE DM_System SHALL create a background job to compile the data asynchronously
4. WHEN the export is ready, THE DM_System SHALL send a notification with a download link that expires in 7 days
5. WHERE the export includes media, THE DM_System SHALL embed media files or provide URLs in the export file

### Requirement 23

**User Story:** As a user, I want to receive push notifications for new messages, so that I stay informed when the app is closed.

#### Acceptance Criteria

1. WHEN a Message is received and the app is backgrounded or closed, THE DM_System SHALL send a Push_Notification via FCM/APNs
2. WHEN a Push_Notification is displayed, THE DM_System SHALL include the sender's profile photo, name, and message preview (first 100 characters)
3. WHERE the User has disabled message preview in privacy settings, THE DM_System SHALL display "New message" without content preview
4. WHEN the User taps a Push_Notification, THE DM_System SHALL open the app directly to the relevant Conversation
5. WHERE the notification is for a Group_Chat, THE DM_System SHALL format it as "[Sender Name] in [Group Name]: message preview"
6. WHEN the User is mentioned in a Group_Chat, THE DM_System SHALL send a Push_Notification even if the group is muted

### Requirement 24

**User Story:** As a user, I want messages to sync reliably across network interruptions, so that I don't lose messages when offline.

#### Acceptance Criteria

1. WHEN the User sends a Message while offline, THE DM_System SHALL queue the message in local storage with "waiting to send" status
2. WHEN the network connection is restored, THE DM_System SHALL automatically retry sending queued messages in order
3. WHEN the server receives a Message, THE DM_System SHALL acknowledge receipt with a unique messageId before responding to the client
4. WHEN a Message send fails after retry, THE DM_System SHALL display a failed status with a manual retry button
5. WHERE duplicate messages are received due to retry logic, THE DM_System SHALL deduplicate using messageId to prevent showing duplicates

### Requirement 25

**User Story:** As a user, I want to report inappropriate messages, so that I can help maintain a safe community.

#### Acceptance Criteria

1. WHEN the User long-presses a Message and selects "Report", THE DM_System SHALL display report reason options (spam, harassment, inappropriate content, scam/fraud, impersonation)
2. WHEN a report is submitted, THE DM_System SHALL send the report to a moderation queue with message content, media, and conversation context
3. WHEN moderators review a report, THE DM_System SHALL allow actions including warn sender, delete message, or suspend/ban account
4. WHEN moderation action is taken, THE DM_System SHALL provide feedback to the reporter about the outcome
5. WHERE a Message receives multiple reports, THE DM_System SHALL automatically flag it for priority review

### Requirement 26

**User Story:** As a user, I want to block other users, so that I can prevent unwanted contact.

#### Acceptance Criteria

1. WHEN the User blocks another user, THE DM_System SHALL prevent that user from sending messages, making calls, or viewing the User's profile
2. WHEN a blocked user attempts to send a Message, THE DM_System SHALL display "Message not delivered" without revealing the block status
3. WHEN the User views their blocked list, THE DM_System SHALL display all blocked users with an unblock option
4. WHERE the User restricts another user (softer than block), THE DM_System SHALL move their messages to the Message_Request folder without notification
5. WHEN a restricted user sends a Message, THE DM_System SHALL not send Read_Receipts even if the User reads the message

### Requirement 27

**User Story:** As a user, I want automatic spam detection, so that I'm protected from unwanted messages.

#### Acceptance Criteria

1. WHEN a non-follower sends more than 50 messages per hour, THE DM_System SHALL rate-limit further messages
2. WHEN a user creates more than 10 new conversations per day, THE DM_System SHALL rate-limit new conversation creation
3. WHEN a Message contains patterns matching known spam, THE DM_System SHALL automatically filter it to the spam folder
4. WHERE a Message contains suspicious links, THE DM_System SHALL scan using a safe browsing API and warn before delivery
5. WHEN media is uploaded, THE DM_System SHALL scan for inappropriate content (nudity, violence, illegal content) and block flagged content

### Requirement 28

**User Story:** As a user, I want smooth performance when viewing long conversations, so that the app remains responsive.

#### Acceptance Criteria

1. WHEN the User opens a Conversation, THE DM_System SHALL load only the last 50 messages initially
2. WHEN the User scrolls up in a Conversation, THE DM_System SHALL lazy-load older messages using cursor-based pagination
3. WHEN the User scrolls near the top of loaded messages, THE DM_System SHALL prefetch the next page for smooth infinite scroll
4. WHERE a Conversation contains media, THE DM_System SHALL load thumbnails first and full-resolution images only when tapped
5. WHEN the User scrolls away from media before it loads, THE DM_System SHALL cancel the media load to save bandwidth

### Requirement 29

**User Story:** As a user, I want my online status to be visible to others, so that they know when I'm available.

#### Acceptance Criteria

1. WHEN the User opens the app and establishes a WebSocket_Connection, THE DM_System SHALL update their online status to "Active now"
2. WHILE the User is active, THE DM_System SHALL send heartbeat pings every 30 seconds to maintain online status
3. WHEN the User closes the app or loses connection, THE DM_System SHALL update their status to show last seen timestamp (e.g., "Active 5m ago")
4. WHEN viewing a Conversation, THE DM_System SHALL display the recipient's online status below their name in the header
5. WHERE the User disables online status in privacy settings, THE DM_System SHALL not broadcast their online status to other users

### Requirement 30

**User Story:** As a user, I want to create polls in group chats, so that I can gather opinions from group members.

#### Acceptance Criteria

1. WHEN the User composes a Message in a Group_Chat and selects "Poll", THE DM_System SHALL provide fields for question (200 characters) and 2-10 options (50 characters each)
2. WHEN creating a poll, THE DM_System SHALL allow settings for multiple votes, anonymous voting, and optional deadline
3. WHEN a poll is sent, THE DM_System SHALL display it as a special message type with voting buttons for each option
4. WHEN a member votes, THE DM_System SHALL update the poll results in real-time showing percentage bars for each option
5. WHEN the poll creator ends the poll or the deadline arrives, THE DM_System SHALL close voting and display final results
