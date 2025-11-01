# Code Review Checklist

This checklist is designed to ensure code quality across multiple dimensions: correctness, security, accessibility (a11y), internationalization (i18n), and performance.

## 📋 General Review Process

1. Review code structure and organization
2. Check correctness and logic
3. Verify security measures
4. Validate accessibility
5. Confirm internationalization support
6. Assess performance impact
7. Verify tests and documentation

---

## ✅ Correctness

### Logic & Functionality
- [ ] **Edge Cases**: Code handles edge cases (empty arrays, null/undefined, empty strings)
- [ ] **Error Handling**: Errors are caught and handled gracefully
- [ ] **Input Validation**: All user inputs are validated before processing
- [ ] **State Management**: Zustand state is used correctly, no unnecessary global state
- [ ] **Data Persistence**: localStorage operations are wrapped in try-catch, handle quota exceeded
- [ ] **Type Safety**: All TypeScript types are correct, no `any` types used
- [ ] **Async Operations**: Async/await is used correctly, errors are handled
- [ ] **Form Handling**: Form validation works, errors display correctly, submission prevents duplicates

### Code Quality
- [ ] **Component Structure**: Components follow single responsibility principle
- [ ] **Code Reuse**: No duplicated logic, shared utilities are used
- [ ] **Naming Conventions**: Variables, functions, and components follow project conventions
  - Components: `PascalCase.tsx`
  - Functions/variables: `camelCase`
  - Constants: `UPPER_SNAKE_CASE`
- [ ] **Comments**: Complex logic is documented
- [ ] **DRY Principle**: No code duplication
- [ ] **Separation of Concerns**: Business logic separated from UI components

### Next.js Specific
- [ ] **Server vs Client**: Correct use of Server Components vs Client Components (`"use client"`)
- [ ] **Routing**: Route structure follows App Router conventions
- [ ] **Loading States**: `loading.tsx` files exist where appropriate
- [ ] **Error Boundaries**: Error handling with `error.tsx` and `global-error.tsx`
- [ ] **Image Optimization**: Next.js `Image` component used instead of `<img>`
- [ ] **Link Component**: Next.js `Link` used for internal navigation

### Styling
- [ ] **TailwindCSS Only**: No inline styles, no CSS in JSX, no Bootstrap
- [ ] **Responsive Design**: Mobile-first approach with Tailwind breakpoints
- [ ] **Build Process**: `pnpm build` was run after CSS/JS changes
- [ ] **No CDN**: All CSS/JS comes from npm packages, no CDN links

---

## 🔒 Security

### Input Validation & Sanitization
- [ ] **User Input**: All user inputs are validated and sanitized
- [ ] **XSS Prevention**: Content is properly escaped, especially in markdown/content rendering
- [ ] **SQL Injection**: Prisma queries use parameterized queries (Prisma handles this)
- [ ] **No Eval**: No use of `eval()` or similar dangerous functions
- [ ] **Type Validation**: Zod schemas used for runtime validation where appropriate

### Data Exposure
- [ ] **Sensitive Data**: No sensitive data in client-side code
- [ ] **API Keys**: No API keys or secrets in client code
- [ ] **User Data**: Proper access control for user data (if applicable)
- [ ] **localStorage**: Sensitive data not stored in localStorage without encryption (if needed)

### Authentication & Authorization
- [ ] **Auth Checks**: Authentication state is verified where needed
- [ ] **Permission Checks**: User permissions are checked before actions
- [ ] **Route Protection**: Protected routes require authentication (if applicable)

### Dependencies
- [ ] **Dependency Audit**: Dependencies are up to date (`pnpm audit`)
- [ ] **Known Vulnerabilities**: No known security vulnerabilities in dependencies
- [ ] **Trusted Sources**: Only trusted npm packages are used

---

## ♿ Accessibility (a11y)

### Semantic HTML
- [ ] **Proper Elements**: Semantic HTML elements used (`<nav>`, `<main>`, `<article>`, `<section>`, etc.)
- [ ] **Heading Hierarchy**: Headings follow logical order (h1 → h2 → h3), no skipped levels
- [ ] **Landmarks**: Page structure uses ARIA landmarks (`role="navigation"`, `role="main"`, etc.)

### Keyboard Navigation
- [ ] **Keyboard Accessible**: All interactive elements are keyboard accessible
- [ ] **Tab Order**: Tab order is logical and follows visual flow
- [ ] **Focus Indicators**: Focus states are visible with clear visual indicators
- [ ] **Skip Links**: Skip links provided for main content (if applicable)
- [ ] **Focus Trap**: Modals/dialogs trap focus appropriately

