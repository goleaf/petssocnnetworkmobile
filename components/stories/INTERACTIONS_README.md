# Story Interactions System

This document describes the story interactions system implemented for the Content Feed & Timeline feature.

## Overview

The story interactions system allows viewers to engage with stories through various interactive elements including reactions, poll voting, question responses, quiz answers, countdown subscriptions, and direct replies.

## Components

### StoryReactions
Quick reaction buttons that appear at the bottom of stories.

**Features:**
- 6 reaction types: heart, laughing, surprised, crying, fire, clap
- Visual feedback on selection
- Records reaction in database
- Updates story reaction counters

**Usage:**
```tsx
<StoryReactions
  storyId={storyId}
  userId={userId}
  onReact={(type) => handleReaction(type)}
/>
```

### InteractivePollSticker
Interactive poll that viewers can vote on.

**Features:**
- Displays poll question and options
- Shows real-time vote percentages after voting
- Prevents duplicate voting
- Visual feedback for selected option
- Fetches and displays current results

**Usage:**
```tsx
<InteractivePollSticker
  storyId={storyId}
  userId={userId}
  pollData={pollData}
  onVote={(optionId) => handlePollVote(optionId)}
  position={{ x: 0.5, y: 0.5 }}
  scale={1}
/>
```

### InteractiveQuestionSticker
Question sticker that viewers can respond to.

**Features:**
- Tap to expand input field
- Text input with character limit (200 chars)
- Sends response to story creator
- Success feedback after submission
- Closes automatically after sending

**Usage:**
```tsx
<InteractiveQuestionSticker
  storyId={storyId}
  userId={userId}
  questionData={questionData}
  onRespond={(text) => handleQuestionResponse(text)}
  position={{ x: 0.5, y: 0.5 }}
  scale={1}
/>
```

### InteractiveQuizSticker
Quiz sticker with correct/incorrect feedback.

**Features:**
- Multiple choice quiz format
- Immediate feedback on answer
- Visual indicators for correct/incorrect answers
- Highlights correct answer after submission
- Prevents multiple attempts

**Usage:**
```tsx
<InteractiveQuizSticker
  storyId={storyId}
  userId={userId}
  quizData={quizData}
  onAnswer={(optionId, isCorrect) => handleQuizAnswer(optionId, isCorrect)}
  position={{ x: 0.5, y: 0.5 }}
  scale={1}
/>
```

### InteractiveCountdownSticker
Countdown timer with notification subscription.

**Features:**
- Real-time countdown display (days, hours, minutes, seconds)
- Subscribe/unsubscribe to notifications
- Visual feedback for subscription status
- Schedules notification for target date

**Usage:**
```tsx
<InteractiveCountdownSticker
  storyId={storyId}
  userId={userId}
  countdownData={countdownData}
  onSubscribe={() => handleCountdownSubscribe()}
  position={{ x: 0.5, y: 0.5 }}
  scale={1}
/>
```

### StoryReplyInput
Swipe-up reply interface for sending messages to story creator.

**Features:**
- Full-screen modal interface
- Text input with character limit (500 chars)
- Send button with loading state
- Success feedback
- Backdrop click to close

**Usage:**
```tsx
<StoryReplyInput
  storyId={storyId}
  userId={userId}
  creatorUsername={creatorUsername}
  onSend={(text) => handleReply(text)}
  onClose={() => setShowReplyInput(false)}
  isOpen={showReplyInput}
/>
```

## API Endpoints

### POST /api/stories/[storyId]/interactions
Records a story interaction.

**Request Body:**
```json
{
  "userId": "user-id",
  "interactionType": "poll_vote|question_response|quiz_answer|reaction|reply|link_click|countdown_subscription",
  "data": {
    // Type-specific data
  }
}
```

**Response:**
```json
{
  "success": true,
  "interaction": {
    "id": "interaction-id",
    "storyId": "story-id",
    "userId": "user-id",
    "interactionType": "poll_vote",
    "data": {},
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### GET /api/stories/[storyId]/interactions
Fetches story interactions, optionally filtered by type.

**Query Parameters:**
- `type` (optional): Filter by interaction type

**Response:**
```json
{
  "interactions": [
    {
      "id": "interaction-id",
      "storyId": "story-id",
      "userId": "user-id",
      "interactionType": "poll_vote",
      "data": { "optionId": "option-1" },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## Service Layer

### StoryInteractionService
Handles business logic for story interactions.

**Key Methods:**
- `recordPollVote(storyId, userId, optionId)` - Records a poll vote
- `getPollResults(storyId)` - Gets vote counts by option
- `hasUserVoted(storyId, userId)` - Checks if user voted
- `getUserVote(storyId, userId)` - Gets user's vote
- `recordQuestionResponse(storyId, userId, text)` - Records question response
- `getQuestionResponses(storyId)` - Gets all responses
- `recordQuizAnswer(storyId, userId, questionId, answerId, isCorrect)` - Records quiz answer
- `recordReaction(storyId, userId, reactionType)` - Records reaction
- `getReactionCounts(storyId)` - Gets reaction counts
- `recordReply(storyId, userId, text, mediaUrl?)` - Records reply
- `recordLinkClick(storyId, userId)` - Records link click
- `scheduleCountdownNotification(storyId, userId, targetDate)` - Schedules notification

## Database Schema

### StoryInteraction Model
```prisma
model StoryInteraction {
  id              String   @id @default(uuid())
  storyId         String
  userId          String
  interactionType String   // poll_vote, question_response, quiz_answer, reaction, reply, link_click, countdown_subscription
  data            Json?    // Type-specific data
  createdAt       DateTime @default(now())

  story Story @relation(fields: [storyId], references: [id], onDelete: Cascade)

  @@index([storyId, interactionType])
  @@index([userId])
}
```

## Integration with StoryViewer

The StoryViewer component has been enhanced to support all interaction types:

1. **Swipe-up gesture** opens reply input
2. **Reaction button** shows quick reaction picker
3. **Interactive stickers** render based on overlay type
4. **Real-time updates** via WebSocket (future enhancement)

## Requirements Satisfied

- ✅ 10.4: Swipe-up reply functionality (opens DM composer)
- ✅ 10.4: Quick reaction buttons (heart, laughing, surprised, crying)
- ✅ 10.4: Poll interaction (tap to vote, show real-time results)
- ✅ 10.4: Question response (tap sticker, type response, send to creator)
- ✅ 10.4: Quiz interaction (tap answer, show correct/incorrect feedback)
- ✅ 10.5: Countdown subscriptions with notification scheduling
- ✅ 10.5: Record all interactions in story_interactions table

## Future Enhancements

1. **Real-time updates** - Use WebSocket to show live poll results and reactions
2. **Music stickers** - Add music track selection and playback
3. **Weather stickers** - Display current weather conditions
4. **Link stickers** - Add clickable links with preview
5. **Shopping stickers** - Product tags with purchase links
6. **Notification system** - Implement countdown notification delivery
7. **Analytics dashboard** - Show interaction metrics to creators
