# Merge PR codex/run-tests-and-fix-errors

## Tasks

- [x] Review commit `test: stabilize jest command`
- [x] Merge branch `codex/run-tests-and-fix-errors` into `main`
- [x] Run repository test suite post-merge
- [x] Delete remote branch and close PR

## Priority Order
1. Review commit contents
2. Merge and validate (tests + lint)
3. Perform PR cleanup

# Groups Page Hydration Mismatch

## Tasks

- [ ] Confirm `/groups` hydration error involving Radix `TabsTrigger`
- [ ] Ensure group category data is identical between SSR and client
- [ ] Implement deterministic category loading strategy
- [ ] Add regression coverage for tabs rendering (unit or integration)

## Priority Order
1. Reproduce hydration mismatch
2. Stabilize category data retrieval
3. Implement fix and verify manually
4. Add automated coverage

# Product Pages with Recall Banner and Safety Notices

## Tasks

### Database Schema Updates
- [x] Add recall and safety fields to Product model (isRecalled, recallNotice, safetyNotices)
- [ ] Create and run migration (requires DATABASE_URL - skipped for now)

### Product TypeScript Types
- [x] Update lib/types.ts with Product interface including recall/safety fields
- [x] Create validation schema for products (Zod schemas in API routes)

### UI Components
- [x] Create RecallBanner component (similar to UrgencyBanner)
- [x] Create SafetyNotices component
- [x] Create ProductCard component for listings
- [x] Product detail is integrated into product detail page

### Product Pages
- [x] Create app/products/page.tsx - products listing page
- [x] Create app/products/[id]/page.tsx - individual product detail page
- [x] Create app/products/loading.tsx - loading states

### Admin Interface
- [x] Create app/admin/products/page.tsx - products management
- [x] Create app/admin/products/[id]/edit/page.tsx - edit product form
- [x] Add recall/safety form fields to edit page

### API Routes
- [x] Create app/api/products/route.ts - GET all products, POST create product
- [x] Create app/api/products/[id]/route.ts - GET, PATCH, DELETE product

### Tests
- [ ] Write tests for ProductCard component
- [ ] Write tests for RecallBanner component
- [ ] Write tests for SafetyNotices component
- [ ] Write tests for product pages
- [ ] Write tests for API routes

## Priority Order
1. Database schema updates
2. TypeScript types and validation
3. UI components (RecallBanner, SafetyNotices)
4. Product pages
5. Admin interface
6. API routes
7. Tests

# Group Resources Create Route 404

## Tasks

- [x] Reproduce `/groups/golden-retriever-adventures/resources/create` 404
- [x] Identify missing route or misconfiguration in group resources flow
- [x] Implement fix for create resource page routing
- [x] Add regression test covering the route

## Priority Order
1. Reproduction & diagnostics
2. Routing fix implementation
3. Testing

# Global Loading Experience

## Tasks

- [ ] Create reusable global spinner overlay component
- [ ] Add root-level loading fallback using the spinner
- [ ] Wire the spinner overlay into the root layout so it appears during navigation
- [ ] Verify spinner accessibility and Tailwind styling compliance

## Priority Order
1. Spinner component
2. Root loading fallback
3. Layout integration
4. Verification

# Wiki Visual Enhancements

## Tasks

- [ ] Audit existing wiki articles for missing cover images
- [ ] Define category-based image pools for wiki defaults
- [ ] Normalize storage reads/writes to ensure cover images

## Priority Order
1. Define image pools
2. Normalize storage accessors
3. Verify UI rendering

