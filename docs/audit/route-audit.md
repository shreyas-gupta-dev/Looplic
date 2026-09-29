# Looplic user app route audit

Generated: 2026-09-09T14:29:47.321Z

Supersedes `baseline-route-audit.md`, which was captured at 2026-09-08T13:07 —
before the repair-tile links, the image allowlist guard and the anonymous-cart fix
landed. Compare the two to see what those changes did.

| Route | Status | Console errors | Broken images | Dead controls |
| --- | --- | --- | --- | --- |
| `/` | 200 | 0 | 0 | 0 |
| `/service/mobile-repair` | 200 | 0 | 0 | 0 |
| `/service/laptop-repair` | 200 | 0 | 0 | 0 |
| `/service/cctv` | 200 | 0 | 0 | 0 |
| `/service/it-support` | 200 | 0 | 0 | 0 |
| `/service/desktop-assembly` | 200 | 0 | 0 | 0 |
| `/service/managed-it-services` | 200 | 0 | 0 | 0 |
| `/service/mobile-repair/brands` | 200 | 0 | 0 | 0 |
| `/service/laptop-repair/brands` | 200 | 0 | 0 | 0 |
| `/sell` | 200 | 0 | 0 | 0 |
| `/sell/track` | 200 | 0 | 0 | 0 |
| `/track` | 200 | 0 | 0 | 0 |
| `/buy` | 200 | 0 | 0 | 0 |
| `/blog` | 200 | 0 | 0 | 0 |
| `/store-locator` | 200 | 0 | 0 | 0 |
| `/partners` | 200 | 0 | 0 | 0 |
| `/about-us` | 200 | 0 | 0 | 0 |
| `/contact-us` | 200 | 0 | 0 | 0 |
| `/faq` | 200 | 0 | 0 | 0 |
| `/cart` | 200 | 0 | 0 | 0 |
| `/checkout` | 200 | 0 | 0 | 0 |
| `/auth` | 200 | 0 | 0 | 0 |
| `/auth/reset-password` | 200 | 0 | 0 | 0 |
| `/account` | 200 | 0 | 0 | 0 |
| `/privacy-policy` | 200 | 0 | 0 | 0 |
| `/terms-and-conditions` | 200 | 0 | 0 | 0 |

## Route failures (0)

None.

## Broken images (0)

None. The Fujitsu logo that 404'd from Google's favicon proxy no longer renders:
`BrandLogo` refuses any host outside the allowlist and shows a branded letter tile
instead.

## Console errors (0)

None. `/cart` and `/checkout` previously logged a 401 on every anonymous visit;
`GET /api/cart` now returns `{items: [], authenticated: false}` for a visitor with
no session, because an empty cart is the correct answerrather than an error.

## Elements that look clickable but are not (0)

None. The six "What needs fixing?" tiles on both `/service/mobile-repair` and
`/service/laptop-repair` were `<div>`s; they are now `<Link>`s carrying the repair
selection through to the brands page.

## What this run does not cover

- Only the `user` app. The admin, technician and operator dashboards are checked by
  `scripts/verify-dashboard-users.cjs` (auth and role matrix) but have no route sweep.
- Signed-in surfaces. `/account` is audited as an anonymous visitor, so it redirects
  to `/auth` rather than rendering the account page.
- Password reset delivery, which fails at the Supabase SMTP layer and is not a
  route-level defect. See `docs/dashboard-access.md`.
