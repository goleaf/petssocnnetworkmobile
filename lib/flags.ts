import { z } from "zod";

/**
 * Feature Flag System
 * 
 * This module provides type-safe feature flags for the application.
 * Flags can be toggled via admin interface and are persisted in storage.
 */

// Zod schemas for validation
export const FeatureFlagSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  enabled: z.boolean(),
  rolloutPercentage: z.number().int().min(0).max(100),
  rolloutNotes: z.string().optional(),
  targetEnvironment: z.enum(["development", "staging", "production", "all"]),
  killSwitch: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  updatedBy: z.string().optional(),
});

export const FeatureFlagsSchema = z.object({
  flags: z.record(z.string(), FeatureFlagSchema),
});

export type FeatureFlag = z.infer<typeof FeatureFlagSchema>;
export type FeatureFlags = z.infer<typeof FeatureFlagsSchema>;

// Default flags configuration
export const DEFAULT_FLAGS: FeatureFlags = {
  flags: {
    WIKI_WRITE: {
      key: "WIKI_WRITE",
      name: "Wiki Write Access",
      description: "Controls whether users can create or edit wiki articles. When disabled, only admins and verified experts can write to the wiki.",
      enabled: true,
      rolloutPercentage: 100,
      targetEnvironment: "all",
      killSwitch: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    WIKI_COMMENTS: {
      key: "WIKI_COMMENTS",
      name: "Wiki Comments",
      description: "Enables commenting on wiki articles",
      enabled: true,
      rolloutPercentage: 100,
      targetEnvironment: "all",
      killSwitch: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    BLOG_POSTING: {
      key: "BLOG_POSTING",
      name: "Blog Posting",
      description: "Allows users to create and publish blog posts",
      enabled: true,
      rolloutPercentage: 100,
      targetEnvironment: "all",
      killSwitch: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    GROUPS_CREATION: {
      key: "GROUPS_CREATION",
      name: "Group Creation",
      description: "Enables users to create new groups",
      enabled: true,
      rolloutPercentage: 100,
      targetEnvironment: "all",
      killSwitch: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    MESSAGING_DIRECT: {
      key: "MESSAGING_DIRECT",
      name: "Direct Messaging",
      description: "Enables direct messaging between users",
      enabled: true,
      rolloutPercentage: 100,
      targetEnvironment: "all",
      killSwitch: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    NOTIFICATIONS_PUSH: {
      key: "NOTIFICATIONS_PUSH",
      name: "Push Notifications",
      description: "Enables push notifications for mobile devices",
      enabled: true,
      rolloutPercentage: 100,
      targetEnvironment: "all",
      killSwitch: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    EXPERT_VERIFICATION: {
      key: "EXPERT_VERIFICATION",
      name: "Expert Verification",
      description: "Enables expert verification system for wiki contributors",
      enabled: true,
      rolloutPercentage: 100,
      targetEnvironment: "all",
      killSwitch: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    OFFLINE_MODE: {
      key: "OFFLINE_MODE",
      name: "Offline Mode",
      description: "Enables offline reading and caching features",
      enabled: true,
      rolloutPercentage: 100,
      targetEnvironment: "all",
      killSwitch: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
};

// Storage keys
const FLAGS_STORAGE_KEY = "feature_flags";

/**
 * Load flags from storage
 */
export function loadFlags(): FeatureFlags {
  if (typeof window === "undefined") {
    // Server-side: return defaults
    return DEFAULT_FLAGS;
  }

  try {
    const stored = localStorage.getItem(FLAGS_STORAGE_KEY);
    if (!stored) {
      return DEFAULT_FLAGS;
    }

    const parsed = JSON.parse(stored);
    const validated = FeatureFlagsSchema.safeParse(parsed);
    
    if (validated.success) {
      return validated.data;
    }

    console.warn("Invalid flags in storage, using defaults");
    return DEFAULT_FLAGS;
  } catch (error) {
    console.error("Error loading flags:", error);
    return DEFAULT_FLAGS;
  }
}

/**
 * Save flags to storage
 */
export function saveFlags(flags: FeatureFlags): void {
  if (typeof window === "undefined") {
    console.warn("Cannot save flags on server-side");
    return;
  }

  try {
    const validated = FeatureFlagsSchema.safeParse(flags);
    if (!validated.success) {
      console.error("Invalid flags data:", validated.error);
      return;
    }

    localStorage.setItem(FLAGS_STORAGE_KEY, JSON.stringify(validated.data));
  } catch (error) {
    console.error("Error saving flags:", error);
  }
}

/**
 * Get a specific flag by key
 */
export function getFlag(key: string): FeatureFlag | undefined {
  const flags = loadFlags();
  return flags.flags[key];
}

/**
 * Check if a flag is enabled
 */
export function isFlagEnabled(key: string): boolean {
  const flag = getFlag(key);
  if (!flag) {
    return false;
  }

  // Kill switch takes precedence
  if (flag.killSwitch) {
    return false;
  }

  return flag.enabled;
}

/**
 * Update a specific flag
 */
export function updateFlag(key: string, updates: Partial<FeatureFlag>, updatedBy?: string): boolean {
  const flags = loadFlags();
  const flag = flags.flags[key];
  
  if (!flag) {
    console.error(`Flag ${key} not found`);
    return false;
  }

  flags.flags[key] = {
    ...flag,
    ...updates,
    updatedAt: new Date().toISOString(),
    updatedBy: updatedBy || flag.updatedBy,
  };

  saveFlags(flags);
  return true;
}

/**
 * Create a new flag
 */
export function createFlag(flag: Omit<FeatureFlag, "createdAt" | "updatedAt">): boolean {
  const flags = loadFlags();

  if (flags.flags[flag.key]) {
    console.error(`Flag ${flag.key} already exists`);
    return false;
  }

  flags.flags[flag.key] = {
    ...flag,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveFlags(flags);
  return true;
}

/**
 * Delete a flag
 */
export function deleteFlag(key: string): boolean {
  const flags = loadFlags();

  if (!flags.flags[key]) {
    console.error(`Flag ${key} not found`);
    return false;
  }

  delete flags.flags[key];
  saveFlags(flags);
  return true;
}

/**
 * Get all flags
 */
export function getAllFlags(): FeatureFlags["flags"] {
  const flags = loadFlags();
  return flags.flags;
}

/**
 * Check if user should have access based on rollout percentage
 */
export function shouldHaveAccess(key: string, userId?: string): boolean {
  if (!isFlagEnabled(key)) {
    return false;
  }

  const flag = getFlag(key);
  if (!flag) {
    return false;
  }

  if (flag.rolloutPercentage === 100) {
    return true;
  }

  if (flag.rolloutPercentage === 0) {
    return false;
  }

  // Simple deterministic roll势头 based on userId if provided
  if (userId) {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = (hash << 5) - hash + userId.charCodeAt(i);
      hash = hash & hash;
    }
    const roll = Math.abs(hash % 100);
    return roll < flag.rolloutPercentage;
  }

  // If no userId, use random
  return Math.random() * 100 < flag.rolloutPercentage;
}

