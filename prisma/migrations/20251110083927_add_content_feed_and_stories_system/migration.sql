-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "postType" TEXT NOT NULL DEFAULT 'standard',
    "textContent" TEXT,
    "media" JSONB,
    "petTags" TEXT[],
    "mentionedUserIds" TEXT[],
    "hashtags" TEXT[],
    "location" JSONB,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "commentsCount" INTEGER NOT NULL DEFAULT 0,
    "sharesCount" INTEGER NOT NULL DEFAULT 0,
    "savesCount" INTEGER NOT NULL DEFAULT 0,
    "viewsCount" INTEGER NOT NULL DEFAULT 0,
    "reactions" JSONB,
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "visibilityUserIds" TEXT[],
    "commentsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "sharesEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pollOptions" JSONB,
    "eventData" JSONB,
    "marketplaceData" JSONB,
    "sharedPostId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "scheduledPublishAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "relevanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastScoreComputedAt" TIMESTAMP(3),

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_likes" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reactionType" TEXT NOT NULL DEFAULT 'like',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "parentCommentId" TEXT,
    "textContent" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "mentionedUserIds" TEXT[],
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "repliesCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "isPinned" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment_likes" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_shares" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shareType" TEXT NOT NULL DEFAULT 'repost',
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_posts" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "collectionName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_views" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poll_votes" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "poll_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stories" (
    "id" TEXT NOT NULL,
    "creatorUserId" TEXT NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "thumbnailUrl" TEXT NOT NULL,
    "mediaDimensions" JSONB NOT NULL,
    "videoDuration" INTEGER,
    "caption" TEXT,
    "stickers" JSONB,
    "musicTrackId" TEXT,
    "linkUrl" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'everyone',
    "visibilityUserIds" TEXT[],
    "isSensitiveContent" BOOLEAN NOT NULL DEFAULT false,
    "viewsCount" INTEGER NOT NULL DEFAULT 0,
    "uniqueViewersCount" INTEGER NOT NULL DEFAULT 0,
    "repliesCount" INTEGER NOT NULL DEFAULT 0,
    "reactionsCount" INTEGER NOT NULL DEFAULT 0,
    "sharesCount" INTEGER NOT NULL DEFAULT 0,
    "linkClicksCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "stories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_views" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "viewerUserId" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "story_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_interactions" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "interactionType" TEXT NOT NULL,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "story_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_highlights" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "coverUrl" TEXT NOT NULL,
    "storyIds" TEXT[],
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "story_highlights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "close_friends" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "friendUserId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "close_friends_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "posts_authorUserId_createdAt_idx" ON "posts"("authorUserId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "posts_publishedAt_idx" ON "posts"("publishedAt" DESC);

-- CreateIndex
CREATE INDEX "posts_relevanceScore_idx" ON "posts"("relevanceScore" DESC);

-- CreateIndex
CREATE INDEX "posts_deletedAt_idx" ON "posts"("deletedAt");

-- CreateIndex
CREATE INDEX "posts_hashtags_idx" ON "posts" USING GIN ("hashtags");

-- CreateIndex
CREATE INDEX "posts_visibility_idx" ON "posts"("visibility");

-- CreateIndex
CREATE UNIQUE INDEX "post_likes_postId_userId_key" ON "post_likes"("postId", "userId");

-- CreateIndex
CREATE INDEX "post_likes_postId_createdAt_idx" ON "post_likes"("postId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "post_likes_userId_idx" ON "post_likes"("userId");

-- CreateIndex
CREATE INDEX "comments_postId_createdAt_idx" ON "comments"("postId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "comments_authorUserId_idx" ON "comments"("authorUserId");

-- CreateIndex
CREATE INDEX "comments_parentCommentId_idx" ON "comments"("parentCommentId");

-- CreateIndex
CREATE INDEX "comments_deletedAt_idx" ON "comments"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "comment_likes_commentId_userId_key" ON "comment_likes"("commentId", "userId");

-- CreateIndex
CREATE INDEX "comment_likes_commentId_idx" ON "comment_likes"("commentId");

-- CreateIndex
CREATE INDEX "comment_likes_userId_idx" ON "comment_likes"("userId");

-- CreateIndex
CREATE INDEX "post_shares_postId_createdAt_idx" ON "post_shares"("postId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "post_shares_userId_idx" ON "post_shares"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "saved_posts_postId_userId_key" ON "saved_posts"("postId", "userId");

-- CreateIndex
CREATE INDEX "saved_posts_userId_createdAt_idx" ON "saved_posts"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "post_views_postId_viewedAt_idx" ON "post_views"("postId", "viewedAt" DESC);

-- CreateIndex
CREATE INDEX "post_views_userId_idx" ON "post_views"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "poll_votes_postId_userId_key" ON "poll_votes"("postId", "userId");

-- CreateIndex
CREATE INDEX "poll_votes_postId_idx" ON "poll_votes"("postId");

-- CreateIndex
CREATE INDEX "poll_votes_userId_idx" ON "poll_votes"("userId");

-- CreateIndex
CREATE INDEX "stories_creatorUserId_expiresAt_idx" ON "stories"("creatorUserId", "expiresAt");

-- CreateIndex
CREATE INDEX "stories_expiresAt_idx" ON "stories"("expiresAt");

-- CreateIndex
CREATE INDEX "stories_deletedAt_idx" ON "stories"("deletedAt");

-- CreateIndex
CREATE INDEX "stories_isArchived_idx" ON "stories"("isArchived");

-- CreateIndex
CREATE UNIQUE INDEX "story_views_storyId_viewerUserId_key" ON "story_views"("storyId", "viewerUserId");

-- CreateIndex
CREATE INDEX "story_views_storyId_viewedAt_idx" ON "story_views"("storyId", "viewedAt" DESC);

-- CreateIndex
CREATE INDEX "story_views_viewerUserId_idx" ON "story_views"("viewerUserId");

-- CreateIndex
CREATE INDEX "story_interactions_storyId_interactionType_idx" ON "story_interactions"("storyId", "interactionType");

-- CreateIndex
CREATE INDEX "story_interactions_userId_idx" ON "story_interactions"("userId");

-- CreateIndex
CREATE INDEX "story_highlights_userId_order_idx" ON "story_highlights"("userId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "close_friends_userId_friendUserId_key" ON "close_friends"("userId", "friendUserId");

-- CreateIndex
CREATE INDEX "close_friends_userId_idx" ON "close_friends"("userId");

-- CreateIndex
CREATE INDEX "close_friends_friendUserId_idx" ON "close_friends"("friendUserId");

-- AddForeignKey
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_shares" ADD CONSTRAINT "post_shares_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_posts" ADD CONSTRAINT "saved_posts_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_views" ADD CONSTRAINT "post_views_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_views" ADD CONSTRAINT "story_views_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_interactions" ADD CONSTRAINT "story_interactions_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
