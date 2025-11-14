import {
  calculateDiff,
  extractLinks,
  compareObjects,
  calculateEditRequestDiff,
  calculateBlogDiff,
  calculateWikiDiff,
  calculatePetDiff,
  calculateProfileDiff,
} from '@/lib/diff-utils';

describe('calculateDiff', () => {
  test('returns identical text when no changes', () => {
    const result = calculateDiff('Hello world', 'Hello world');
    expect(result.oldValue).toBe('Hello world');
    expect(result.newValue).toBe('Hello world');
    expect(result.diffHtml).toBe('Hello world');
  });

  test('handles null values', () => {
    const result = calculateDiff(null, 'New text');
    expect(result.oldValue).toBe('');
    expect(result.newValue).toBe('New text');
    expect(result.diffHtml).toContain('diff-added');
  });

  test('marks added words', () => {
    const result = calculateDiff('Hello', 'Hello world');
    expect(result.diffHtml).toContain('Hello');
    expect(result.diffHtml).toContain('diff-added');
    expect(result.diffHtml).toContain('world');
  });

  test('marks removed words', () => {
    const result = calculateDiff('Hello world', 'Hello');
    expect(result.diffHtml).toContain('Hello');
    expect(result.diffHtml).toContain('diff-removed');
    expect(result.diffHtml).toContain('world');
  });

  test('marks modified words', () => {
    const result = calculateDiff('Hello world', 'Hello universe');
    expect(result.diffHtml).toContain('Hello');
    expect(result.diffHtml).toContain('diff-removed');
    expect(result.diffHtml).toContain('world');
    expect(result.diffHtml).toContain('diff-added');
    expect(result.diffHtml).toContain('universe');
  });

  test('escapes HTML characters', () => {
    const result = calculateDiff('<script>alert("xss")</script>', '<script>alert("xss")</script>');
    expect(result.diffHtml).not.toContain('<script>');
    expect(result.diffHtml).toContain('&lt;');
    expect(result.diffHtml).toContain('&gt;');
  });
});

describe('extractLinks', () => {
  test('extracts HTTP links', () => {
    const text = 'Check out http://example.com for more info';
    const links = extractLinks(text);
    expect(links).toEqual(['http://example.com']);
  });

  test('extracts HTTPS links', () => {
    const text = 'Visit https://secure.example.com';
    const links = extractLinks(text);
    expect(links).toEqual(['https://secure.example.com']);
  });

  test('extracts multiple links', () => {
    const text = 'See http://example.com and https://another.com';
    const links = extractLinks(text);
    expect(links).toEqual(['http://example.com', 'https://another.com']);
  });

  test('returns empty array when no links', () => {
    const text = 'No links here';
    const links = extractLinks(text);
    expect(links).toEqual([]);
  });

  test('handles links with paths and query params', () => {
    const text = 'Visit https://example.com/path?query=value';
    const links = extractLinks(text);
    expect(links).toEqual(['https://example.com/path?query=value']);
  });
});

describe('compareObjects', () => {
  test('detects added fields', () => {
    const oldObj = { name: 'John' };
    const newObj = { name: 'John', age: 30 };
    const diffs = compareObjects(oldObj, newObj);
    
    expect(diffs).toHaveLength(1);
    expect(diffs[0].field).toBe('age');
    expect(diffs[0].oldValue).toBe('');
    expect(diffs[0].newValue).toBe('30');
  });

  test('detects removed fields', () => {
    const oldObj = { name: 'John', age: 30 };
    const newObj = { name: 'John' };
    const diffs = compareObjects(oldObj, newObj);
    
    expect(diffs).toHaveLength(1);
    expect(diffs[0].field).toBe('age');
    expect(diffs[0].oldValue).toBe('30');
    expect(diffs[0].newValue).toBe('');
  });

  test('detects modified fields', () => {
    const oldObj = { name: 'John', age: 30 };
    const newObj = { name: 'Jane', age: 30 };
    const diffs = compareObjects(oldObj, newObj);
    
    expect(diffs).toHaveLength(1);
    expect(diffs[0].field).toBe('name');
    expect(diffs[0].oldValue).toBe('John');
    expect(diffs[0].newValue).toBe('Jane');
  });

  test('returns empty array when objects are identical', () => {
    const oldObj = { name: 'John', age: 30 };
    const newObj = { name: 'John', age: 30 };
    const diffs = compareObjects(oldObj, newObj);
    
    expect(diffs).toHaveLength(0);
  });

  test('handles null values', () => {
    const oldObj = { name: 'John', bio: null };
    const newObj = { name: 'John', bio: 'Developer' };
    const diffs = compareObjects(oldObj, newObj);
    
    expect(diffs).toHaveLength(1);
    expect(diffs[0].field).toBe('bio');
  });
});

