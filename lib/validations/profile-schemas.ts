import { z } from 'zod';

// Helper regex patterns
const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_-]{2,19}$/;
const FULL_NAME_REGEX = /^[a-zA-Z\s'-]+$/;
const URL_REGEX = /^https?:\/\/.+/;
const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/; // E.164 format
const INSTAGRAM_REGEX = /^[a-zA-Z0-9._]{1,30}$/;
const TWITTER_REGEX = /^[a-zA-Z0-9_]{1,15}$/;
const TIKTOK_REGEX = /^[a-zA-Z0-9._]{2,24}$/;
const YOUTUBE_REGEX = /^[a-zA-Z0-9_-]{1,100}$/;

// Helper function to count hashtags in text
function countHashtags(text: string): number {
  const matches = text.match(/#[\w]+/g);
  return matches ? matches.length : 0;
}

// Helper function to calculate age
function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Schema for basic profile information
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
 */
export const profileBasicInfoSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must not exceed 100 characters')
    .regex(FULL_NAME_REGEX, 'Full name can only contain letters, spaces, hyphens, and apostrophes')
    .trim(),
  
  displayName: z
    .string()
    .min(1, 'Display name must be at least 1 character')
    .max(50, 'Display name must not exceed 50 characters')
    .trim()
    .optional(),
  
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must not exceed 20 characters')
    .regex(USERNAME_REGEX, 'Username must start with a letter and contain only letters, numbers, underscores, and hyphens')
    .trim(),
  
  dateOfBirth: z
    .date()
    .refine((date: Date) => {
      const age = calculateAge(date);
      return age >= 13;
    }, 'You must be at least 13 years old')
    .optional(),
  
  showAge: z.boolean().default(false),
  
  showBirthYear: z.boolean().default(true),
  
  gender: z
    .enum(['male', 'female', 'non-binary', 'custom', 'prefer-not-to-say'])
    .optional(),
  
  customGender: z
    .string()
    .max(50, 'Custom gender must not exceed 50 characters')
    .trim()
    .optional(),
});

/**
 * Schema for profile bio and about section
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8
 */
export const profileBioSchema = z.object({
  bio: z
    .string()
    .max(1000, 'Bio must not exceed 1000 characters')
    .refine((text: string) => {
      const hashtagCount = countHashtags(text);
      return hashtagCount <= 10;
    }, 'Bio cannot contain more than 10 hashtags')
    .optional(),
  
  interests: z
    .array(z.string().max(30, 'Each interest must not exceed 30 characters'))
    .max(30, 'You can select up to 30 interests')
    .default([]),
  
  languages: z
    .array(
      z.object({
        language: z.string().min(1, 'Language is required'),
        proficiency: z.enum(['native', 'fluent', 'conversational', 'basic', 'learning']),
      })
    )
    .optional(),
});

/**
 * Schema for contact information
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */
export const profileContactSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .trim()
    .optional(),
  
  phoneNumber: z
    .string()
    .regex(PHONE_REGEX, 'Please enter a valid phone number in international format (e.g., +1234567890)')
    .optional()
    .or(z.literal('')),
  
  websiteUrl: z
    .string()
    .regex(URL_REGEX, 'Website URL must start with http:// or https://')
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal('')),
  
  socialLinks: z
    .object({
      instagram: z
        .string()
        .regex(INSTAGRAM_REGEX, 'Invalid Instagram username format')
        .optional()
        .or(z.literal('')),
      
      twitter: z
        .string()
        .regex(TWITTER_REGEX, 'Invalid Twitter username format (max 15 characters)')
        .optional()
        .or(z.literal('')),
      
      tiktok: z
        .string()
        .regex(TIKTOK_REGEX, 'Invalid TikTok username format')
        .optional()
        .or(z.literal('')),
      
      youtube: z
        .string()
        .regex(YOUTUBE_REGEX, 'Invalid YouTube channel/username format')
        .optional()
        .or(z.literal('')),
      
      facebook: z
        .string()
        .min(1, 'Facebook username cannot be empty')
        .optional()
        .or(z.literal('')),
    })
    .optional(),
});

/**
 * Schema for location information
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */
export const profileLocationSchema = z.object({
  country: z
    .string()
    .min(2, 'Country is required')
    .max(100, 'Country name is too long')
    .optional(),
  
  state: z
    .string()
    .max(100, 'State/region name is too long')
    .optional()
    .or(z.literal('')),
  
  city: z
    .string()
    .max(100, 'City name is too long')
    .optional()
    .or(z.literal('')),
  
  timezone: z
    .string()
    .regex(/^[A-Za-z_]+\/[A-Za-z_]+$/, 'Invalid timezone format (e.g., America/New_York)')
    .optional(),
});

