# Looplic dashboard and signed-in route audit

Generated: 2026-09-09T22:15:36.130Z

Complements `route-audit.md`, which covers the customer app as an anonymous visitor. This covers what that one cannot see: the three dashboards, and pages that only exist for someone signed in.

## Anonymous access to dashboard routes

A dashboard route must not render without a session.

| App | Route | Anonymous outcome | Safe |
| --- | --- | --- | --- |
| admin | `/admin/dashboard` | redirected to /admin/login | yes |
| technician | `/technician` | redirected to /technician/login | yes |
| operator | `/operator` | redirected to /operator/login | yes |

## Signed-in route sweep

| App | Route | Status | Console errors | Broken images | Dead controls |
| --- | --- | --- | --- | --- | --- |
| admin | `/admin/login` → `/admin/dashboard` | 200 | 0 | 0 | 0 |
| admin | `/admin/dashboard` | 200 | 0 | 0 | 0 |
| technician | `/technician/login` | 200 | 0 | 0 | 0 |
| technician | `/technician` → `/technician/login` | 200 | 0 | 0 | 0 |
| operator | `/operator/login` | 200 | 0 | 0 | 0 |
| operator | `/operator` → `/operator/login` | 200 | 0 | 0 | 0 |

## Console errors (0 route(s))

None.

## Broken images (0 route(s))

None.

## Elements that look clickable but are not (0 route(s))

None.

## Not covered (1)

- **user**: could not complete customer sign-in from a script — /auth is OTP-gated, so signed-in surfaces were not audited