describe('calculateEditRequestDiff', () => {
  test('detects added fields', () => {
    const oldContent = { title: 'Original' };
    const newContent = { title: 'Original', subtitle: 'New subtitle' };
    const diff = calculateEditRequestDiff(oldContent, newContent);
    
    expect(diff.subtitle).toBeDefined();
    expect(diff.subtitle.type).toBe('added');
    expect(diff.subtitle.old).toBeNull();
    expect(diff.subtitle.new).toBe('New subtitle');
  });

  test('detects deleted fields', () => {
    const oldContent = { title: 'Original', subtitle: 'Old subtitle' };
    const newContent = { title: 'Original' };
    const diff = calculateEditRequestDiff(oldContent, newContent);
    
    expect(diff.subtitle).toBeDefined();
    expect(diff.subtitle.type).toBe('deleted');
    expect(diff.subtitle.old).toBe('Old subtitle');
    expect(diff.subtitle.new).toBeNull();
  });

  test('detects modified fields', () => {
    const oldContent = { title: 'Original', content: 'Old content' };
    const newContent = { title: 'Updated', content: 'Old content' };
    const diff = calculateEditRequestDiff(oldContent, newContent);
    
    expect(diff.title).toBeDefined();
    expect(diff.title.type).toBe('modified');
    expect(diff.title.old).toBe('Original');
    expect(diff.title.new).toBe('Updated');
  });

  test('skips identical fields', () => {
    const oldContent = { title: 'Same', content: 'Same content' };
    const newContent = { title: 'Same', content: 'Same content' };
    const diff = calculateEditRequestDiff(oldContent, newContent);
    
    expect(Object.keys(diff)).toHaveLength(0);
  });

  test('handles arrays correctly', () => {
    const oldContent = { tags: ['tag1', 'tag2'] };
    const newContent = { tags: ['tag1', 'tag3'] };
    const diff = calculateEditRequestDiff(oldContent, newContent);
    
    expect(diff.tags).toBeDefined();
    expect(diff.tags.type).toBe('modified');
    expect(diff.tags.old).toEqual(['tag1', 'tag2']);
    expect(diff.tags.new).toEqual(['tag1', 'tag3']);
  });

  test('handles nested objects', () => {
    const oldContent = { meta: { author: 'John', date: '2024-01-01' } };
    const newContent = { meta: { author: 'Jane', date: '2024-01-01' } };
    const diff = calculateEditRequestDiff(oldContent, newContent);
    
    expect(diff.meta).toBeDefined();
    expect(diff.meta.type).toBe('modified');
  });

  test('handles null and undefined values', () => {
    const oldContent = { bio: null, avatar: undefined };
    const newContent = { bio: 'New bio', avatar: 'avatar.jpg' };
    const diff = calculateEditRequestDiff(oldContent, newContent);
    
    expect(diff.bio).toBeDefined();
    expect(diff.bio.type).toBe('modified');
    expect(diff.avatar).toBeDefined();
    expect(diff.avatar.type).toBe('added');
  });
});

describe('calculateBlogDiff', () => {
  test('calculates diff for blog post title change', () => {
    const oldPost = { title: 'Old Title', content: 'Content' };
    const newPost = { title: 'New Title', content: 'Content' };
    const diff = calculateBlogDiff(oldPost, newPost);
    
    expect(diff.title).toBeDefined();
    expect((diff.title as any).type).toBe('modified');
    expect((diff.title as any).old).toBe('Old Title');
    expect((diff.title as any).new).toBe('New Title');
  });

  test('calculates diff for blog post content change', () => {
    const oldPost = { title: 'Title', content: 'Old content' };
    const newPost = { title: 'Title', content: 'New content' };
    const diff = calculateBlogDiff(oldPost, newPost);
    
    expect(diff.content).toBeDefined();
    expect((diff.content as any).type).toBe('modified');
  });

  test('calculates diff for tags change', () => {
    const oldPost = { title: 'Title', tags: ['tag1', 'tag2'] };
    const newPost = { title: 'Title', tags: ['tag1', 'tag3'] };
    const diff = calculateBlogDiff(oldPost, newPost);
    
    expect(diff.tags).toBeDefined();
    expect((diff.tags as any).type).toBe('modified');
  });

  test('calculates diff for cover image change', () => {
    const oldPost = { title: 'Title', coverImage: null };
    const newPost = { title: 'Title', coverImage: 'image.jpg' };
    const diff = calculateBlogDiff(oldPost, newPost);
    
    expect(diff.coverImage).toBeDefined();
    expect((diff.coverImage as any).type).toBe('modified');
  });

  test('returns empty diff when posts are identical', () => {
    const oldPost = { title: 'Title', content: 'Content' };
    const newPost = { title: 'Title', content: 'Content' };
    const diff = calculateBlogDiff(oldPost, newPost);
    
    expect(Object.keys(diff)).toHaveLength(0);
  });
});