### ARIA & Labels
- [ ] **ARIA Labels**: Interactive elements have appropriate ARIA labels when needed
- [ ] **ARIA Roles**: Custom components use appropriate ARIA roles
- [ ] **ARIA States**: Dynamic content updates use ARIA live regions
- [ ] **Form Labels**: All form inputs have associated `<label>` elements
- [ ] **Button Text**: Buttons have descriptive text (not just icons)

### Visual Accessibility
- [ ] **Color Contrast**: Text meets WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text)
- [ ] **Color Independence**: Information isn't conveyed by color alone
- [ ] **Alt Text**: All images have descriptive `alt` text
- [ ] **Focus Visible**: Focus indicators are clearly visible
- [ ] **Text Scaling**: Content remains usable at 200% zoom

### Screen Reader Support
- [ ] **Error Messages**: Form errors are announced to screen readers
- [ ] **Loading States**: Loading states are communicated to assistive technologies
- [ ] **Dynamic Content**: Dynamic content changes are announced
- [ ] **Descriptive Text**: Interactive elements have descriptive accessible names

---

## 🌐 Internationalization (i18n)

### Translation System
- [ ] **Translation Keys**: All user-facing strings use translation keys (not hardcoded text)
- [ ] **Translation Files**: Translations are stored in JSON files in proper directory structure
- [ ] **Missing Translations**: Fallback to base language when translations are missing
- [ ] **Translation Context**: Translation keys provide context (e.g., `button.save`, `form.error.required`)

### Locale-Aware Formatting
- [ ] **Date Formatting**: Dates use locale-aware formatting (`toLocaleDateString()`, `toLocaleString()`)
- [ ] **Number Formatting**: Numbers use locale-aware formatting (`toLocaleString()`)
- [ ] **Currency** (if applicable): Currency formatting is locale-aware

### RTL Support
- [ ] **RTL Detection**: RTL languages are detected using utility functions (`isRTL()`)
- [ ] **Layout Direction**: Layout adapts for RTL languages (`dir="rtl"` when needed)
- [ ] **Text Alignment**: Text alignment respects RTL direction
- [ ] **Icons/Images**: Icons and images flip appropriately for RTL (if needed)

### Content & Text
- [ ] **Text Length**: UI accommodates longer translations (no text truncation issues)
- [ ] **Pluralization**: Plural forms are handled correctly (if applicable)
- [ ] **Character Encoding**: UTF-8 encoding is used throughout
- [ ] **Language Attribute**: `<html lang="...">` is set correctly

---

## ⚡ Performance

### React Performance
- [ ] **Unnecessary Renders**: Components don't re-render unnecessarily
- [ ] **React.memo**: Expensive components use `React.memo()` where appropriate
- [ ] **useMemo**: Expensive computations use `useMemo()` to avoid recalculation
- [ ] **useCallback**: Callbacks passed to child components use `useCallback()` to prevent re-renders
- [ ] **State Updates**: State updates are batched when possible

### Next.js Performance
- [ ] **Image Optimization**: Next.js `Image` component used with proper `width`, `height`, `alt`
- [ ] **Code Splitting**: Dynamic imports used for large components (`next/dynamic`)
- [ ] **Loading Strategies**: Images use appropriate `loading` strategy (`lazy` for below fold)
- [ ] **Font Optimization**: Fonts use Next.js font optimization (`next/font`)

### Bundle Size
- [ ] **Tree Shaking**: Only necessary code is imported from libraries
- [ ] **Bundle Analysis**: Bundle size impact is reasonable (check with `next build`)
- [ ] **Large Dependencies**: Large dependencies are lazy-loaded when possible

### Data Fetching & Caching
- [ ] **Efficient Queries**: Database queries are optimized (if applicable)
- [ ] **Caching**: Client-side caching is used appropriately (React Query, SWR, or manual)
- [ ] **LocalStorage**: localStorage operations don't block the main thread
- [ ] **Debouncing**: Search/input handlers use debouncing where appropriate

### Memory Management
- [ ] **Memory Leaks**: `useEffect` cleanup functions are implemented
- [ ] **Event Listeners**: Event listeners are cleaned up in `useEffect` cleanup
- [ ] **Timers**: `setTimeout`/`setInterval` are cleaned up
- [ ] **Subscriptions**: Subscriptions are unsubscribed in cleanup

