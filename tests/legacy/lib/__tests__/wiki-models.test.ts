import { PrismaClient } from '@prisma/client'
import { prisma } from '../prisma'

// Use a test database or in-memory database
// For actual database tests, set TEST_DATABASE_URL in environment
const testDatabaseUrl = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/test?schema=test'

describe('Wiki Models - Create → Revise → Approve → Rollback', () => {
  let testPrisma: PrismaClient
  const testUserId = 'test-user-1'
  const testApproverId = 'test-approver-1'

  beforeAll(async () => {
    // For testing, we'll use the main prisma client
    // In a real scenario, you'd set up a test database
    testPrisma = prisma
  })

  afterAll(async () => {
    // Clean up test data
    await testPrisma.articleProp.deleteMany({})
    await testPrisma.articleTag.deleteMany({})
    await testPrisma.revision.deleteMany({})
    await testPrisma.article.deleteMany({})
    await testPrisma.$disconnect()
  })

  beforeEach(async () => {
    // Clean up before each test
    await testPrisma.articleProp.deleteMany({})
    await testPrisma.articleTag.deleteMany({})
    await testPrisma.revision.deleteMany({})
    await testPrisma.article.deleteMany({})
  })

  describe('Create → Revise → Approve → Rollback workflow', () => {
    it('should create an article with initial revision', async () => {
      // Create article
      const article = await testPrisma.article.create({
        data: {
          slug: 'test-article',
          title: 'Test Article',
          type: 'care',
          status: 'draft',
          createdById: testUserId,
          revisions: {
            create: {
              rev: 1,
              authorId: testUserId,
              summary: 'Initial creation',
              contentJSON: { blocks: [{ type: 'paragraph', text: 'Initial content' }] },
              infoboxJSON: { category: 'care' },
            },
          },
          tags: {
            create: [{ tag: 'puppy' }, { tag: 'training' }],
          },
          props: {
            create: [{ key: 'featured', value: false }, { key: 'views', value: 0 }],
          },
        },
        include: {
          revisions: true,
          tags: true,
          props: true,
        },
      })

      expect(article).toBeDefined()
      expect(article.slug).toBe('test-article')
      expect(article.title).toBe('Test Article')
      expect(article.type).toBe('care')
      expect(article.status).toBe('draft')
      expect(article.revisions).toHaveLength(1)
      expect(article.revisions[0].rev).toBe(1)
      expect(article.revisions[0].authorId).toBe(testUserId)
      expect(article.tags).toHaveLength(2)
      expect(article.props).toHaveLength(2)
    })

    it('should create a revision for an existing article', async () => {
      // Create article first
      const article = await testPrisma.article.create({
        data: {
          slug: 'test-article-revise',
          title: 'Test Article',
          type: 'care',
          status: 'draft',
          createdById: testUserId,
          revisions: {
            create: {
              rev: 1,
              authorId: testUserId,
              summary: 'Initial creation',
              contentJSON: { blocks: [{ type: 'paragraph', text: 'Initial content' }] },
            },
          },
        },
      })

      // Create revision 2
      const revision2 = await testPrisma.revision.create({
        data: {
          articleId: article.id,
          rev: 2,
          authorId: testUserId,
          summary: 'Updated content',
          contentJSON: { blocks: [{ type: 'paragraph', text: 'Updated content' }] },
          infoboxJSON: { category: 'care', updated: true },
        },
      })

      expect(revision2).toBeDefined()
      expect(revision2.articleId).toBe(article.id)
      expect(revision2.rev).toBe(2)
      expect(revision2.approvedById).toBeNull()

      // Verify both revisions exist
      const revisions = await testPrisma.revision.findMany({
        where: { articleId: article.id },
        orderBy: { rev: 'asc' },
      })

      expect(revisions).toHaveLength(2)
      expect(revisions[0].rev).toBe(1)
      expect(revisions[1].rev).toBe(2)
    })

    it('should approve a revision', async () => {
      // Create article with revision
      const article = await testPrisma.article.create({
        data: {
          slug: 'test-article-approve',
          title: 'Test Article',
          type: 'care',
          status: 'draft',
          createdById: testUserId,
          revisions: {
            create: {
              rev: 1,
              authorId: testUserId,
              summary: 'Initial creation',
              contentJSON: { blocks: [{ type: 'paragraph', text: 'Initial content' }] },
            },
          },
        },
      })

      const revision = await testPrisma.revision.findFirst({
        where: { articleId: article.id, rev: 1 },
      })

      expect(revision).toBeDefined()

      // Approve the revision
      const approvedRevision = await testPrisma.revision.update({
        where: { id: revision!.id },
        data: {
          approvedById: testApproverId,
          approvedAt: new Date(),
        },
      })

      expect(approvedRevision.approvedById).toBe(testApproverId)
      expect(approvedRevision.approvedAt).toBeDefined()

      // Update article status to published
      const updatedArticle = await testPrisma.article.update({
        where: { id: article.id },
        data: { status: 'published' },
      })

      expect(updatedArticle.status).toBe('published')
    })

    it('should rollback to a previous revision', async () => {
      // Create article with multiple revisions
      const article = await testPrisma.article.create({
        data: {
          slug: 'test-article-rollback',
          title: 'Test Article',
          type: 'care',
          status: 'published',
          createdById: testUserId,
          revisions: {
            createMany: {
              data: [
                {
                  rev: 1,
                  authorId: testUserId,
                  summary: 'Initial creation',
                  contentJSON: { blocks: [{ type: 'paragraph', text: 'Version 1' }] },
                  approvedById: testApproverId,
                  approvedAt: new Date(),
                },
                {
                  rev: 2,
                  authorId: testUserId,
                  summary: 'Second revision',
                  contentJSON: { blocks: [{ type: 'paragraph', text: 'Version 2' }] },
                  approvedById: testApproverId,
                  approvedAt: new Date(),
                },
                {
                  rev: 3,
                  authorId: testUserId,
                  summary: 'Third revision',
                  contentJSON: { blocks: [{ type: 'paragraph', text: 'Version 3' }] },
                },
              ],
            },
          },
        },
      })

      // Get all revisions
      const revisions = await testPrisma.revision.findMany({
        where: { articleId: article.id },
        orderBy: { rev: 'asc' },
      })

      expect(revisions).toHaveLength(3)

      // Rollback: Create a new revision based on revision 2
      const revision1 = revisions.find((r) => r.rev === 1)!
      const rollbackRevision = await testPrisma.revision.create({
        data: {
          articleId: article.id,
          rev: 4,
          authorId: testUserId,
          summary: 'Rollback to version 1',
          contentJSON: revision1.contentJSON,
          infoboxJSON: revision1.infoboxJSON,
        },
      })

      expect(rollbackRevision).toBeDefined()
      expect(rollbackRevision.rev).toBe(4)
      expect(rollbackRevision.contentJSON).toEqual(revision1.contentJSON)

      // Verify rollback revision exists
      const allRevisions = await testPrisma.revision.findMany({
        where: { articleId: article.id },
        orderBy: { rev: 'asc' },
      })

      expect(allRevisions).toHaveLength(4)
    })

    it('should handle complete workflow: create → revise → approve → rollback', async () => {
      // Step 1: Create article
      const article = await testPrisma.article.create({
        data: {
          slug: 'test-complete-workflow',
          title: 'Complete Workflow Test',
          type: 'health',
          status: 'draft',
          createdById: testUserId,
          revisions: {
            create: {
              rev: 1,
              authorId: testUserId,
              summary: 'Initial creation',
              contentJSON: { blocks: [{ type: 'paragraph', text: 'First version' }] },
            },
          },
          tags: {
            create: [{ tag: 'health' }],
          },
        },
      })

      expect(article.status).toBe('draft')

      // Step 2: Create revision
      const revision2 = await testPrisma.revision.create({
        data: {
          articleId: article.id,
          rev: 2,
          authorId: testUserId,
          summary: 'Improved content',
          contentJSON: { blocks: [{ type: 'paragraph', text: 'Second version' }] },
        },
      })

      expect(revision2.rev).toBe(2)
      expect(revision2.approvedById).toBeNull()

      // Step 3: Approve revision
      const approvedRevision = await testPrisma.revision.update({
        where: { id: revision2.id },
        data: {
          approvedById: testApproverId,
          approvedAt: new Date(),
        },
      })

      expect(approvedRevision.approvedById).toBe(testApproverId)

      // Update article status
      await testPrisma.article.update({
        where: { id: article.id },
        data: { status: 'published' },
      })

      // Step 4: Rollback to revision 1
      const revision1 = await testPrisma.revision.findFirst({
        where: { articleId: article.id, rev: 1 },
      })

      const rollbackRevision = await testPrisma.revision.create({
        data: {
          articleId: article.id,
          rev: 3,
          authorId: testUserId,
          summary: 'Rollback to original',
          contentJSON: revision1!.contentJSON,
          infoboxJSON: revision1!.infoboxJSON,
        },
      })

      expect(rollbackRevision.rev).toBe(3)

      // Verify final state
      const finalRevisions = await testPrisma.revision.findMany({
        where: { articleId: article.id },
        orderBy: { rev: 'asc' },
      })

      expect(finalRevisions).toHaveLength(3)
      expect(finalRevisions[0].rev).toBe(1)
      expect(finalRevisions[1].rev).toBe(2)
      expect(finalRevisions[1].approvedById).toBe(testApproverId)
      expect(finalRevisions[2].rev).toBe(3)
    })
  })

  describe('Unique constraints and indexes', () => {
    it('should enforce unique slug+type constraint on Article', async () => {
      await testPrisma.article.create({
        data: {
          slug: 'unique-test',
          title: 'Test',
          type: 'care',
          status: 'draft',
          createdById: testUserId,
        },
      })

      // Should fail when creating duplicate slug+type
      await expect(
        testPrisma.article.create({
          data: {
            slug: 'unique-test',
            title: 'Test 2',
            type: 'care',
            status: 'draft',
            createdById: testUserId,
          },
        })
      ).rejects.toThrow()
    })

    it('should allow same slug with different type', async () => {
      await testPrisma.article.create({
        data: {
          slug: 'multi-type',
          title: 'Test',
          type: 'care',
          status: 'draft',
          createdById: testUserId,
        },
      })

      // Should succeed with different type
      const article2 = await testPrisma.article.create({
        data: {
          slug: 'multi-type',
          title: 'Test 2',
          type: 'health',
          status: 'draft',
          createdById: testUserId,
        },
      })

      expect(article2).toBeDefined()
      expect(article2.type).toBe('health')
    })

    it('should enforce unique articleId+rev constraint on Revision', async () => {
      const article = await testPrisma.article.create({
        data: {
          slug: 'rev-constraint-test',
          title: 'Test',
          type: 'care',
          status: 'draft',
          createdById: testUserId,
        },
      })

      await testPrisma.revision.create({
        data: {
          articleId: article.id,
          rev: 1,
          authorId: testUserId,
          contentJSON: { test: 'data' },
        },
      })

      // Should fail when creating duplicate rev for same article
      await expect(
        testPrisma.revision.create({
          data: {
            articleId: article.id,
            rev: 1,
            authorId: testUserId,
            contentJSON: { test: 'data2' },
          },
        })
      ).rejects.toThrow()
    })
  })

  describe('Cascade deletes', () => {
    it('should cascade delete revisions when article is deleted', async () => {
      const article = await testPrisma.article.create({
        data: {
          slug: 'cascade-test',
          title: 'Test',
          type: 'care',
          status: 'draft',
          createdById: testUserId,
          revisions: {
            createMany: {
              data: [
                {
                  rev: 1,
                  authorId: testUserId,
                  contentJSON: { test: 'data1' },
                },
                {
                  rev: 2,
                  authorId: testUserId,
                  contentJSON: { test: 'data2' },
                },
              ],
            },
          },
        },
      })

      // Delete article
      await testPrisma.article.delete({
        where: { id: article.id },
      })

      // Verify revisions are deleted
      const revisions = await testPrisma.revision.findMany({
        where: { articleId: article.id },
      })

      expect(revisions).toHaveLength(0)
    })

    it('should cascade delete tags and props when article is deleted', async () => {
      const article = await testPrisma.article.create({
        data: {
          slug: 'cascade-tags-props',
          title: 'Test',
          type: 'care',
          status: 'draft',
          createdById: testUserId,
          tags: {
            create: [{ tag: 'tag1' }, { tag: 'tag2' }],
          },
          props: {
            create: [{ key: 'prop1', value: { test: true } }],
          },
        },
      })

      // Delete article
      await testPrisma.article.delete({
        where: { id: article.id },
      })

      // Verify tags and props are deleted
      const tags = await testPrisma.articleTag.findMany({
        where: { articleId: article.id },
      })
      const props = await testPrisma.articleProp.findMany({
        where: { articleId: article.id },
      })

      expect(tags).toHaveLength(0)
      expect(props).toHaveLength(0)
    })
  })
})

