# Implementation Plan

- [x] 1.Set up database schema and core data models
  - Create Prisma schema for posts, stories, comments, likes, shares, saves, views tables
  - Add indexes for performance (author_user_id, created_at, relevance_score, hashtags)
  - Create story-related tables (stories, story_views, story_interactions, story_highlights, close_friends)
  - Create engagement tables (post_likes, comment_likes, post_shares, saved_posts, poll_votes)
  - Run migrations and verify schema
  - _Requirements: 13.1, 14.1, 14.4_

- [x] 1.1.Implement core post data access layer
  - Create PostRepository with CRUD operations
  - Implement methods: createPost, getPost, updatePost, deletePost (soft delete)
  - Add batch fetching methods to avoid N+1 queries
  - Implement post filtering by visibility, date range, content type
  - Add pagination support (cursor-based)
  - _Requirements: 13.2, 14.1_

- [x] 1.2.Build ranking algorithm engine
  - Create RankingEngine class with score computation logic
  - Implement engagement score calculation (likes 0.2, comments 0.3, shares 0.25, saves 0.15)
  - Add recency decay multipliers (exponential decay based on post age)
  - Implement affinity score calculation based on user relationships
  - Add content type preference boosting
  - Implement diversity injection to prevent same-user domination
  - Apply negative signals (muted users, hidden posts, muted words)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 1.3.Create feed service and API endpoints
  - Implement GET /api/feed endpoint with query parameters (type, limit, cursor, filters)
  - Create FeedService to orchestrate data fetching and ranking
  - Implement feed types: home (ranked), explore, following (chronological), local, my-pets
  - Add feed filtering logic (content types, date range, topics, quality)
  - Integrate with RankingEngine for home feed scoring
  - Return paginated feed response with posts and engagement data
  - _Requirements: 1.1, 1.2, 13.1_

- [x] 1.4.Implement post creation API and processing
  - Create POST /api/posts endpoint for creating posts
  - Validate input (text max 5000 chars, media limits, visibility settings)
  - Process @mentions: extract usernames, validate users exist, create mention records
  - Process #hashtags: extract tags, create/update hashtag records
  - Handle media uploads (accept base64 or pre-uploaded media IDs)
  - Create post record with all metadata
  - Send notifications to mentioned users
  - Broadcast new post to followers via WebSocket
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 13.2_

- [x] 1.5.Build post engagement endpoints
  - Create POST /api/posts/{postId}/like endpoint (create like, increment counter, notify author)
  - Create DELETE /api/posts/{postId}/like endpoint (remove like, decrement counter)
  - Create POST /api/posts/{postId}/comments endpoint (create comment, handle replies, notify)
  - Create POST /api/posts/{postId}/share endpoint (create share record, increment counter)
  - Create POST /api/posts/{postId}/save endpoint (save to collection, private action)
  - Implement cache invalidation on engagement changes
  - Broadcast real-time updates via WebSocket
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 13.3_

- [x] 1.6.Create post composer UI component
  - Build PostComposer React component with textarea (auto-expanding 3-20 lines)
  - Add character counter (0/5000)
  - Implement @mention autocomplete with user search
  - Implement #hashtag suggestions
  - Add emoji picker integration
  - Create media upload interface (drag-drop, file picker, camera on mobile)
  - Display media thumbnails with remove and reorder functionality
  - Add pet tag selector
  - Add location picker with map integration
  - Implement visibility selector dropdown
  - Add save draft functionality (auto-save every 10 seconds)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 1.7.Build feed display UI components
  - Create FeedContainer component with tab navigation (Home, Explore, Following, Local, My Pets)
  - Build PostCard component displaying avatar, username, timestamp, content, media
  - Implement media display: single image full-width, multiple images in grid, video with player
  - Add text truncation with "Read more" for long posts (280 chars or 4 lines)
  - Create interaction bar with like, comment, share, bookmark buttons
  - Display engagement counts with hover tooltips
  - Add three-dot menu for post actions (report, hide, save)
  - Implement smooth tab transitions (300ms animation)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 1.8.Implement infinite scroll and pagination
  - Add IntersectionObserver for detecting scroll to bottom
  - Implement "Load More" button appearing after 20 posts
  - Fetch next batch when user reaches 80% of current content
  - Display loading spinner during fetch
  - Limit DOM to 200 posts (remove oldest from top when exceeded)
  - Maintain scroll position on back navigation
  - _Requirements: 1.3, 12.5_

