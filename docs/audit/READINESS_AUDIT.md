# Production-Readiness Baseline Audit: The 20 Launch Essentials

**Date:** November 15, 2026  
**Auditor:** Principal Full-Stack Engineer, DevSecOps Lead, & Technical SEO Architect  
**Repository Branch:** `chore/production-readiness-audit`  
**Base Commit:** `da5dbb2` (up to date with `looplic/main`)  
**Application Target:** `apps/user` (Looplic Customer Web App)  

---

## 1. Executive Summary & Scorecard

A comprehensive audit was performed across all 20 production-readiness launch essentials spanning Security & Compliance, SEO & Metadata, Performance, Accessibility & Mobile Responsiveness, and Forms & Bot Defense.

### Baseline Summary Metrics:
- **PASS:** 3 / 20 (15%)
- **PARTIAL:** 16 / 20 (80%)
- **MISSING:** 1 / 20 (5%)
- **Baseline Unit Tests:** 73 / 73 PASSING (2.5s)
- **Baseline Typecheck:** 0 errors (clean)
- **Lighthouse Baseline:**
  - **Desktop:** Performance: 91 | Accessibility: 97 | Best Practices: 77 | SEO: 92
  - **Mobile:** Performance: 74 | Accessibility: 97 | Best Practices: 77 | SEO: 92

---

## 2. Detailed 20-Point Scorecard

