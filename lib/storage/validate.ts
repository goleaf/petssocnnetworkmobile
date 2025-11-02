/**
 * Storage validation utility
 * Validates data integrity and structure of localStorage data
 */

import type {
  User,
  Pet,
  BlogPost,
  Comment,
  WikiArticle,
  Conversation,
  DirectMessage,
  Group,
  GroupMember,
  FriendRequest,
} from '../types';

// Storage keys (matching lib/storage.ts)
const STORAGE_KEYS = {
  USERS: "pet_social_users",
  PETS: "pet_social_pets",
  BLOG_POSTS: "pet_social_blog_posts",
  COMMENTS: "pet_social_comments",
  WIKI_ARTICLES: "pet_social_wiki_articles",
  WIKI_REVISIONS: "pet_social_wiki_revisions",
  ACTIVITIES: "pet_social_activities",
  CURRENT_USER: "pet_social_current_user",
  FRIEND_REQUESTS: "pet_social_friend_requests",
  GROUPS: "pet_social_groups",
  GROUP_CATEGORIES: "pet_social_group_categories",
  GROUP_MEMBERS: "pet_social_group_members",
  GROUP_TOPICS: "pet_social_group_topics",
  GROUP_POLLS: "pet_social_group_polls",
  GROUP_EVENTS: "pet_social_group_events",
  GROUP_RESOURCES: "pet_social_group_resources",
  GROUP_ACTIVITIES: "pet_social_group_activities",
  POLL_VOTES: "pet_social_poll_votes",
  EVENT_RSVPS: "pet_social_event_rsvps",
  GROUP_WARNINGS: "pet_social_group_warnings",
  GROUP_BANS: "pet_social_group_bans",
  MODERATION_ACTIONS: "pet_social_moderation_actions",
  CONVERSATIONS: "pet_social_conversations",
  DIRECT_MESSAGES: "pet_social_direct_messages",
  PLACES: "pet_social_places",
  PLACE_PHOTOS: "pet_social_place_photos",
  WIKI_TRANSLATIONS: "pet_social_wiki_translations",
  TRANSLATION_GLOSSARY: "pet_social_translation_glossary",
  EDIT_REQUESTS: "pet_social_edit_requests",
  EDIT_REQUEST_AUDIT_LOGS: "pet_social_edit_request_audit_logs",
  ROLLBACK_HISTORY: "pet_social_rollback_history",
  ARTICLE_REPORTS: "pet_social_article_reports",
  COI_FLAGS: "pet_social_coi_flags",
  ORGANIZATIONS: "pet_social_organizations",
  EXPERT_PROFILES: "pet_social_expert_profiles",
  EXPERT_VERIFICATION_REQUESTS: "pet_social_expert_verification_requests",
  WATCH_ENTRIES: "pet_social_watch_entries",
  PINNED_ITEMS: "pet_social_pinned_items",
  ANNOUNCEMENTS: "pet_social_announcements",
  ANNOUNCEMENT_DISMISSALS: "pet_social_announcement_dismissals",
  SOURCES: "pet_social_sources",
  INTEGRATIONS: "pet_social_integrations",
  PRODUCTS: "pet_social_products",
  RECALLS: "pet_social_recalls",
} as const;

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  stats: {
    totalKeys: number;
    validKeys: number;
    invalidKeys: number;
    missingKeys: string[];
  };
}

export interface ValidationError {
  key: string;
  message: string;
  details?: unknown;
}

export interface ValidationWarning {
  key: string;
  message: string;
  details?: unknown;
}

/**
 * Validates all storage data
 */
