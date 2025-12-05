---
inclusion: always
---

# Localization Readiness

**Description:** Guidance for making sure translations and locale routing stay in sync.

## Prompt

Use MCP for files/commands. When touching text/UI flows:
+- Source strings through `messages/en.json` or route-specific `i18n` files; avoid hard-coded literals.
+- Update translation files (`i18n/{locale}.json`) and run diff checks to ensure all locales contain the new keys.
+- Verify pluralization, interpolation, and right-to-left text where relevant; reuse existing glossary terms (`messages/glossary.json` if available).
+- Run localized smoke tests (routing, pages with locale switcher) via Playwright when possible.
+- Document any untranslated strings or locale-specific decisions for the translation team.