- [x] 1.9.Create feed filtering UI and logic
  - Build FilterPanel component with sidebar/modal layout
  - Add content type checkboxes (Photos, Videos, Text Only, Polls, Shared Posts)
  - Implement date range selector (Today, This Week, This Month, All Time, custom picker)
  - Add "High Quality Only" toggle
  - Create topic filter with hashtag chips (show/hide posts about)
  - Add muted words input list
  - Implement filter presets (save/load custom filter combinations)
  - Apply filters to feed query and refresh results
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 1.10.Implement special post types (polls, questions, events)
  - Create PollPost component with 2-4 options and vote buttons
  - Display poll results as percentage bars after voting
  - Implement QuestionPost with "Best Answer" marking functionality
  - Create EventPost with date/time, location, RSVP buttons (Going/Interested/Can't Go)
  - Build MarketplacePost with price, condition, category, "Mark as Sold" button
  - Add SharedPost display with original post embedded
  - Handle post type-specific data in API endpoints
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 1.11.Build story creation camera interface
  - Create StoryCamera component with fullscreen vertical view (9:16 aspect ratio)
  - Implement camera preview using getUserMedia API
  - Add camera switch button (front/rear toggle)
  - Create capture button: tap for photo, hold for video with progress ring
  - Add gallery button to select existing media
  - Implement flash toggle for photos
  - Handle permissions and error states
  - _Requirements: 8.1, 8.2_

- [x] 1.12.Create story editing tools
  - Build text overlay tool with font selector (5-10 fonts), color picker, alignment
  - Implement drawing tool with pen, marker, highlighter, neon, eraser
  - Add brush size slider and color picker for drawing
  - Create undo/redo functionality for drawings
  - Allow text dragging, pinch-to-resize, rotation with gestures
  - Implement filter carousel (swipe to cycle through filters)
  - Add filter intensity slider
  - _Requirements: 8.3, 8.4_

- [x] 1.13.Implement story stickers system
  - Create sticker panel with tabs: Emoji, GIF, Location, Mention, Hashtag, Poll, Question, Countdown, Music, Quiz, Weather
  - Integrate GIPHY/Tenor API for GIF search
  - Build poll sticker with question and 2-4 answer options
  - Create question sticker with custom prompt
  - Implement countdown sticker with date/time picker
  - Add location sticker with place search
  - Create mention sticker with user search
  - Allow sticker positioning, resizing, rotation
  - _Requirements: 8.5_

- [x] 1.14.Build story publishing and API
  - Create POST /api/stories endpoint accepting media and metadata
  - Validate media (photos max 10MB, videos max 100MB and 15 seconds)
  - Upload media to cloud storage with CDN
  - Generate thumbnails and multiple quality versions
  - Create story record with 24-hour expiry timestamp
  - Store stickers as JSONB data
  - Broadcast notification to followers
  - _Requirements: 9.1, 13.4_

- [x] 1.15.Implement story viewer UI
  - Create StoryViewer component with fullscreen display
  - Show progress bars at top (one per story segment)
  - Implement auto-advance after 5 seconds (photos) or full duration (videos)
  - Add tap left/right for navigation, swipe up to exit
  - Implement pause on hold gesture
  - Display story ring indicators (colored for new, grey for viewed)
  - Show "Close Friends" badge for close friends stories
  - _Requirements: 9.1, 9.2_

- [x] 1.16.Create story privacy and close friends
  - Implement visibility selector (Everyone, Close Friends, Custom)
  - Create CloseFriendsList management UI (add/remove users)
  - Add "Add to Close Friends" button on user profiles
  - Display green ring indicator for close friends stories
  - Filter story feed based on visibility permissions
  - _Requirements: 9.1, 9.2_

- [x] 1.17.Build story interactions and responses
  - Implement swipe-up reply functionality (opens DM composer)
  - Create quick reaction buttons (heart, laughing, surprised, crying)
  - Build poll interaction: tap to vote, show real-time results
  - Implement question response: tap sticker, type response, send to creator
  - Create quiz interaction: tap answer, show correct/incorrect feedback
  - Handle countdown subscriptions with notification scheduling
  - Record all interactions in story_interactions table
  - _Requirements: 10.4, 10.5_

- [x] 1.18.Implement story analytics and insights
  - Create GET /api/stories/{storyId}/viewers endpoint returning viewer list
  - Build GET /api/stories/{storyId}/insights endpoint with comprehensive analytics
  - Display viewer list with profile photos, usernames, timestamps
  - Show metrics: total views, reach, impressions, completion rate, exits heatmap
  - Add engagement breakdown: replies, reactions, shares, sticker interactions
  - Create audience insights: follower vs non-follower, geographic distribution, device types
  - Build insights UI component for story creators
  - _Requirements: 10.1, 10.2, 10.3_

- [x] 1.19.Create story highlights system
  - Implement POST /api/stories/highlights endpoint for creating highlights
  - Build highlight selector UI (choose stories from archive, select cover, name highlight)
  - Display highlights as circular icons below profile bio
  - Create highlight viewer (tap to view stories in sequence)
  - Add edit highlight functionality (add/remove stories, change cover/name)
  - Implement highlight deletion
  - Copy expired stories to permanent storage when added to highlight
  - _Requirements: 9.4_

- [ ] 1.20.Implement story archiving and expiration
  - Create background job to expire stories after 24 hours
  - Move expired stories to archive if user has archiving enabled
  - Create GET /api/stories/archive endpoint with pagination
  - Build archive UI showing expired stories by month/year
  - Implement "Repost to Story" from archive
  - Add export functionality (download as video/image files)
  - Allow manual story deletion with confirmation
  - _Requirements: 9.3, 9.4_

- [ ] 1.21.Set up Redis caching layer
  - Configure Redis connection and client
  - Implement cache helpers: get, set, delete, invalidate patterns
  - Cache individual posts with key `post:{postId}` (TTL: 10 minutes)
  - Cache user feeds with key `feed:{userId}:home` (TTL: 5 minutes, post IDs only)
  - Cache engagement counts with key `post:{postId}:counts` (TTL: 1 minute)
  - Cache active stories with key `stories:{userId}:active` (TTL: 5 minutes)
  - Cache story viewers with key `story:{storyId}:viewers` (TTL: 1 minute)
  - Implement cache invalidation on data changes
  - _Requirements: 14.2, 14.3, 14.5_

- [ ] 1.22.Implement WebSocket real-time updates
  - Set up WebSocket server (Socket.io or native WebSocket)
  - Create channels: `feed:{userId}`, `post:{postId}`, `story:{storyId}:interactions`, `user:{userId}:story_views`
  - Broadcast new posts to followers' feed channels
  - Broadcast engagement updates (likes, comments) to post channels
  - Broadcast story interactions to story channels
  - Broadcast story views to creator's channel
  - Implement client-side WebSocket connection and event handlers
  - Update UI in real-time when receiving WebSocket messages
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [ ] 1.23.Build pull-to-refresh and new posts banner
  - Implement pull-to-refresh gesture on mobile (show loading spinner)
  - Create "New Posts Available" banner at top of feed with count
  - Fetch new posts on pull-to-refresh or banner click
  - Insert new posts at top with fade-in animation
  - Scroll to top smoothly when banner clicked
  - Mark new posts with subtle blue left border for 10 seconds
  - _Requirements: 11.1, 11.5_

- [ ] 1.24.Implement virtualized scrolling for performance
  - Integrate react-window or react-virtualized for feed rendering
  - Render only viewport posts plus 5 above and 5 below
  - Remove off-screen posts from DOM but keep references
  - Maintain smooth scrolling on low-end devices
  - Handle dynamic post heights
  - _Requirements: 12.1_

- [x] 1.25.Add lazy loading for media
  - Implement IntersectionObserver for images and videos
  - Load images only when scrolled into view (or just above)
  - Show blur-up placeholder (tiny thumbnail scaled with blur)
  - Load videos thumbnail immediately, full video when 50% visible for 500ms
  - Pause videos when scrolled out of view
  - Use responsive images with srcset for different screen sizes
  - Serve WebP/AVIF with JPEG fallback
  - _Requirements: 12.2, 12.3, 12.4_

- [ ] 1.26.Create media processing pipeline
  - Set up job queue (Bull/BullMQ) for async processing
  - Implement image optimization: resize to multiple sizes, compress, generate WebP/AVIF
  - Create video transcoding: generate 360p, 480p, 720p, 1080p versions
  - Generate HLS/DASH for adaptive streaming
  - Extract video thumbnails from first frame
  - Strip EXIF data from images for privacy
  - Upload processed media to CDN
  - Update post/story records with processed media URLs
  - _Requirements: 2.2, 2.3, 2.4, 2.5_

- [ ] 1.27.Implement content moderation system
  - Scan uploaded media for inappropriate content, hate symbols, offensive text
  - Auto-flag content with confidence score > 0.8
  - Temporarily hide flagged content pending manual review
  - Create moderation queue UI for admins
  - Implement user reporting system (report button on posts/stories)
  - Track repeat offenders and escalate actions
  - _Requirements: 15.1, 15.2, 15.3_

- [ ] 1.28.Add screenshot detection and sensitive content warnings
  - Implement screenshot detection for stories (platform-dependent)
  - Send notification to creator when screenshot detected
  - Add privacy setting to disable screenshot notifications
  - Create "Sensitive Content" toggle for story creators
  - Require age confirmation (18+) before viewing sensitive stories
  - Display blurred preview with warning for age-restricted content
  - _Requirements: 15.4, 15.5_

- [ ] 1.29.Write unit tests for core functionality
  - Test ranking algorithm score computation with various inputs
  - Test feed filtering logic (muted users, content types, date ranges)
  - Test story expiration and archiving logic
  - Test engagement counter updates and cache invalidation
  - Test media processing functions
  - _Requirements: All_

- [ ] 1.30.* 1.30. Write integration tests for API endpoints
  - Test complete feed loading flow (fetch, rank, filter, return)
  - Test post creation with media upload and notification dispatch
  - Test story creation with sticker processing and expiry scheduling
  - Test real-time engagement updates via WebSocket
  - Test comment threading and reply notifications
  - _Requirements: All_

- [ ] 1.31.* 1.31. Perform performance testing and optimization
  - Load test feed endpoint with 1M posts (target p95 < 200ms)
  - Test concurrent story viewing by 10K users (WebSocket delivery < 500ms)
  - Measure media transcoding throughput (1 min video in < 2 min)
  - Verify cache hit rates (target > 80% for feed requests)
  - Optimize database queries with EXPLAIN ANALYZE
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 1.32.* 1.32. Create E2E tests for user flows
  - Test user creates post with multiple media and pet tags
  - Test user views feed, scrolls, and interacts with posts
  - Test user creates story with stickers and publishes to close friends
  - Test close friend views story, votes in poll, and replies
  - Test creator views story insights and engagement analytics
  - _Requirements: All_