export function validateStorage(): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const missingKeys: string[] = [];
  let validKeys = 0;
  let invalidKeys = 0;

  if (typeof window === 'undefined') {
    return {
      isValid: false,
      errors: [{ key: 'window', message: 'Storage validation can only run in browser environment' }],
      warnings: [],
      stats: {
        totalKeys: 0,
        validKeys: 0,
        invalidKeys: 0,
        missingKeys: [],
      },
    };
  }

  // Validate each storage key
  const storageKeys = Object.values(STORAGE_KEYS);
  const totalKeys = storageKeys.length;

  for (const key of storageKeys) {
    try {
      const value = localStorage.getItem(key);
      
      if (!value) {
        missingKeys.push(key);
        warnings.push({
          key,
          message: `Storage key "${key}" is missing (may be initialized later)`,
        });
        continue;
      }

      // Try to parse JSON
      let parsed: unknown;
      try {
        parsed = JSON.parse(value);
      } catch (parseError) {
        invalidKeys++;
        errors.push({
          key,
          message: `Failed to parse JSON for key "${key}"`,
          details: parseError,
        });
        continue;
      }

      // Validate specific data structures
      const keyValidation = validateKey(key, parsed);
      if (keyValidation.isValid) {
        validKeys++;
      } else {
        invalidKeys++;
        errors.push(...keyValidation.errors);
        warnings.push(...keyValidation.warnings);
      }
    } catch (error) {
      invalidKeys++;
      errors.push({
        key,
        message: `Unexpected error validating key "${key}"`,
        details: error,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats: {
      totalKeys,
      validKeys,
      invalidKeys,
      missingKeys,
    },
  };
}

/**
 * Validates a specific storage key
 */
function validateKey(key: string, data: unknown): { isValid: boolean; errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  switch (key) {
    case STORAGE_KEYS.USERS:
      return validateUsers(data);
    case STORAGE_KEYS.PETS:
      return validatePets(data);
    case STORAGE_KEYS.BLOG_POSTS:
      return validateBlogPosts(data);
    case STORAGE_KEYS.COMMENTS:
      return validateComments(data);
    case STORAGE_KEYS.WIKI_ARTICLES:
      return validateWikiArticles(data);
    case STORAGE_KEYS.CONVERSATIONS:
      return validateConversations(data);
    case STORAGE_KEYS.DIRECT_MESSAGES:
      return validateDirectMessages(data);
    case STORAGE_KEYS.GROUPS:
      return validateGroups(data);
    case STORAGE_KEYS.GROUP_MEMBERS:
      return validateGroupMembers(data);
    case STORAGE_KEYS.FRIEND_REQUESTS:
      return validateFriendRequests(data);
    default:
      // For other keys, just check if it's an array or object
      if (Array.isArray(data)) {
        warnings.push({
          key,
          message: `Key "${key}" contains array data (${data.length} items) - structure not validated`,
        });
        return { isValid: true, errors, warnings };
      } else if (typeof data === 'object' && data !== null) {
        warnings.push({
          key,
          message: `Key "${key}" contains object data - structure not validated`,
        });
        return { isValid: true, errors, warnings };
      } else {
        errors.push({
          key,
          message: `Key "${key}" contains invalid data type: ${typeof data}`,
        });
        return { isValid: false, errors, warnings };
      }
  }
}

function validateUsers(data: unknown): { isValid: boolean; errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!Array.isArray(data)) {
    errors.push({ key: STORAGE_KEYS.USERS, message: 'Users data must be an array' });
    return { isValid: false, errors, warnings };
  }

  const users = data as User[];
  const seenIds = new Set<string>();
  const seenUsernames = new Set<string>();
  const seenEmails = new Set<string>();

  users.forEach((user, index) => {
    if (!user.id) {
      errors.push({ key: STORAGE_KEYS.USERS, message: `User at index ${index} is missing id` });
    } else if (seenIds.has(user.id)) {
      errors.push({ key: STORAGE_KEYS.USERS, message: `Duplicate user id: ${user.id}` });
    } else {
      seenIds.add(user.id);
    }

    if (!user.username) {
      errors.push({ key: STORAGE_KEYS.USERS, message: `User ${user.id || index} is missing username` });
    } else if (seenUsernames.has(user.username)) {
      errors.push({ key: STORAGE_KEYS.USERS, message: `Duplicate username: ${user.username}` });
    } else {
      seenUsernames.add(user.username);
    }

    if (!user.email) {
      warnings.push({ key: STORAGE_KEYS.USERS, message: `User ${user.id || index} is missing email` });
    } else if (seenEmails.has(user.email)) {
      errors.push({ key: STORAGE_KEYS.USERS, message: `Duplicate email: ${user.email}` });
    } else {
      seenEmails.add(user.email);
    }

    if (!user.fullName) {
      warnings.push({ key: STORAGE_KEYS.USERS, message: `User ${user.id || index} is missing fullName` });
    }

    if (!user.joinedAt) {
      warnings.push({ key: STORAGE_KEYS.USERS, message: `User ${user.id || index} is missing joinedAt` });
    }

    if (!Array.isArray(user.followers)) {
      errors.push({ key: STORAGE_KEYS.USERS, message: `User ${user.id || index} followers must be an array` });
    }

    if (!Array.isArray(user.following)) {
      errors.push({ key: STORAGE_KEYS.USERS, message: `User ${user.id || index} following must be an array` });
    }
  });

  return { isValid: errors.length === 0, errors, warnings };
}

function validatePets(data: unknown): { isValid: boolean; errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!Array.isArray(data)) {
    errors.push({ key: STORAGE_KEYS.PETS, message: 'Pets data must be an array' });
    return { isValid: false, errors, warnings };
  }

  const pets = data as Pet[];
  const seenIds = new Set<string>();

  pets.forEach((pet, index) => {
    if (!pet.id) {
      errors.push({ key: STORAGE_KEYS.PETS, message: `Pet at index ${index} is missing id` });
    } else if (seenIds.has(pet.id)) {
      errors.push({ key: STORAGE_KEYS.PETS, message: `Duplicate pet id: ${pet.id}` });
    } else {
      seenIds.add(pet.id);
    }

    if (!pet.name) {
      errors.push({ key: STORAGE_KEYS.PETS, message: `Pet ${pet.id || index} is missing name` });
    }

    if (!pet.ownerId) {
      errors.push({ key: STORAGE_KEYS.PETS, message: `Pet ${pet.id || index} is missing ownerId` });
    }

    if (!pet.species) {
      errors.push({ key: STORAGE_KEYS.PETS, message: `Pet ${pet.id || index} is missing species` });
    }

    if (!Array.isArray(pet.followers)) {
      errors.push({ key: STORAGE_KEYS.PETS, message: `Pet ${pet.id || index} followers must be an array` });
    }
  });

  return { isValid: errors.length === 0, errors, warnings };
}

