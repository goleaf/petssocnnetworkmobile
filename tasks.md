# Product Pages with Recall Banner and Safety Notices

## Tasks

### Database Schema Updates
- [ ] Add recall and safety fields to Product model (isRecalled, recallNotice, safetyNotices)
- [ ] Create and run migration

### Product TypeScript Types
- [ ] Update lib/types.ts with Product interface including recall/safety fields
- [ ] Create validation schema for products

### UI Components
- [ ] Create RecallBanner component (similar to UrgencyBanner)
- [ ] Create SafetyNotices component
- [ ] Create ProductCard component for listings
- [ ] Create ProductDetail component for individual product page

### Product Pages
- [ ] Create app/products/page.tsx - products listing page
- [ ] Create app/products/[id]/page.tsx - individual product detail page
- [ ] Create app/products/loading.tsx - loading states

### Admin Interface
- [ ] Create app/admin/products/page.tsx - products management
- [ ] Create app/admin/products/[id]/edit/page.tsx - edit product form
- [ ] Add recall/safety form fields to edit page

### API Routes
- [ ] Create app/api/products/route.ts - GET all products, POST create product
- [ ] Create app/api/products/[id]/route.ts - GET, PATCH, DELETE product

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

