import type {
  RecentChange,
  QueueItem,
  BulkOperation,
  RangeBlock,
  LinkRule,
  DetectedLink,
  HiddenCategory,
  CategoryAssignment,
  QueueType,
  TriageCategory,
  ChangeType,
} from './types';

const STORAGE_KEYS = {
  RECENT_CHANGES: 'moderation_recent_changes',
  QUEUE_ITEMS: 'moderation_queue_items',
  BULK_OPERATIONS: 'moderation_bulk_operations',
  RANGE_BLOCKS: 'moderation_range_blocks',
  LINK_RULES: 'moderation_link_rules',
  DETECTED_LINKS: 'moderation_detected_links',
  HIDDEN_CATEGORIES: 'moderation_hidden_categories',
  CATEGORY_ASSIGNMENTS: 'moderation_category_assignments',
} as const;

function getStorageKey(key: keyof typeof STORAGE_KEYS): string {
  return STORAGE_KEYS[key];
}

function getFromStorage<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveToStorage<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to storage:', error);
  }
}

// Recent Changes
export function getRecentChanges(filters?: {
  type?: ChangeType;
  status?: RecentChange['status'];
  contentType?: RecentChange['contentType'];
  changedBy?: string;
  limit?: number;
  offset?: number;
}): RecentChange[] {
  const changes = getFromStorage<RecentChange>(getStorageKey('RECENT_CHANGES'));
  let filtered = [...changes].sort((a, b) => 
    new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
  );

  if (filters?.type) {
    filtered = filtered.filter(c => c.type === filters.type);
  }
  if (filters?.status) {
    filtered = filtered.filter(c => c.status === filters.status);
  }
  if (filters?.contentType) {
    filtered = filtered.filter(c => c.contentType === filters.contentType);
  }
  if (filters?.changedBy) {
    filtered = filtered.filter(c => c.changedBy === filters.changedBy);
  }

  const offset = filters?.offset || 0;
  const limit = filters?.limit;
  
  if (limit) {
    return filtered.slice(offset, offset + limit);
  }
  return filtered.slice(offset);
}

export function addRecentChange(change: Omit<RecentChange, 'id'>): RecentChange {
  const changes = getFromStorage<RecentChange>(getStorageKey('RECENT_CHANGES'));
  const newChange: RecentChange = {
    ...change,
    id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };
  changes.push(newChange);
  saveToStorage(getStorageKey('RECENT_CHANGES'), changes);
  return newChange;
}

export function updateRecentChange(id: string, updates: Partial<RecentChange>): RecentChange | null {
  const changes = getFromStorage<RecentChange>(getStorageKey('RECENT_CHANGES'));
  const index = changes.findIndex(c => c.id === id);
  if (index === -1) return null;
  
  changes[index] = { ...changes[index], ...updates };
  saveToStorage(getStorageKey('RECENT_CHANGES'), changes);
  return changes[index];
}

export function getRecentChangeById(id: string): RecentChange | null {
  const changes = getFromStorage<RecentChange>(getStorageKey('RECENT_CHANGES'));
  return changes.find(c => c.id === id) || null;
}

// Queue Items
export function getQueueItems(queueType?: QueueType): QueueItem[] {
  const items = getFromStorage<QueueItem>(getStorageKey('QUEUE_ITEMS'));
  let filtered = [...items].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (queueType) {
    filtered = filtered.filter(item => item.queueType === queueType);
  }

  return filtered;
}

export function addQueueItem(item: Omit<QueueItem, 'id' | 'createdAt' | 'updatedAt'>): QueueItem {
  const items = getFromStorage<QueueItem>(getStorageKey('QUEUE_ITEMS'));
  const now = new Date().toISOString();
  const newItem: QueueItem = {
    ...item,
    id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: now,
    updatedAt: now,
  };
  items.push(newItem);
  saveToStorage(getStorageKey('QUEUE_ITEMS'), items);
  return newItem;
}