function validateBlogPosts(data: unknown): { isValid: boolean; errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!Array.isArray(data)) {
    errors.push({ key: STORAGE_KEYS.BLOG_POSTS, message: 'Blog posts data must be an array' });
    return { isValid: false, errors, warnings };
  }

  const posts = data as BlogPost[];
  const seenIds = new Set<string>();

  posts.forEach((post, index) => {
    if (!post.id) {
      errors.push({ key: STORAGE_KEYS.BLOG_POSTS, message: `Blog post at index ${index} is missing id` });
    } else if (seenIds.has(post.id)) {
      errors.push({ key: STORAGE_KEYS.BLOG_POSTS, message: `Duplicate blog post id: ${post.id}` });
    } else {
      seenIds.add(post.id);
    }

    if (!post.authorId) {
      errors.push({ key: STORAGE_KEYS.BLOG_POSTS, message: `Blog post ${post.id || index} is missing authorId` });
    }

    if (!post.petId) {
      warnings.push({ key: STORAGE_KEYS.BLOG_POSTS, message: `Blog post ${post.id || index} is missing petId` });
    }

    if (!post.title) {
      warnings.push({ key: STORAGE_KEYS.BLOG_POSTS, message: `Blog post ${post.id || index} is missing title` });
    }

    if (!post.createdAt) {
      warnings.push({ key: STORAGE_KEYS.BLOG_POSTS, message: `Blog post ${post.id || index} is missing createdAt` });
    }
  });

  return { isValid: errors.length === 0, errors, warnings };
}

