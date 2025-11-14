# Design Document

## Overview

This design document outlines the technical approach for implementing a comprehensive design system for the Pet Social Network application. The design system will address critical issues identified in the codebase analysis including inline styles, accessibility gaps, responsive design inconsistencies, and lack of standardization.

### Goals

- Establish a centralized design token system for visual consistency
- Implement responsive design patterns that work across all devices
- Achieve WCAG AA accessibility compliance
- Standardize component library with comprehensive documentation
- Eliminate inline styles in favor of Tailwind CSS utility classes
- Create comprehensive design guidelines for developers

### Non-Goals

- Complete UI redesign (we're improving the existing design system)
- Migration to a different CSS framework
- Implementing a separate design tool integration (Figma, Sketch)
- Creating a standalone design system package

## Architecture

### Design Token Architecture

```
app/globals.css (CSS Custom Properties)
    ↓
tailwind.config.js (Tailwind Configuration)
    ↓
components/ui/* (Base Components)
    ↓
components/* (Feature Components)
    ↓
app/* (Pages)
```

### Token Categories

1. **Color Tokens**: Primary, secondary, accent, semantic colors
2. **Spacing Tokens**: 4px base unit scale (xs to 3xl)
3. **Typography Tokens**: Font families, sizes, weights, line heights
4. **Border Tokens**: Radius values, border widths
5. **Shadow Tokens**: Elevation levels (sm, md, lg, xl)
6. **Animation Tokens**: Durations, easing functions


## Components

### 1. Design Token System

**Implementation Approach:**

- Extend existing CSS custom properties in `app/globals.css`
- Add missing tokens for spacing, typography, shadows
- Create Tailwind configuration that references CSS custom properties
- Document all tokens in a central reference file

**Token Structure:**

```css
:root {
  /* Spacing Scale (4px base) */
  --spacing-xs: 0.25rem;    /* 4px */
  --spacing-sm: 0.5rem;     /* 8px */
  --spacing-md: 1rem;       /* 16px */
  --spacing-lg: 1.5rem;     /* 24px */
  --spacing-xl: 2rem;       /* 32px */
  --spacing-2xl: 3rem;      /* 48px */
  --spacing-3xl: 4rem;      /* 64px */
  
  /* Typography Scale */
  --font-size-xs: 0.75rem;  /* 12px */
  --font-size-sm: 0.875rem; /* 14px */
  --font-size-base: 1rem;   /* 16px */
  --font-size-lg: 1.125rem; /* 18px */
  --font-size-xl: 1.25rem;  /* 20px */
  --font-size-2xl: 1.5rem;  /* 24px */
  --font-size-3xl: 1.875rem;/* 30px */
  --font-size-4xl: 2.25rem; /* 36px */
  
  /* Shadow Scale */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
}
```


### 2. Responsive Design System

**Breakpoint Strategy:**

```typescript
// Tailwind breakpoints (mobile-first)
const breakpoints = {
  sm: '640px',   // Small tablets
  md: '768px',   // Tablets
  lg: '1024px',  // Desktops
  xl: '1280px',  // Large desktops
  '2xl': '1536px' // Extra large desktops
}
```

**Responsive Patterns:**

1. **Container Widths**: Max-width constraints at each breakpoint
2. **Grid Systems**: Responsive column counts (1 → 2 → 3 → 4)
3. **Typography**: Fluid type scale using clamp()
4. **Spacing**: Responsive padding/margin using breakpoint modifiers
5. **Navigation**: Mobile bottom nav → Desktop top nav

**Touch Target Guidelines:**

- Minimum 44x44px for all interactive elements on mobile
- Increased padding on buttons and links for touch devices
- Larger form inputs on mobile (min-height: 44px)


### 3. Accessibility Implementation

**ARIA Patterns:**

```typescript
// Button with loading state
<button 
  aria-label="Submit form"
  aria-busy={isLoading}
  aria-disabled={isDisabled}
>
  Submit
</button>

// Form input with error
<input
  aria-label="Email address"
  aria-invalid={hasError}
  aria-describedby="email-error"
/>
<span id="email-error" role="alert">
  {errorMessage}
</span>

// Live region for notifications
<div role="status" aria-live="polite" aria-atomic="true">
  {notification}
</div>
```

**Focus Management:**

```css
/* Enhanced focus indicators */
:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}

/* Screen reader mode enhancement */
body[data-sr-mode='true'] :focus-visible {
  outline-width: 3px;
}
```

**Semantic HTML Structure:**

```html
<header role="banner">
  <nav role="navigation" aria-label="Primary">
    <!-- Navigation items -->
  </nav>
</header>

<main role="main" id="main-content">
  <article>
    <h1>Page Title</h1>
    <section>
      <h2>Section Title</h2>
    </section>
  </article>
</main>

<footer role="contentinfo">
  <!-- Footer content -->
</footer>
```


### 4. Component Library Standardization

**Component Hierarchy:**

```
components/ui/          (Primitive components)
├── button.tsx         (Base button with variants)
├── input.tsx          (Base input with states)
├── card.tsx           (Base card structure)
├── badge.tsx          (Status indicators)
└── ...

components/            (Composite components)
├── navigation.tsx     (Uses ui/button, ui/avatar)
├── post-card.tsx      (Uses ui/card, ui/button)
└── ...
```

**Component API Design:**

```typescript
// Consistent prop patterns
interface ComponentProps {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  className?: string
  children: React.ReactNode
}

// Example: Button component
<Button 
  variant="default" 
  size="md" 
  loading={isSubmitting}
  disabled={!isValid}
>
  Submit
</Button>
```

**Component States:**

1. **Default**: Normal resting state
2. **Hover**: Mouse over state
3. **Focus**: Keyboard focus state
4. **Active**: Pressed/clicked state
5. **Disabled**: Non-interactive state
6. **Loading**: Processing state
7. **Error**: Invalid/error state
8. **Success**: Valid/success state


### 5. Inline Style Elimination Strategy

**Current Issues:**

- `components/comments/advanced-comments.tsx`: Dynamic marginLeft
- `components/places/PlaceMap.tsx`: Fixed minHeight
- `components/ui/progress.tsx`: Transform values
- `app/wiki/[slug]/translate/page.tsx`: Multiple inline styles

**Migration Approach:**

1. **Dynamic Values**: Use CSS custom properties
```typescript
// Before
<div style={{ marginLeft: `${depth * 20}px` }}>

// After
<div 
  className="ml-[var(--comment-indent)]"
  style={{ '--comment-indent': `${depth * 20}px` } as React.CSSProperties}
>
```

2. **Fixed Values**: Convert to Tailwind classes
```typescript
// Before
<div style={{ minHeight: "300px" }}>

// After
<div className="min-h-[300px]">
```

3. **Transform Values**: Use Tailwind transform utilities
```typescript
// Before
<div style={{ transform: `translateX(${value}%)` }}>

// After
<div className={cn("transition-transform", value > 0 && "translate-x-full")}>
```


### 6. Form Design System

**Form Layout Pattern:**

```typescript
<form className="space-y-6">
  <div className="space-y-2">
    <Label htmlFor="email" required>
      Email Address
    </Label>
    <Input
      id="email"
      type="email"
      placeholder="you@example.com"
      aria-invalid={!!errors.email}
      aria-describedby={errors.email ? "email-error" : undefined}
    />
    {errors.email && (
      <p id="email-error" className="text-sm text-destructive" role="alert">
        {errors.email.message}
      </p>
    )}
  </div>
  
  <div className="flex gap-3 justify-end">
    <Button type="button" variant="outline">
      Cancel
    </Button>
    <Button type="submit" loading={isSubmitting}>
      Submit
    </Button>
  </div>
</form>
```

**Validation States:**

```typescript
// Input states
const inputVariants = {
  default: "border-input",
  error: "border-destructive ring-destructive/20",
  success: "border-green-500 ring-green-500/20",
}

// Error message pattern
<AnimatePresence>
  {error && (
    <motion.p
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="text-sm text-destructive"
      role="alert"
    >
      {error}
    </motion.p>
  )}
</AnimatePresence>
```


### 7. Typography System

**Type Scale:**

```typescript
// Heading hierarchy
const headings = {
  h1: "text-4xl font-bold tracking-tight lg:text-5xl",
  h2: "text-3xl font-semibold tracking-tight lg:text-4xl",
  h3: "text-2xl font-semibold tracking-tight lg:text-3xl",
  h4: "text-xl font-semibold tracking-tight lg:text-2xl",
  h5: "text-lg font-semibold tracking-tight",
  h6: "text-base font-semibold tracking-tight",
}

// Body text
const body = {
  large: "text-lg leading-relaxed",
  base: "text-base leading-normal",
  small: "text-sm leading-normal",
  xs: "text-xs leading-tight",
}

// Utility classes
const text = {
  muted: "text-muted-foreground",
  subtle: "text-muted-foreground/70",
  link: "text-primary underline-offset-4 hover:underline",
  code: "font-mono text-sm bg-muted px-1.5 py-0.5 rounded",
}
```

**Responsive Typography:**

```css
/* Fluid type scale using clamp() */
.text-fluid-lg {
  font-size: clamp(1.125rem, 1rem + 0.5vw, 1.5rem);
}

.text-fluid-xl {
  font-size: clamp(1.25rem, 1rem + 1vw, 2rem);
}
```


### 8. Animation System

**Animation Tokens:**

```typescript
// Duration tokens
const duration = {
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
}

// Easing functions
const easing = {
  default: 'cubic-bezier(0.4, 0, 0.2, 1)',
  in: 'cubic-bezier(0.4, 0, 1, 1)',
  out: 'cubic-bezier(0, 0, 0.2, 1)',
  inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
}
```

**Animation Patterns:**

```typescript
// Hover transitions
<button className="transition-all duration-300 hover:scale-105 hover:shadow-lg">

// Loading spinner
<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary">

// Fade in
<div className="animate-in fade-in duration-500">

// Slide in from bottom
<div className="animate-in slide-in-from-bottom-4 duration-300">

// Respect motion preferences
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```


## Data Models

### Design Token Configuration

```typescript
// lib/design-tokens.ts
export interface DesignTokens {
  colors: ColorTokens
  spacing: SpacingTokens
  typography: TypographyTokens
  shadows: ShadowTokens
  borders: BorderTokens
  animations: AnimationTokens
}

interface ColorTokens {
  primary: string
  secondary: string
  accent: string
  destructive: string
  muted: string
  background: string
  foreground: string
}

interface SpacingTokens {
  xs: string
  sm: string
  md: string
  lg: string
  xl: string
  '2xl': string
  '3xl': string
}

interface TypographyTokens {
  fontFamily: {
    sans: string
    mono: string
  }
  fontSize: Record<string, string>
  fontWeight: Record<string, number>
  lineHeight: Record<string, string>
}
```

### Component Prop Types

```typescript
// lib/types/components.ts
export type ComponentSize = 'sm' | 'md' | 'lg'
export type ComponentVariant = 'default' | 'outline' | 'ghost' | 'destructive'
export type ComponentState = 'default' | 'hover' | 'focus' | 'active' | 'disabled'

export interface BaseComponentProps {
  className?: string
  size?: ComponentSize
  variant?: ComponentVariant
  disabled?: boolean
  loading?: boolean
}
```


## Error Handling

### Accessibility Errors

**Detection Strategy:**
- Automated testing with axe-core or similar tools
- Manual testing with screen readers
- Keyboard navigation testing
- Color contrast validation

**Error Reporting:**
```typescript
// lib/utils/a11y-validator.ts
export function validateAccessibility(element: HTMLElement): A11yError[] {
  const errors: A11yError[] = []
  
  // Check for missing alt text
  if (element.tagName === 'IMG' && !element.getAttribute('alt')) {
    errors.push({
      type: 'missing-alt-text',
      severity: 'error',
      element: element,
      message: 'Image missing alt text'
    })
  }
  
  // Check for missing labels
  if (element.tagName === 'INPUT' && !element.getAttribute('aria-label')) {
    const label = document.querySelector(`label[for="${element.id}"]`)
    if (!label) {
      errors.push({
        type: 'missing-label',
        severity: 'error',
        element: element,
        message: 'Input missing associated label'
      })
    }
  }
  
  return errors
}
```

### Design Token Validation

```typescript
// Validate token usage at build time
export function validateTokenUsage(css: string): ValidationError[] {
  const errors: ValidationError[] = []
  const hardcodedColors = css.match(/#[0-9a-f]{3,6}/gi)
  
  if (hardcodedColors) {
    errors.push({
      type: 'hardcoded-color',
      severity: 'warning',
      message: `Found ${hardcodedColors.length} hardcoded colors. Use design tokens instead.`
    })
  }
  
  return errors
}
```


## Testing Strategy

### Visual Regression Testing

```typescript
// e2e/design-system.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Design System', () => {
  test('button variants render correctly', async ({ page }) => {
    await page.goto('/design-system/buttons')
    
    // Test each variant
    const variants = ['default', 'outline', 'ghost', 'destructive']
    for (const variant of variants) {
      await expect(page.locator(`[data-variant="${variant}"]`)).toHaveScreenshot()
    }
  })
  
  test('dark mode renders correctly', async ({ page }) => {
    await page.goto('/')
    await page.locator('[data-theme-toggle]').click()
    await expect(page).toHaveScreenshot('dark-mode.png')
  })
})
```

### Accessibility Testing

```typescript
// e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility', () => {
  test('homepage has no accessibility violations', async ({ page }) => {
    await page.goto('/')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })
  
  test('keyboard navigation works', async ({ page }) => {
    await page.goto('/')
    
    // Tab through interactive elements
    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toBeVisible()
  })
})
```

### Component Testing

```typescript
// components/ui/__tests__/button.test.tsx
import { render, screen } from '@testing-library/react'
import { Button } from '../button'

describe('Button', () => {
  it('renders with correct variant classes', () => {
    render(<Button variant="outline">Click me</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('border', 'bg-background')
  })
  
  it('shows loading state', () => {
    render(<Button loading>Submit</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('disabled')
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true')
  })
})
```


## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
- Set up design token system in CSS and Tailwind config
- Document all tokens
- Create token validation utilities
- Audit existing components for token usage

### Phase 2: Component Standardization (Weeks 3-4)
- Standardize base UI components (button, input, card)
- Add missing component variants
- Implement consistent prop APIs
- Add loading and error states

### Phase 3: Accessibility (Weeks 5-6)
- Add ARIA labels to all interactive elements
- Implement semantic HTML structure
- Enhance focus indicators
- Add keyboard navigation support
- Test with screen readers

### Phase 4: Responsive Design (Weeks 7-8)
- Implement responsive breakpoints
- Add mobile-first patterns
- Optimize touch targets
- Test on multiple devices

### Phase 5: Inline Style Elimination (Week 9)
- Identify all inline styles
- Convert to Tailwind classes or CSS custom properties
- Validate no inline styles remain

### Phase 6: Documentation (Week 10)
- Create design system documentation site
- Document all components with examples
- Create usage guidelines
- Add code snippets and best practices

### Phase 7: Testing & Validation (Weeks 11-12)
- Visual regression testing
- Accessibility testing
- Cross-browser testing
- Performance testing
- Final validation and fixes


## Migration Strategy

### Gradual Migration Approach

1. **New Components First**: All new components use the design system
2. **High-Traffic Pages**: Migrate most-used pages first
3. **Component-by-Component**: Migrate one component type at a time
4. **Feature Flags**: Use feature flags to test changes gradually

### Breaking Changes

**Potential Breaking Changes:**
- Component prop API changes (size values, variant names)
- CSS class name changes
- Removed deprecated components

**Migration Path:**
```typescript
// Old API (deprecated)
<Button size="xs">Click</Button>

// New API
<Button size="sm">Click</Button>

// Provide deprecation warnings
if (size === 'xs') {
  console.warn('Button size "xs" is deprecated. Use "sm" instead.')
}
```

### Rollback Plan

1. Keep old components alongside new ones temporarily
2. Use feature flags to toggle between old and new
3. Monitor error rates and user feedback
4. Rollback if critical issues arise

```typescript
// Feature flag example
const useNewDesignSystem = useFeatureFlag('new-design-system')

return useNewDesignSystem ? <NewButton /> : <OldButton />
```


## Performance Considerations

### CSS Optimization

```typescript
// Purge unused CSS in production
// tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  // This ensures only used classes are included
}
```

### Component Lazy Loading

```typescript
// Lazy load heavy components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false
})
```

### Animation Performance

```css
/* Use transform and opacity for animations (GPU accelerated) */
.animate-slide {
  transform: translateX(0);
  transition: transform 300ms ease-out;
}

/* Avoid animating layout properties */
.bad-animation {
  /* Don't do this */
  transition: width 300ms;
}
```

### Bundle Size Impact

- Design token system: ~2KB
- Component library updates: ~5KB
- Accessibility enhancements: ~3KB
- Total estimated impact: ~10KB (gzipped)


## Security Considerations

### CSS Injection Prevention

```typescript
// Sanitize dynamic CSS values
function sanitizeCSSValue(value: string): string {
  // Remove potentially dangerous characters
  return value.replace(/[<>'"]/g, '')
}

// Safe dynamic styles
<div style={{ 
  '--dynamic-value': sanitizeCSSValue(userInput) 
} as React.CSSProperties}>
```

### XSS Prevention in Components

```typescript
// Always escape user content
import DOMPurify from 'dompurify'

function SafeContent({ html }: { html: string }) {
  return (
    <div dangerouslySetInnerHTML={{ 
      __html: DOMPurify.sanitize(html) 
    }} />
  )
}
```

### Content Security Policy

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "style-src 'self' 'unsafe-inline';"
  }
]
```

## Open Questions

1. Should we create a separate Storybook instance for component documentation?
2. Do we need to support IE11 or other legacy browsers?
3. Should we implement a theme builder for users to customize colors?
4. Do we need RTL (right-to-left) language support?
5. Should we create a Figma design system alongside the code?

## Success Metrics

- **Accessibility**: 0 critical accessibility violations (axe-core)
- **Performance**: No increase in bundle size > 15KB
- **Consistency**: 100% of components use design tokens
- **Coverage**: 90%+ component test coverage
- **Documentation**: 100% of components documented
- **Adoption**: 80%+ of pages migrated within 3 months