describe('calculateWikiDiff', () => {
  test('calculates diff for wiki article title change', () => {
    const oldArticle = { title: 'Old Title', content: 'Content' };
    const newArticle = { title: 'New Title', content: 'Content' };
    const diff = calculateWikiDiff(oldArticle, newArticle);
    
    expect(diff.title).toBeDefined();
    expect((diff.title as any).type).toBe('modified');
  });

  test('calculates diff for wiki article content change', () => {
    const oldArticle = { title: 'Title', content: 'Old content' };
    const newArticle = { title: 'Title', content: 'New content' };
    const diff = calculateWikiDiff(oldArticle, newArticle);
    
    expect(diff.content).toBeDefined();
    expect((diff.content as any).type).toBe('modified');
  });

  test('calculates diff for wiki article status change', () => {
    const oldArticle = { title: 'Title', status: 'draft' };
    const newArticle = { title: 'Title', status: 'published' };
    const diff = calculateWikiDiff(oldArticle, newArticle);
    
    expect(diff.status).toBeDefined();
    expect((diff.status as any).type).toBe('modified');
  });

  test('returns empty diff when articles are identical', () => {
    const oldArticle = { title: 'Title', content: 'Content' };
    const newArticle = { title: 'Title', content: 'Content' };
    const diff = calculateWikiDiff(oldArticle, newArticle);
    
    expect(Object.keys(diff)).toHaveLength(0);
  });
});

describe('calculatePetDiff', () => {
  test('calculates diff for pet name change', () => {
    const oldPet = { name: 'Fluffy', breed: 'Persian' };
    const newPet = { name: 'Mittens', breed: 'Persian' };
    const diff = calculatePetDiff(oldPet, newPet);
    
    expect(diff.name).toBeDefined();
    expect((diff.name as any).type).toBe('modified');
  });

  test('calculates diff for pet bio change', () => {
    const oldPet = { name: 'Fluffy', bio: null };
    const newPet = { name: 'Fluffy', bio: 'A friendly cat' };
    const diff = calculatePetDiff(oldPet, newPet);
    
    expect(diff.bio).toBeDefined();
    expect((diff.bio as any).type).toBe('modified');
  });

  test('calculates diff for pet breed change', () => {
    const oldPet = { name: 'Fluffy', breed: 'Persian' };
    const newPet = { name: 'Fluffy', breed: 'Maine Coon' };
    const diff = calculatePetDiff(oldPet, newPet);
    
    expect(diff.breed).toBeDefined();
    expect((diff.breed as any).type).toBe('modified');
  });

  test('calculates diff for pet birthday change', () => {
    const oldPet = { name: 'Fluffy', birthday: null };
    const newPet = { name: 'Fluffy', birthday: '2020-01-01' };
    const diff = calculatePetDiff(oldPet, newPet);
    
    expect(diff.birthday).toBeDefined();
    expect((diff.birthday as any).type).toBe('modified');
  });

  test('calculates diff for pet weight change', () => {
    const oldPet = { name: 'Fluffy', weight: '5kg' };
    const newPet = { name: 'Fluffy', weight: '6kg' };
    const diff = calculatePetDiff(oldPet, newPet);
    
    expect(diff.weight).toBeDefined();
    expect((diff.weight as any).type).toBe('modified');
  });

  test('returns empty diff when pets are identical', () => {
    const oldPet = { name: 'Fluffy', breed: 'Persian' };
    const newPet = { name: 'Fluffy', breed: 'Persian' };
    const diff = calculatePetDiff(oldPet, newPet);
    
    expect(Object.keys(diff)).toHaveLength(0);
  });
});

describe('calculateProfileDiff', () => {
  test('calculates diff for display name change', () => {
    const oldProfile = { displayName: 'John Doe', bio: 'Developer' };
    const newProfile = { displayName: 'Jane Doe', bio: 'Developer' };
    const diff = calculateProfileDiff(oldProfile, newProfile);
    
    expect(diff.displayName).toBeDefined();
    expect((diff.displayName as any).type).toBe('modified');
  });

  test('calculates diff for bio change', () => {
    const oldProfile = { displayName: 'John Doe', bio: null };
    const newProfile = { displayName: 'John Doe', bio: 'Software Engineer' };
    const diff = calculateProfileDiff(oldProfile, newProfile);
    
    expect(diff.bio).toBeDefined();
    expect((diff.bio as any).type).toBe('modified');
  });

  test('calculates diff for avatar URL change', () => {
    const oldProfile = { displayName: 'John Doe', avatarUrl: null };
    const newProfile = { displayName: 'John Doe', avatarUrl: 'avatar.jpg' };
    const diff = calculateProfileDiff(oldProfile, newProfile);
    
    expect(diff.avatarUrl).toBeDefined();
    expect((diff.avatarUrl as any).type).toBe('modified');
  });

  test('returns empty diff when profiles are identical', () => {
    const oldProfile = { displayName: 'John Doe', bio: 'Developer' };
    const newProfile = { displayName: 'John Doe', bio: 'Developer' };
    const diff = calculateProfileDiff(oldProfile, newProfile);
    
    expect(Object.keys(diff)).toHaveLength(0);
  });
});
