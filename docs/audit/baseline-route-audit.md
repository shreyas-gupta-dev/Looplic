# Looplic user app route audit

Generated: 2026-09-08T13:07:42.251Z

| Route | Status | Console errors | Broken images | Dead controls |
| --- | --- | --- | --- | --- |
| `/` | 200 | 0 | 0 | 0 |
| `/service/mobile-repair` | 200 | 0 | 0 | 6 |
| `/service/laptop-repair` | 200 | 0 | 0 | 6 |
| `/service/cctv` | 200 | 0 | 0 | 0 |
| `/service/it-support` | 200 | 0 | 0 | 0 |
| `/service/desktop-assembly` | 200 | 0 | 0 | 0 |
| `/service/managed-it-services` | 200 | 0 | 0 | 0 |
| `/service/mobile-repair/brands` | 200 | 0 | 0 | 0 |
| `/service/laptop-repair/brands` | 200 | 1 | 1 | 0 |
| `/sell` | 200 | 0 | 0 | 0 |
| `/sell/track` | 200 | 0 | 0 | 0 |
| `/buy` | 200 | 0 | 0 | 0 |
| `/blog` | 200 | 0 | 0 | 0 |
| `/store-locator` | 200 | 0 | 0 | 0 |
| `/partners` | 200 | 0 | 0 | 0 |
| `/about-us` | 200 | 0 | 0 | 0 |
| `/contact-us` | 200 | 0 | 0 | 0 |
| `/faq` | 200 | 0 | 0 | 0 |
| `/cart` | 200 | 1 | 0 | 0 |
| `/checkout` | 200 | 1 | 0 | 0 |
| `/auth` | 200 | 0 | 0 | 0 |
| `/account` | 200 | 0 | 0 | 0 |
| `/privacy-policy` | 200 | 0 | 0 | 0 |
| `/terms-and-conditions` | 200 | 0 | 0 | 0 |

## Route failures (0)

None.

## Broken images (1)

- https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://fujitsu.com&size=128 — HTTP 404

## Console errors (3)

- /service/laptop-repair/brands: Failed to load resource: the server responded with a status of 404 ()
- /cart: Failed to load resource: the server responded with a status of 401 (Unauthorized)
- /checkout: Failed to load resource: the server responded with a status of 401 (Unauthorized)

## Elements that look clickable but are not (12)

- /service/mobile-repair: <div> "Screen RepairCracked or broken display"
- /service/mobile-repair: <div> "Battery ReplacementWeak or dead battery"
- /service/mobile-repair: <div> "Charging PortLoose or faulty port"
- /service/mobile-repair: <div> "MotherboardComplex board-level repair"
- /service/mobile-repair: <div> "Speaker/MicAudio issues fixed"
- /service/mobile-repair: <div> "Camera RepairFront or rear camera"
- /service/laptop-repair: <div> "Screen RepairCracked or broken display"
- /service/laptop-repair: <div> "Battery ReplacementWeak or dead battery"
- /service/laptop-repair: <div> "Charging PortLoose or faulty port"
- /service/laptop-repair: <div> "MotherboardComplex board-level repair"
- /service/laptop-repair: <div> "Speaker/MicAudio issues fixed"
- /service/laptop-repair: <div> "Camera RepairFront or rear camera"
