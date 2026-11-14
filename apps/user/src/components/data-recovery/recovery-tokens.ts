/**
 * Design Tokens for Looplic Data Recovery Experience
 * Enforces single container width (1152px), calm emerald/slate palette, and strict typography.
 */
export const RECOVERY_TOKENS = {
  layout: {
    container: "mx-auto max-w-6xl px-4 sm:px-6 lg:px-8",
    sectionPadding: "py-16 sm:py-20 lg:py-24",
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