### Large Lists & Virtualization
- [ ] **Pagination**: Large lists are paginated or infinite-scrolled
- [ ] **Virtualization**: Very large lists use virtualization (if needed)
- [ ] **Lazy Loading**: Images in lists use lazy loading

---

## 🧪 Testing

### Test Coverage
- [ ] **Unit Tests**: Unit tests exist for utility functions and helpers
- [ ] **Component Tests**: Components have tests in `__tests__/` directories
- [ ] **Test Quality**: Tests cover happy paths, edge cases, and error scenarios
- [ ] **Test Organization**: Tests are co-located with components or in `__tests__/` folders

### Test Execution
- [ ] **Tests Pass**: All tests pass (`pnpm test`)
- [ ] **Test Coverage**: Test coverage is maintained or improved
- [ ] **Test Performance**: Tests run in reasonable time

### Manual Testing
- [ ] **Browser Testing**: Tested in major browsers (Chrome, Firefox, Safari, Edge)
- [ ] **Mobile Testing**: Tested on mobile devices or responsive view
- [ ] **User Flows**: Critical user flows are tested manually

---

## 📚 Documentation

### Code Documentation
- [ ] **JSDoc Comments**: Complex functions have JSDoc comments
- [ ] **Type Definitions**: Types are exported from `lib/types.ts` when shared
- [ ] **README Updates**: README updated if needed (new dependencies, setup changes)

### Commit Messages
- [ ] **Clear Messages**: Commit messages are clear and descriptive
- [ ] **Conventional Commits**: Follows conventional commit format (if project uses it)

---

## 🔧 Project-Specific Checks

### Next.js 16 App Router
- [ ] Uses App Router conventions (not Pages Router)
- [ ] Server Components used by default
- [ ] Client Components marked with `"use client"`
- [ ] Proper use of `loading.tsx`, `error.tsx`, `not-found.tsx`

### TypeScript
- [ ] Strict mode compliance
- [ ] No `any` types
- [ ] Proper interface/type definitions
- [ ] Types exported from `lib/types.ts` for shared types

### TailwindCSS
- [ ] All styling uses TailwindCSS classes
- [ ] No inline styles or CSS-in-JS
- [ ] Responsive design with Tailwind breakpoints
- [ ] Custom styles in `styles/` directory if needed
- [ ] `pnpm build` run after CSS changes

### State Management
- [ ] Zustand stores follow project patterns
- [ ] Local state used for component-specific state
- [ ] No unnecessary global state

### File Organization
- [ ] Files in correct directories (`components/`, `lib/`, `app/`)
- [ ] Reusable components in `components/`
- [ ] Page-specific components co-located with pages
- [ ] Utilities in `lib/utils/`

---

## ❌ Common Issues to Watch For

### Anti-patterns
- [ ] No Bootstrap CSS classes
- [ ] No CDN links in JSX
- [ ] No CSS/JS code in TSX files
- [ ] No class components (use functional components)
- [ ] No user authentication code (per project rules)
- [ ] No Docker configurations
- [ ] No Livewire usage

### Code Smells
- [ ] Magic numbers (use named constants)
- [ ] Deeply nested conditionals (extract to functions)
- [ ] Long functions (break into smaller functions)
- [ ] Props drilling (use context or Zustand)
- [ ] Tight coupling (improve modularity)

---

## 📝 Review Notes Template

When reviewing, use this format:

```
## Overall Assessment
[Brief summary]

## Critical Issues
- [ ] Issue 1: [Description]
- [ ] Issue 2: [Description]

## Suggestions
- [ ] Suggestion 1: [Description]
- [ ] Suggestion 2: [Description]

## Questions
- Question 1: [Description]
- Question 2: [Description]

## Approval
- [ ] Approved
- [ ] Approved with changes requested
- [ ] Changes requested
```

---

## 🚀 Quick Reference

### Before Merging
1. All checkboxes above reviewed and verified
2. Tests pass (`pnpm test`)
3. Build succeeds (`pnpm build`)
4. No linter errors (`pnpm lint`)
5. TypeScript compiles (`pnpm typecheck`)
6. Manual testing completed
7. PR template filled out completely
8. Code reviewed by at least one other developer

### Red Flags (Block Merging)
- Security vulnerabilities
- Breaking changes without migration plan
- Missing error handling for critical paths
- Accessibility violations that block users
- Performance regressions
- Tests failing
- Build errors
- TypeScript errors

---

**Last Updated**: 2024
**Project**: Pet Social Network Mobile App
**Tech Stack**: Next.js 16, React 19, TypeScript, TailwindCSS, Zustand