/**
 * Schema for privacy settings
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */
export const privacySettingsSchema = z.object({
  // Profile visibility
  profileVisibility: z
    .enum(['public', 'friends', 'private', 'custom'])
    .default('public'),
  
  // Field visibility settings
  profilePhotoVisibility: z
    .enum(['everyone', 'friends', 'only_me'])
    .default('everyone'),
  
  coverPhotoVisibility: z
    .enum(['everyone', 'friends', 'only_me'])
    .default('everyone'),
  
  emailVisibility: z
    .enum(['everyone', 'friends', 'only_me', 'never'])
    .default('only_me'),
  
  phoneVisibility: z
    .enum(['everyone', 'friends', 'only_me', 'never'])
    .default('only_me'),
  
  birthdayVisibility: z
    .enum(['everyone', 'friends', 'only_me', 'hide_year'])
    .default('friends'),
  
  ageVisibility: z
    .enum(['everyone', 'friends', 'only_me'])
    .default('friends'),
  
  locationVisibility: z
    .enum(['exact', 'state', 'country', 'hidden'])
    .default('exact'),
  
  joinedDateVisibility: z
    .enum(['everyone', 'friends', 'only_me'])
    .default('everyone'),
  
  lastActiveVisibility: z
    .enum(['everyone', 'friends', 'only_me', 'hidden'])
    .default('friends'),
  
  // Contact privacy controls
  whoCanMessage: z
    .enum(['everyone', 'friends', 'friends_of_friends', 'following', 'no_one'])
    .default('everyone'),
  
  whoCanTag: z
    .enum(['everyone', 'friends', 'only_me', 'no_one'])
    .default('friends'),
  
  friendsListVisibility: z
    .enum(['everyone', 'friends', 'only_me'])
    .default('friends'),
  
  followingListVisibility: z
    .enum(['everyone', 'friends', 'only_me'])
    .default('friends'),
  
  likedPostsVisibility: z
    .enum(['everyone', 'friends', 'only_me'])
    .default('only_me'),
});

/**
 * Combined profile update schema
 * Combines all profile sections for comprehensive validation
 */
export const profileUpdateSchema = z.object({
  basicInfo: profileBasicInfoSchema.partial().optional(),
  bio: profileBioSchema.partial().optional(),
  contact: profileContactSchema.partial().optional(),
  location: profileLocationSchema.partial().optional(),
  privacy: privacySettingsSchema.partial().optional(),
});

/**
 * Schema for username change request
 * Requirements: 12.3, 12.4
 */
export const usernameChangeSchema = z.object({
  newUsername: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must not exceed 20 characters')
    .regex(USERNAME_REGEX, 'Username must start with a letter and contain only letters, numbers, underscores, and hyphens')
    .trim(),
  
  password: z
    .string()
    .min(1, 'Password is required for username changes'),
});

/**
 * Schema for email change request
 * Requirements: 5.2, 5.3
 */
export const emailChangeSchema = z.object({
  newEmail: z
    .string()
    .email('Please enter a valid email address')
    .trim(),
  
  password: z
    .string()
    .min(1, 'Password is required for email changes'),
});

/**
 * Schema for phone verification
 * Requirements: 5.4
 */
export const phoneVerificationSchema = z.object({
  phoneNumber: z
    .string()
    .regex(PHONE_REGEX, 'Please enter a valid phone number in international format'),
  
  otp: z
    .string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only numbers')
    .optional(),
});

/**
 * Schema for blocking/restricting users
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */
export const blockUserSchema = z.object({
  targetUserId: z
    .string()
    .uuid('Invalid user ID format'),
});

export const restrictUserSchema = z.object({
  targetUserId: z
    .string()
    .uuid('Invalid user ID format'),
});

// Type exports for TypeScript
export type ProfileBasicInfo = z.infer<typeof profileBasicInfoSchema>;
export type ProfileBio = z.infer<typeof profileBioSchema>;
export type ProfileContact = z.infer<typeof profileContactSchema>;
export type ProfileLocation = z.infer<typeof profileLocationSchema>;
export type PrivacySettings = z.infer<typeof privacySettingsSchema>;
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;
export type UsernameChange = z.infer<typeof usernameChangeSchema>;
export type EmailChange = z.infer<typeof emailChangeSchema>;
export type PhoneVerification = z.infer<typeof phoneVerificationSchema>;
export type BlockUser = z.infer<typeof blockUserSchema>;
export type RestrictUser = z.infer<typeof restrictUserSchema>;
