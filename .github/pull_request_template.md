# Pull Request

## Description
<!-- Provide a clear and concise description of what this PR does -->

## Type of Change
<!-- Mark the relevant option with an `x` -->
- [ ] 🐛 Bug fix (non-breaking change that fixes an issue)
- [ ] ✨ New feature (non-breaking change that adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update
- [ ] 🎨 Style/UI improvement (formatting, styling, no code change)
- [ ] ⚡ Performance improvement
- [ ] ♿ Accessibility improvement
- [ ] 🔒 Security fix
- [ ] 🌐 Internationalization (i18n) addition/update
- [ ] 🧹 Code refactoring (no functional changes)
- [ ] ✅ Test addition or update

## Related Issues
<!-- Link to related issues using #issue_number -->
Closes #<!-- issue number -->
Related to #<!-- issue number -->

## Changes Made
<!-- Describe the changes in detail -->
- 
- 
- 

## Testing
<!-- Describe the testing you've done -->
- [ ] Added/updated unit tests
- [ ] Added/updated integration tests
- [ ] Tested manually in browser
- [ ] Tested on mobile devices (if applicable)
- [ ] Verified accessibility with screen reader
- [ ] Tested with different languages (if applicable)
- [ ] Verified performance metrics
- [ ] All existing tests pass

### Test Results
<!-- If applicable, include test results -->
```
<!-- Paste test output or coverage report here -->
```

## Screenshots/Videos
<!-- If applicable, add screenshots or videos to help explain your changes -->

## Code Quality Checklist
<!-- Ensure these are checked before submitting -->
- [ ] Code follows project style guidelines (TypeScript strict mode, TailwindCSS only)
- [ ] No inline CSS or style tags in components
- [ ] All CSS/JS changes followed by `pnpm build`
- [ ] No CDN links used (all dependencies from npm)
- [ ] TypeScript types are properly defined (no `any` types)
- [ ] Components are properly componentized (maximized reusability)
- [ ] No console errors or warnings
- [ ] Proper error handling implemented
- [ ] Code is self-documenting with clear variable/function names

## Correctness Checklist
- [ ] Logic is correct and handles edge cases
- [ ] No hardcoded values that should be configurable
- [ ] Input validation is implemented where needed
- [ ] Error states are handled gracefully
- [ ] Loading states are implemented
- [ ] Form validation works correctly
- [ ] Data persistence (localStorage) is handled correctly
- [ ] State management (Zustand) is used appropriately

## Security Checklist
- [ ] No sensitive data exposed in client-side code
- [ ] User input is sanitized/validated
- [ ] No XSS vulnerabilities (proper escaping)
- [ ] No SQL injection risks (using Prisma safely)
- [ ] Authentication/authorization checks are in place (if applicable)
- [ ] Rate limiting considered (if applicable)
- [ ] Dependencies are up to date and secure
- [ ] No credentials or API keys in code

## Accessibility (a11y) Checklist
- [ ] Semantic HTML is used (proper heading hierarchy, landmarks)
- [ ] All interactive elements are keyboard accessible
- [ ] Focus management is implemented correctly
- [ ] ARIA labels and roles are used appropriately
- [ ] Images have alt text
- [ ] Color contrast meets WCAG AA standards
- [ ] Form labels are properly associated with inputs
- [ ] Error messages are accessible to screen readers
- [ ] Skip links are present (if applicable)
- [ ] Focus indicators are visible

## Internationalization (i18n) Checklist
- [ ] All user-facing strings use translation system
- [ ] No hardcoded text in components
- [ ] Date/time formatting is locale-aware
- [ ] RTL (right-to-left) languages are supported (if applicable)
- [ ] Number formatting is locale-aware
- [ ] Translation keys follow naming conventions
- [ ] Missing translations have fallbacks

## Performance Checklist
- [ ] No unnecessary re-renders
- [ ] Images use Next.js Image component
- [ ] Code splitting is used where appropriate
- [ ] Lazy loading is implemented for heavy components
- [ ] Database queries are optimized (if applicable)
- [ ] No memory leaks (cleanup in useEffect)
- [ ] Large lists are virtualized or paginated
- [ ] Bundle size impact is minimal
- [ ] Client-side caching is used appropriately

## Additional Notes
<!-- Any additional information that reviewers should know -->

## Deployment Notes
<!-- Any special deployment considerations -->
- [ ] Environment variables documented (if new ones added)
- [ ] Database migrations needed (if applicable)
- [ ] Breaking changes documented