function validateComments(data: unknown): { isValid: boolean; errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!Array.isArray(data)) {
    errors.push({ key: STORAGE_KEYS.COMMENTS, message: 'Comments data must be an array' });
    return { isValid: false, errors, warnings };
  }

  const comments = data as Comment[];
  const seenIds = new Set<string>();

  comments.forEach((comment, index) => {
    if (!comment.id) {
      errors.push({ key: STORAGE_KEYS.COMMENTS, message: `Comment at index ${index} is missing id` });
    } else if (seenIds.has(comment.id)) {
      errors.push({ key: STORAGE_KEYS.COMMENTS, message: `Duplicate comment id: ${comment.id}` });
    } else {
      seenIds.add(comment.id);
    }

    if (!comment.authorId) {
      errors.push({ key: STORAGE_KEYS.COMMENTS, message: `Comment ${comment.id || index} is missing authorId` });
    }

    if (!comment.content) {
      warnings.push({ key: STORAGE_KEYS.COMMENTS, message: `Comment ${comment.id || index} is missing content` });
    }
  });

  return { isValid: errors.length === 0, errors, warnings };
}

function validateWikiArticles(data: unknown): { isValid: boolean; errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!Array.isArray(data)) {
    errors.push({ key: STORAGE_KEYS.WIKI_ARTICLES, message: 'Wiki articles data must be an array' });
    return { isValid: false, errors, warnings };
  }

  const articles = data as WikiArticle[];
  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();

  articles.forEach((article, index) => {
    if (!article.id) {
      errors.push({ key: STORAGE_KEYS.WIKI_ARTICLES, message: `Wiki article at index ${index} is missing id` });
    } else if (seenIds.has(article.id)) {
      errors.push({ key: STORAGE_KEYS.WIKI_ARTICLES, message: `Duplicate wiki article id: ${article.id}` });
    } else {
      seenIds.add(article.id);
    }

    if (!article.slug) {
      warnings.push({ key: STORAGE_KEYS.WIKI_ARTICLES, message: `Wiki article ${article.id || index} is missing slug` });
    } else if (seenSlugs.has(article.slug)) {
      warnings.push({ key: STORAGE_KEYS.WIKI_ARTICLES, message: `Duplicate wiki article slug: ${article.slug}` });
    } else {
      seenSlugs.add(article.slug);
    }

    if (!article.title) {
      errors.push({ key: STORAGE_KEYS.WIKI_ARTICLES, message: `Wiki article ${article.id || index} is missing title` });
    }
  });

  return { isValid: errors.length === 0, errors, warnings };
}

function validateConversations(data: unknown): { isValid: boolean; errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!Array.isArray(data)) {
    errors.push({ key: STORAGE_KEYS.CONVERSATIONS, message: 'Conversations data must be an array' });
    return { isValid: false, errors, warnings };
  }

  const conversations = data as Conversation[];
  const seenIds = new Set<string>();

  conversations.forEach((conv, index) => {
    if (!conv.id) {
      errors.push({ key: STORAGE_KEYS.CONVERSATIONS, message: `Conversation at index ${index} is missing id` });
    } else if (seenIds.has(conv.id)) {
      errors.push({ key: STORAGE_KEYS.CONVERSATIONS, message: `Duplicate conversation id: ${conv.id}` });
    } else {
      seenIds.add(conv.id);
    }

    if (!Array.isArray(conv.participants) || conv.participants.length < 2) {
      errors.push({ key: STORAGE_KEYS.CONVERSATIONS, message: `Conversation ${conv.id || index} must have at least 2 participants` });
    }
  });

  return { isValid: errors.length === 0, errors, warnings };
}

function validateDirectMessages(data: unknown): { isValid: boolean; errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!Array.isArray(data)) {
    errors.push({ key: STORAGE_KEYS.DIRECT_MESSAGES, message: 'Direct messages data must be an array' });
    return { isValid: false, errors, warnings };
  }

  const messages = data as DirectMessage[];
  const seenIds = new Set<string>();

  messages.forEach((msg, index) => {
    if (!msg.id) {
      errors.push({ key: STORAGE_KEYS.DIRECT_MESSAGES, message: `Direct message at index ${index} is missing id` });
    } else if (seenIds.has(msg.id)) {
      errors.push({ key: STORAGE_KEYS.DIRECT_MESSAGES, message: `Duplicate direct message id: ${msg.id}` });
    } else {
      seenIds.add(msg.id);
    }

    if (!msg.conversationId) {
      errors.push({ key: STORAGE_KEYS.DIRECT_MESSAGES, message: `Direct message ${msg.id || index} is missing conversationId` });
    }

    if (!msg.senderId) {
      errors.push({ key: STORAGE_KEYS.DIRECT_MESSAGES, message: `Direct message ${msg.id || index} is missing senderId` });
    }
  });

  return { isValid: errors.length === 0, errors, warnings };
}

