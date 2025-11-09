# Screen Reader Mode

This app includes an optional "Screen reader mode" that enhances accessibility for assistive technology users.

## Features

- Toggle with persistent state (`localStorage`), announced via a polite live region.
- Skip links: "Skip to content" and "Skip to navigation" appear on initial keyboard focus.
- Landmarks: `<main id="main-content" role="main">` and `<nav id="primary-navigation" aria-label="Primary">`.
- Stronger focus outlines when enabled (`body[data-sr-mode='true']`).
- Auto alt text for images missing `alt`:
  - Uses a captioning endpoint if configured.
  - Falls back to a filename-based heuristic with special handling for decorative images.

## UI Placement

- Toggle button: Header, both desktop and mobile navigation menus.
- Skip links: Rendered near the top of the document; use Tab to reveal.

## Files

- Provider and hook: `components/a11y/screen-reader-provider.tsx`
- Toggle button: `components/a11y/ScreenReaderToggle.tsx`
- Skip links: `components/a11y/SkipLinks.tsx`
- Heuristics and helpers: `lib/a11y.ts`
- Layout integration: `app/layout.tsx`
- Alt-text proxy route: `app/api/a11y/alt-text/route.ts`
- Optional captioning backend: `app/api/caption/route.ts`
- Styles: `app/globals.css` (focus outlines and `.skip-link`)

## Configuration

Set one of the following to enable captioning via HTTP POST. Otherwise, the system uses heuristics.

- `ALT_TEXT_ENDPOINT` (server-side) — e.g., `/api/caption` or an external absolute URL.
- `NEXT_PUBLIC_ALT_TEXT_API` (client-side) — if your captioning endpoint is public.

Optional (Hugging Face):

- `HF_TOKEN` or `HUGGINGFACE_API_KEY` — required to use the included `/api/caption` route.
- `ALT_TEXT_HF_MODEL` — default `Salesforce/blip-image-captioning-large`.

### Example `.env.local`

```
HF_TOKEN=hf_your_token_here
ALT_TEXT_ENDPOINT=/api/caption
# ALT_TEXT_HF_MODEL=Salesforce/blip-image-captioning-large
```

## Test the APIs

Local caption route (requires `HF_TOKEN`):

```
curl -X POST http://localhost:3000/api/caption \
  -H 'Content-Type: application/json' \
  -d '{"image":"https://images.unsplash.com/photo-1517849845537-4d257902454a"}'
```

Alt-text route (uses `ALT_TEXT_ENDPOINT` if set, otherwise heuristic):

```
curl "http://localhost:3000/api/a11y/alt-text?src=https://images.unsplash.com/photo-1517849845537-4d257902454a"
```

## QA Checklist

- Keyboard Tab from top of page reveals skip links; Enter activates and moves focus.
- Toggle announces enable/disable state to screen readers.
- Focus outlines are at least 2px; 3px when SR mode is on.
- Nav has `aria-label="Primary"` and an `id` referenced by skip link.
- Images without `alt` get populated automatically; decorative placeholders get `alt=""` + `aria-hidden`.

