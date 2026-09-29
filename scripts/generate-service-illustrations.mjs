/**
 * Generates the Looplic service illustration set.
 *
 * Why generated rather than hand-drawn one file at a time: the whole point of the
 * set is that 19 tiles look like they belong together. Emitting them from one
 * spec guarantees identical canvas size, stroke weight, backdrop treatment and
 * palette, and makes a restyle a one-line change instead of 19 edits.
 *
 * Run from the repo root:
 *   node scripts/generate-service-illustrations.mjs
 *
 * Output: apps/user/public/illustrations/*.svg  (400x400, no external refs)
 *
 * ── Design rules, and why each one is a rule ────────────────────────────────
 *
 * 1. ONE stroke weight, everywhere. The previous set mixed 11, 12, 13 and 14
 *    across and even within tiles, which is the single thing that most reliably
 *    makes an icon set look homemade: the eye reads inconsistent weight as
 *    carelessness even when it cannot name what is wrong. Emphasis is carried by
 *    COLOUR (navy vs brand gradient), never by thickness.
 *
 * 2. One optical box. Every glyph is drawn inside 96–304 and balanced about the
 *    centre, so no tile looks larger or heavier than its neighbours in a grid.
 *
 * 3. Tonal fill, not pure outline. Screens and faces carry a faint brand tint.
 *    Hollow outlines look unfinished at tile size and vanish on white; a tint
 *    gives each object a body and reads as a real surface.
 *
 * 4. A squircle backdrop, translucent. It echoes the rounded cards these sit in,
 *    and being translucent it composes over whatever tile background is behind
 *    it rather than fighting it.
 *
 * 5. Rounded caps and joins throughout, and corner radii drawn from one scale.
 *    Mixed radii are the second-most common tell of an ad-hoc set.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT_DIR = join("apps", "user", "public", "illustrations");

// Palette derived from src/index.css:
//   --primary: 145 52% 53%   --gradient-brand end: 160 60% 40%   --navy: 210 25% 13%
const GREEN = "#56C68A";
const TEAL = "#29A37B";
const NAVY = "#1F2A33";

/** The single stroke weight. See design rule 1. */
const STROKE = 13;

/**
 * Shared chrome. Identical on all 19 tiles, which is what makes them a set.
 *
 * `aria-hidden` plus `role="img"`: these are decorative next to a text label in
 * every place they are used, and the registry carries the real alt text.
 */