function validateGroups(data: unknown): { isValid: boolean; errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!Array.isArray(data)) {
    errors.push({ key: STORAGE_KEYS.GROUPS, message: 'Groups data must be an array' });
    return { isValid: false, errors, warnings };
  }

  const groups = data as Group[];
  const seenIds = new Set<string>();

  groups.forEach((group, index) => {
    if (!group.id) {
      errors.push({ key: STORAGE_KEYS.GROUPS, message: `Group at index ${index} is missing id` });
    } else if (seenIds.has(group.id)) {
      errors.push({ key: STORAGE_KEYS.GROUPS, message: `Duplicate group id: ${group.id}` });
    } else {
      seenIds.add(group.id);
    }

    if (!group.name) {
      errors.push({ key: STORAGE_KEYS.GROUPS, message: `Group ${group.id || index} is missing name` });
    }

    if (!group.ownerId) {
      errors.push({ key: STORAGE_KEYS.GROUPS, message: `Group ${group.id || index} is missing ownerId` });
    }
  });

  return { isValid: errors.length === 0, errors, warnings };
}

function validateGroupMembers(data: unknown): { isValid: boolean; errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!Array.isArray(data)) {
    errors.push({ key: STORAGE_KEYS.GROUP_MEMBERS, message: 'Group members data must be an array' });
    return { isValid: false, errors, warnings };
  }

  const members = data as GroupMember[];
  const seenIds = new Set<string>();

  members.forEach((member, index) => {
    if (!member.id) {
      errors.push({ key: STORAGE_KEYS.GROUP_MEMBERS, message: `Group member at index ${index} is missing id` });
    } else if (seenIds.has(member.id)) {
      errors.push({ key: STORAGE_KEYS.GROUP_MEMBERS, message: `Duplicate group member id: ${member.id}` });
    } else {
      seenIds.add(member.id);
    }

    if (!member.groupId) {
      errors.push({ key: STORAGE_KEYS.GROUP_MEMBERS, message: `Group member ${member.id || index} is missing groupId` });
    }

    if (!member.userId) {
      errors.push({ key: STORAGE_KEYS.GROUP_MEMBERS, message: `Group member ${member.id || index} is missing userId` });
    }
  });

  return { isValid: errors.length === 0, errors, warnings };
}

function validateFriendRequests(data: unknown): { isValid: boolean; errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!Array.isArray(data)) {
    errors.push({ key: STORAGE_KEYS.FRIEND_REQUESTS, message: 'Friend requests data must be an array' });
    return { isValid: false, errors, warnings };
  }

  const requests = data as FriendRequest[];
  const seenIds = new Set<string>();

  requests.forEach((request, index) => {
    if (!request.id) {
      errors.push({ key: STORAGE_KEYS.FRIEND_REQUESTS, message: `Friend request at index ${index} is missing id` });
    } else if (seenIds.has(request.id)) {
      errors.push({ key: STORAGE_KEYS.FRIEND_REQUESTS, message: `Duplicate friend request id: ${request.id}` });
    } else {
      seenIds.add(request.id);
    }

    if (!request.senderPetId) {
      errors.push({ key: STORAGE_KEYS.FRIEND_REQUESTS, message: `Friend request ${request.id || index} is missing senderPetId` });
    }

    if (!request.receiverPetId) {
      errors.push({ key: STORAGE_KEYS.FRIEND_REQUESTS, message: `Friend request ${request.id || index} is missing receiverPetId` });
    }
  });

  return { isValid: errors.length === 0, errors, warnings };
}

