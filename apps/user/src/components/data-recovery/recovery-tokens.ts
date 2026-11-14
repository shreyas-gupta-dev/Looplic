/**
 * Design Tokens for Looplic Data Recovery Experience
 * Enforces standardized wide container (max-w-7xl / 1280px-1400px), calm emerald/slate palette, and responsive typography.
 */
export const RECOVERY_TOKENS = {
  layout: {
    container: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 xl:px-12",
    wideContainer: "mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 xl:px-12",
    proseContainer: "mx-auto max-w-3xl px-4 sm:px-6",
    sectionPadding: "py-14 sm:py-20 lg:py-24",
  },
  colors: {
    primary: "#059669", // Emerald-600
    primaryHover: "#047857", // Emerald-700
    primaryLight: "#ecfdf5", // Emerald-50
    navy: "#0F172A", // Slate-900
    navyDark: "#020617", // Slate-950
    surface: "#FFFFFF",
    surfaceAlt: "#F8FAFC", // Slate-50
    borderSubtle: "#E2E8F0", // Slate-200
    textPrimary: "#0F172A", // Slate-900 (WCAG AAA)
    textMuted: "#334155", // Slate-700 (WCAG AA > 7:1)
  },
  typography: {
    displayFont: "var(--font-poppins), Poppins, system-ui, sans-serif",
    bodyFont: "var(--font-poppins), Poppins, system-ui, sans-serif",
  },
} as const;