function frame(body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400" role="img" aria-hidden="true">
  <defs>
    <linearGradient id="backdrop" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${GREEN}" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="${TEAL}" stop-opacity="0.07"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${GREEN}"/>
      <stop offset="100%" stop-color="${TEAL}"/>
    </linearGradient>
    <linearGradient id="tint" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${GREEN}" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="${TEAL}" stop-opacity="0.10"/>
    </linearGradient>
  </defs>
  <rect x="44" y="44" width="312" height="312" rx="94" fill="url(#backdrop)"/>
  <g fill="none" stroke="${NAVY}" stroke-width="${STROKE}" stroke-linecap="round" stroke-linejoin="round">
${body}
  </g>
</svg>
`;
}

/** A tinted surface: screen glass, watch face, monitor panel. Fill only, no stroke. */
const glass = (x, y, w, h, r = 8) =>
  `    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="url(#tint)" stroke="none"/>`;

const dot = (cx, cy, r = 7) => `    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${NAVY}" stroke="none"/>`;

// ── Reusable objects, so a phone is the same phone on every tile ──────────────

/** Handset: body, earpiece slot, tinted screen, home dot. */
function phone(cx = 200) {
  const x = cx - 48;
  return `    <rect x="${x}" y="92" width="96" height="216" rx="22"/>
${glass(x + 12, 122, 72, 150, 8)}
    <line x1="${cx - 14}" y1="108" x2="${cx + 14}" y2="108"/>
${dot(cx, 288)}`;
}

/** Clamshell: lid, tinted panel, wedge base. */
const laptop = `    <rect x="120" y="106" width="160" height="112" rx="14"/>
${glass(134, 120, 132, 84, 7)}
    <path d="M102 232h196l20 32H82z"/>`;

/** Watch: case, two strap stubs, tinted face. */
const watch = `    <rect x="150" y="134" width="100" height="132" rx="30"/>
${glass(162, 148, 76, 104, 22)}
    <path d="M176 134v-26h48v26M176 266v26h48v-26"/>`;

/** Rupee mark — the sell-side counterpart to the repair-side check. */
const rupee = (x, y, s = 1) =>
  `    <path d="M${x} ${y}h${44 * s}M${x} ${y + 26 * s}h${44 * s}M${x + 36 * s} ${y}c0 ${28 * s} ${-24 * s} ${28 * s} ${-36 * s} ${28 * s}l${36 * s} ${38 * s}" stroke="url(#accent)"/>`;

/** Check mark — "fixed". Colour, not weight, carries the emphasis. */
const check = (x, y, s = 1) =>
  `    <path d="M${x} ${y}l${16 * s} ${16 * s} ${28 * s} -${34 * s}" stroke="url(#accent)"/>`;

const GLYPHS = {
  // ── Our Services ────────────────────────────────────────────────────────────
  "repair-phone": `${phone()}
${check(174, 196)}`,

  "repair-laptop": `${laptop}
${check(172, 158)}`,

  // Hard drive: platter, spindle, and the actuator arm that makes it read as a
  // drive rather than a generic box.
  "data-recovery": `    <rect x="104" y="130" width="192" height="140" rx="18"/>
    <circle cx="196" cy="200" r="44"/>
${dot(196, 200, 9)}
    <path d="M286 146l-58 44" stroke="url(#accent)"/>
    <circle cx="288" cy="144" r="9" fill="url(#accent)" stroke="none"/>`,

  "apple-watch-repair": `${watch}
${check(180, 198, 0.86)}
    <path d="M258 188v24" stroke="url(#accent)"/>`,

  // Two buds: round head, straight stem below it. The arc-and-taper version this
  // replaces read as balloons on a string at tile size.
  "airpods-repair": `    <circle cx="158" cy="156" r="30"/>
    <rect x="144" y="182" width="28" height="70" rx="14"/>
    <circle cx="250" cy="156" r="30" stroke="url(#accent)"/>
    <rect x="236" y="182" width="28" height="70" rx="14" stroke="url(#accent)"/>`,

  // Tower plus monitor: "assembly" needs both, or it is just a box.
  desktop: `    <rect x="112" y="100" width="92" height="206" rx="18"/>
    <line x1="136" y1="136" x2="180" y2="136"/>
    <line x1="136" y1="166" x2="180" y2="166"/>
    <circle cx="158" cy="246" r="20" stroke="url(#accent)"/>
    <rect x="232" y="148" width="84" height="64" rx="10"/>
${glass(244, 160, 60, 40, 5)}
    <line x1="274" y1="212" x2="274" y2="238"/>
    <line x1="250" y1="252" x2="298" y2="252"/>`,

  // Headset: on-site IT support is a person you can talk to.
  "it-support": `    <path d="M116 210v-20a84 84 0 0 1 168 0v20"/>
    <rect x="92" y="206" width="48" height="80" rx="20"/>
${glass(100, 216, 32, 60, 14)}
    <rect x="260" y="206" width="48" height="80" rx="20"/>
${glass(268, 216, 32, 60, 14)}
    <path d="M284 286v10a30 30 0 0 1-30 30h-36" stroke="url(#accent)"/>`,

  // Box camera with lens hood, on a bracket.
  cctv: `    <rect x="112" y="150" width="140" height="76" rx="18"/>
${glass(124, 162, 62, 52, 10)}
    <path d="M252 172l50-24v76l-50-24z"/>
    <circle cx="152" cy="188" r="16" stroke="url(#accent)"/>
    <line x1="184" y1="226" x2="184" y2="268"/>
    <line x1="146" y1="282" x2="222" y2="282"/>`,

  "sell-phone": `${phone(176)}
${rupee(254, 152)}`,

  "sell-laptop": `${laptop}
${rupee(178, 146, 0.72)}`,

  // Charger brick, prongs, coiled lead, connector.
  accessories: `    <rect x="120" y="154" width="98" height="98" rx="22"/>
    <line x1="148" y1="154" x2="148" y2="122"/>
    <line x1="192" y1="154" x2="192" y2="122"/>
    <path d="M218 202h30a34 34 0 0 1 0 68h-6" stroke="url(#accent)"/>
    <rect x="222" y="282" width="58" height="30" rx="12" stroke="url(#accent)"/>`,

  "store-locator": `    <path d="M200 320s-82-82-82-138a82 82 0 0 1 164 0c0 56-82 138-82 138z"/>
    <circle cx="200" cy="180" r="30" stroke="url(#accent)"/>`,

  // ── Sell Your Old Device ────────────────────────────────────────────────────
  // Phone shifted left so the outgoing arrow sits at mid-height, where the
  // squircle is widest. At the top right the corner radius cuts the canvas in and
  // the arrow was clipped.
  "sell-category-mobile": `${phone(178)}
    <line x1="248" y1="200" x2="292" y2="200" stroke="url(#accent)"/>
    <path d="M274 182l18 18-18 18" stroke="url(#accent)"/>`,

  "sell-category-laptop": `${laptop}
    <line x1="152" y1="146" x2="248" y2="146" stroke="url(#accent)"/>
    <line x1="152" y1="176" x2="212" y2="176" stroke="url(#accent)"/>`,

  "sell-category-tablet": `    <rect x="122" y="100" width="156" height="200" rx="22"/>
${glass(136, 118, 128, 158, 8)}
${dot(200, 286)}
    <line x1="182" y1="110" x2="218" y2="110"/>`,

  // Watch as a watch: hands, not a check.
  "sell-category-smartwatch": `${watch}
    <circle cx="200" cy="200" r="36" stroke="url(#accent)"/>
    <path d="M200 178v22l16 12"/>`,

  // Gamepad: grips, d-pad, buttons.
  "sell-category-gaming": `    <path d="M142 180h116a56 56 0 0 1 56 56v6a32 32 0 0 1-58 18l-13-20h-86l-13 20a32 32 0 0 1-58-18v-6a56 56 0 0 1 56-56z"/>
    <line x1="144" y1="218" x2="176" y2="218" stroke="url(#accent)"/>
    <line x1="160" y1="202" x2="160" y2="234" stroke="url(#accent)"/>
${dot(250, 214, 9)}
${dot(276, 236, 9)}`,

  // Headband style, deliberately distinct from the airpods-repair buds.
  "sell-category-earphones": `    <path d="M118 218v-16a82 82 0 0 1 164 0v16"/>
    <rect x="96" y="214" width="46" height="80" rx="20"/>
${glass(104, 224, 30, 60, 14)}
    <rect x="258" y="214" width="46" height="80" rx="20" stroke="url(#accent)"/>`,

  "sell-category-desktop": `    <rect x="110" y="112" width="180" height="122" rx="14"/>
${glass(124, 126, 152, 94, 8)}
    <line x1="200" y1="234" x2="200" y2="276"/>
    <line x1="154" y1="290" x2="246" y2="290"/>`,
};

mkdirSync(OUT_DIR, { recursive: true });

let written = 0;
for (const [name, body] of Object.entries(GLYPHS)) {
  writeFileSync(join(OUT_DIR, `${name}.svg`), frame(body), "utf8");
  written += 1;
}

console.log(`Wrote ${written} illustrations to ${OUT_DIR}`);