export function updateQueueItem(id: string, updates: Partial<QueueItem>): QueueItem | null {
  const items = getFromStorage<QueueItem>(getStorageKey('QUEUE_ITEMS'));
  const index = items.findIndex(item => item.id === id);
  if (index === -1) return null;
  
  items[index] = { 
    ...items[index], 
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveToStorage(getStorageKey('QUEUE_ITEMS'), items);
  return items[index];
}

// Bulk Operations
export function addBulkOperation(operation: Omit<BulkOperation, 'id' | 'performedAt'>): BulkOperation {
  const operations = getFromStorage<BulkOperation>(getStorageKey('BULK_OPERATIONS'));
  const newOperation: BulkOperation = {
    ...operation,
    id: `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    performedAt: new Date().toISOString(),
  };
  operations.push(newOperation);
  saveToStorage(getStorageKey('BULK_OPERATIONS'), operations);
  return newOperation;
}

export function getBulkOperations(limit?: number): BulkOperation[] {
  const operations = getFromStorage<BulkOperation>(getStorageKey('BULK_OPERATIONS'));
  const sorted = [...operations].sort((a, b) => 
    new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()
  );
  return limit ? sorted.slice(0, limit) : sorted;
}

// Range Blocks
export function getRangeBlocks(): RangeBlock[] {
  return getFromStorage<RangeBlock>(getStorageKey('RANGE_BLOCKS'));
}

export function addRangeBlock(block: Omit<RangeBlock, 'id' | 'createdAt'>): RangeBlock {
  const blocks = getFromStorage<RangeBlock>(getStorageKey('RANGE_BLOCKS'));
  const newBlock: RangeBlock = {
    ...block,
    id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  };
  blocks.push(newBlock);
  saveToStorage(getStorageKey('RANGE_BLOCKS'), blocks);
  return newBlock;
}

export function updateRangeBlock(id: string, updates: Partial<RangeBlock>): RangeBlock | null {
  const blocks = getFromStorage<RangeBlock>(getStorageKey('RANGE_BLOCKS'));
  const index = blocks.findIndex(b => b.id === id);
  if (index === -1) return null;
  
  blocks[index] = { ...blocks[index], ...updates };
  saveToStorage(getStorageKey('RANGE_BLOCKS'), blocks);
  return blocks[index];
}

// Link Rules
export function getLinkRules(): LinkRule[] {
  return getFromStorage<LinkRule>(getStorageKey('LINK_RULES'));
}

export function addLinkRule(rule: Omit<LinkRule, 'id' | 'createdAt'>): LinkRule {
  const rules = getFromStorage<LinkRule>(getStorageKey('LINK_RULES'));
  const newRule: LinkRule = {
    ...rule,
    id: `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  };
  rules.push(newRule);
  saveToStorage(getStorageKey('LINK_RULES'), rules);
  return newRule;
}

export function updateLinkRule(id: string, updates: Partial<LinkRule>): LinkRule | null {
  const rules = getFromStorage<LinkRule>(getStorageKey('LINK_RULES'));
  const index = rules.findIndex(r => r.id === id);
  if (index === -1) return null;
  
  rules[index] = { ...rules[index], ...updates };
  saveToStorage(getStorageKey('LINK_RULES'), rules);
  return rules[index];
}

export function checkLinkStatus(url: string): { status: DetectedLink['status']; rule?: LinkRule } {
  const rules = getLinkRules().filter(r => r.isActive);
  const domain = new URL(url).hostname.replace('www.', '');
  
  for (const rule of rules) {
    const ruleDomain = rule.domain.replace('*.', '');
    if (domain === ruleDomain || domain.endsWith('.' + ruleDomain)) {
      return {
        status: rule.type === 'whitelist' ? 'allowed' : 'blocked',
        rule,
      };
    }
    
    if (rule.pattern) {
      try {
        const regex = new RegExp(rule.pattern);
        if (regex.test(url) || regex.test(domain)) {
          return {
            status: rule.type === 'whitelist' ? 'allowed' : 'blocked',
            rule,
          };
        }
      } catch {
        // Invalid regex, skip
      }
    }
  }
  
  return { status: 'unknown' };
}

// Detected Links
export function addDetectedLink(link: Omit<DetectedLink, 'id'>): DetectedLink {
  const links = getFromStorage<DetectedLink>(getStorageKey('DETECTED_LINKS'));
  const newLink: DetectedLink = {
    ...link,
    id: `detected_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };
  links.push(newLink);
  saveToStorage(getStorageKey('DETECTED_LINKS'), links);
  return newLink;
}

export function getDetectedLinks(filters?: {
  status?: DetectedLink['status'];
  contentType?: RecentChange['contentType'];
}): DetectedLink[] {
  const links = getFromStorage<DetectedLink>(getStorageKey('DETECTED_LINKS'));
  let filtered = [...links].sort((a, b) => 
    new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()
  );

  if (filters?.status) {
    filtered = filtered.filter(l => l.status === filters.status);
  }
  if (filters?.contentType) {
    filtered = filtered.filter(l => l.detectedIn.contentType === filters.contentType);
  }

  return filtered;
}

// Hidden Categories
export function getHiddenCategories(): HiddenCategory[] {
  return getFromStorage<HiddenCategory>(getStorageKey('HIDDEN_CATEGORIES'));
}

export function addHiddenCategory(category: Omit<HiddenCategory, 'id' | 'createdAt'>): HiddenCategory {
  const categories = getFromStorage<HiddenCategory>(getStorageKey('HIDDEN_CATEGORIES'));
  const newCategory: HiddenCategory = {
    ...category,
    id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  };
  categories.push(newCategory);
  saveToStorage(getStorageKey('HIDDEN_CATEGORIES'), categories);
  return newCategory;
}

export function updateHiddenCategory(id: string, updates: Partial<HiddenCategory>): HiddenCategory | null {
  const categories = getFromStorage<HiddenCategory>(getStorageKey('HIDDEN_CATEGORIES'));
  const index = categories.findIndex(c => c.id === id);
  if (index === -1) return null;
  
  categories[index] = { ...categories[index], ...updates };
  saveToStorage(getStorageKey('HIDDEN_CATEGORIES'), categories);
  return categories[index];
}

// Category Assignments
export function getCategoryAssignments(categoryId?: string, contentId?: string): CategoryAssignment[] {
  const assignments = getFromStorage<CategoryAssignment>(getStorageKey('CATEGORY_ASSIGNMENTS'));
  let filtered = [...assignments];

  if (categoryId) {
    filtered = filtered.filter(a => a.categoryId === categoryId);
  }
  if (contentId) {
    filtered = filtered.filter(a => a.contentId === contentId);
  }

  return filtered;
}

export function addCategoryAssignment(assignment: Omit<CategoryAssignment, 'id' | 'assignedAt'>): CategoryAssignment {
  const assignments = getFromStorage<CategoryAssignment>(getStorageKey('CATEGORY_ASSIGNMENTS'));
  const newAssignment: CategoryAssignment = {
    ...assignment,
    id: `assign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    assignedAt: new Date().toISOString(),
  };
  assignments.push(newAssignment);
  saveToStorage(getStorageKey('CATEGORY_ASSIGNMENTS'), assignments);
  return newAssignment;
}

export function removeCategoryAssignment(id: string): boolean {
  const assignments = getFromStorage<CategoryAssignment>(getStorageKey('CATEGORY_ASSIGNMENTS'));
  const index = assignments.findIndex(a => a.id === id);
  if (index === -1) return false;
  
  assignments.splice(index, 1);
  saveToStorage(getStorageKey('CATEGORY_ASSIGNMENTS'), assignments);
  return true;
}