| # | Essential Item | Cluster | Baseline Status | Files / Locations | Key Deficiencies / Findings | Implementation Plan |
|---|---|---|---|---|---|---|
| **1** | **Secrets Audit** | A: Security & Compliance | **PASS** | `apps/user/app/api/`, `.env.local`, `.gitignore` | Server secrets (`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `DATABASE_URL`) are isolated to backend API routes and unit test mocks. `NEXT_PUBLIC_` variables only contain public IDs. | Sanitize legacy `NEXT_PUBLIC_S3_*` fallback in server-only route. |
| **2** | **HTTPS & Security Headers** | A: Security & Compliance | **PARTIAL** | `apps/user/next.config.ts:12-36` | HSTS with preload, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin` exist. Content Security Policy (Report-Only) is MISSING. | Add `Content-Security-Policy-Report-Only` header with script, style, image, and connect allowlists. |
| **3** | **Privacy Policy Page** | A: Security & Compliance | **PARTIAL** | `apps/user/app/privacy-policy/page.tsx` | Complete legal framework for customer data, but lacks explicit section on Cookie usage, Local Storage, and Analytics Tracking. | Add explicit Cookies & Analytics disclosure section with opt-out details. |
| **4** | **Terms & Conditions Page** | A: Security & Compliance | **PARTIAL** | `apps/user/app/terms-and-conditions/page.tsx` | Comprehensive customer and technician service rules, but lacks explicit Governing Law and Bengaluru Jurisdiction clause. | Add Clause 11: Governing Law & Exclusive Jurisdiction (Bengaluru, Karnataka). |
| **5** | **Cookie Consent Banner** | A: Security & Compliance | **MISSING** | `apps/user/src/components/`, `apps/user/app/layout.tsx` | No user-facing cookie banner exists. Google Tag Manager loads analytics immediately without default denied consent state. | Implement `CookieConsentBanner.tsx` with Google Tag Consent Mode v2 (`analytics_storage: 'denied'`, `ad_storage: 'denied'`). |
| **6** | **Meta Titles & Descriptions** | B: SEO & Metadata | **PASS** | `apps/user/src/lib/metadata.ts`, `apps/user/app/layout.tsx` | Every route uses `buildPageMetadata` or explicit `<title>` (<60 chars) and `<meta name="description">` (<155 chars) with dynamic canonical tags. | Verify canonical URLs across all dynamic routes. |
| **7** | **OpenGraph & Social Preview** | B: SEO & Metadata | **PARTIAL** | `apps/user/public/`, `apps/user/src/lib/metadata.ts` | OpenGraph tags and `twitter:card: "summary_large_image"` exist, but default `og:image` points to a square 512x512 app icon instead of a 1200x630 social card. | Create dedicated 1200x630 `public/og-image.png` social preview card asset. |
| **8** | **Favicons & Web App Manifest** | B: SEO & Metadata | **PARTIAL** | `apps/user/public/`, `apps/user/app/manifest.ts` | `favicon.ico` and `manifest.webmanifest` exist. Missing standard `/icon.png` and dedicated `/apple-touch-icon.png` in root public. | Generate `/apple-touch-icon.png` (180x180) and `/icon.png` (192x192). |
| **9** | **Sitemap & Robots.txt** | B: SEO & Metadata | **PASS** | `apps/user/public/robots.txt`, `apps/user/app/sitemap.ts` | Comprehensive XML sitemap with dynamic catalog queries, ISO timestamps, and detailed `robots.txt` honoring AI search engines while disallowing private/API routes. | Ensure sitemap entries remain properly cached with 300s ISR. |
| **10** | **Custom 404 Page** | B: SEO & Metadata | **PARTIAL** | `apps/user/app/not-found.tsx` | Page returns HTTP 404, but renders internal migration placeholder text ("slug-based Next.js route exists in the new app shell...") and lacks helpful navigation links. | Redesign 404 page with Looplic brand styling, search links, and customer support shortcut. |
| **11** | **Image Alt Text Audit** | C: Performance & Assets | **PARTIAL** | `apps/user/src/components/next/`, `image-registry.ts` | Core service illustrations have strict alt registry, but several raw `<img>` tags in components have empty or generic alt text. | Audit and add descriptive contextual alt text across all raw `<img>` and `next/image` tags. |
| **12** | **Image Compression & Formats** | C: Performance & Assets | **PARTIAL** | `apps/user/public/images/`, `next.config.ts` | WebP imagery used extensively, but some raw `<img>` tags bypass Next.js image optimization and responsive `sizes`. | Migrate key above-the-fold images to `next/image` with explicit dimensions and WebP/AVIF output. |
| **13** | **Page Speed & Core Web Vitals** | C: Performance & Assets | **PARTIAL** | Headless Lighthouse baseline | Desktop Performance: 91, Mobile: 74 (LCP: 3.1s, FCP: 1.4s, CLS: 0.02, TBT: 180ms). Best Practices: 77. | Optimize font display, remove unused CSS/scripts, and enforce preconnect headers. |
| **14** | **Color Contrast Compliance** | D: Accessibility & Mobile | **PARTIAL** | Tailwind config & component styles | Some muted text classes (`text-slate-400` on light backgrounds) have ~3.5:1 contrast, falling below WCAG AA 4.5:1. | Enforce high-contrast slate-700 / slate-900 neutrals (targeting 7:1 ratio). |
| **15** | **Mobile Responsiveness (360-430px)** | D: Accessibility & Mobile | **PARTIAL** | Multi-viewport check | Touch targets in certain mobile menus and footers are 36px, below the 44x44px minimum touch target standard. | Ensure all buttons, links, and form inputs meet min-h-[44px] and min-w-[44px]. |
| **16** | **Broken Links Audit** | D: Accessibility & Mobile | **PARTIAL** | `apps/user/src/components/next/HomepageNavbar.tsx`, `HomepageFooter.tsx` | Found broken link `/service/mobile` (should be `/service/mobile-repair`) and dead anchor `href="#"` in footer. | Fix `/service/mobile` route link, replace dead `#` anchors with active legal/support routes. |
| **17** | **Form Validation** | E: Conversion & Bot Defense | **PARTIAL** | `apps/user/src/components/next/ContactLeadForm.tsx`, `RecoveryBookingForm.tsx` | Recovery booking form has Zod schema validation, but `ContactLeadForm.tsx` relies only on basic string trimming and lacks inline accessible error states (`aria-invalid`). | Add robust Zod schema validation with accessible inline field errors to `ContactLeadForm.tsx`. |
| **18** | **Anti-Spam Bot Defense** | E: Conversion & Bot Defense | **PARTIAL** | `apps/user/app/api/leads/notify/route.ts`, `ContactLeadForm.tsx` | Data recovery form has honeypot; contact enquiry form lacks honeypot and timestamp velocity checks. | Add hidden honeypot input and minimum submission delay check to prevent spam bots. |
| **19** | **Analytics & Event Measurement** | E: Conversion & Bot Defense | **PARTIAL** | `apps/user/src/lib/gtag.ts`, `apps/user/app/layout.tsx` | Dual Google Ads tags (`AW-18323182413`, `AW-18186396144`) and GA4 events are emitted, but without Consent Mode gating. | Integrate Google Consent Mode v2 so tracking signals adjust based on user consent. |
| **20** | **Unified Call to Action (CTA)** | E: Conversion & Bot Defense | **PARTIAL** | Landing page hero sections | Legacy pages present multiple competing primary buttons in the hero section. | Enforce single primary button per section with secondary actions converted to plain text links. |

---

## 3. Phased Implementation Roadmap

1. **Phase 1: Compliance & Security Implementation (Items 1 - 5)**
   - Item 1: Clean server-only boundary in `app/api/repair-stream` and `app/api/upload`.
   - Item 2: Add `Content-Security-Policy-Report-Only` header in `apps/user/next.config.ts`.
   - Item 3: Add Cookies & Analytics section to `/privacy-policy`.
   - Item 4: Add Governing Law & Jurisdiction clause to `/terms-and-conditions`.
   - Item 5: Build `CookieConsentBanner.tsx` and integrate Google Consent Mode v2 in `layout.tsx` / `gtag.ts`.

2. **Phase 2: SEO & Metadata Implementation (Items 6 - 10)**
   - Item 7: Generate dedicated 1200x630 `public/og-image.png` and update `metadata.ts`.
   - Item 8: Provide `public/apple-touch-icon.png` (180x180) and `public/icon.png` (192x192).
   - Item 10: Redesign `app/not-found.tsx` with professional brand copy and navigation shortcuts.

3. **Phase 3: Performance, Accessibility & Mobile Polish (Items 11 - 16)**
   - Item 11 & 12: Contextual `alt` attributes and responsive `sizes` on images.
   - Item 14 & 15: Enhance contrast to 7:1 for secondary text; enforce 44x44px touch targets.
   - Item 16: Fix broken link `/service/mobile` -> `/service/mobile-repair` and dead anchors in `HomepageFooter.tsx`.

4. **Phase 4: Forms, Anti-Spam & Conversion Enhancements (Items 17 - 20)**
   - Item 17: Zod schema validation and accessible error feedback in `ContactLeadForm.tsx`.
   - Item 18: Anti-spam honeypot and velocity check in `ContactLeadForm.tsx` & `/api/leads/notify`.
   - Item 19 & 20: GA4 `generate_lead` consent integration and single CTA hierarchy.

5. **Phase 5: Verification & Preview Deployment**
   - Run typecheck and full unit test suite.
   - Deploy Vercel preview and perform live smoke check.
