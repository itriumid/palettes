// The palettes and themes on offer. Each palette has a light and a dark version, and the theme
// (System, Light, Dark) picks between them. Colors live in palettes.css, keyed by `id`.
// No imports, so the contrast check can run in Node without a bundler.

export const PALETTES = [
  { id: "rhodonite", label: "Rhodonite" },
  { id: "catppuccin-mocha", label: "Catppuccin Mocha" },
  { id: "catppuccin-macchiato", label: "Catppuccin Macchiato" },
  { id: "catppuccin-frappe", label: "Catppuccin Frappé" },
] as const;

export type PaletteId = (typeof PALETTES)[number]["id"];

/** Itrium's own palette, and the one applications start with. */
export const DEFAULT_PALETTE: PaletteId = "rhodonite";

export function isPaletteId(value: unknown): value is PaletteId {
  return PALETTES.some((palette) => palette.id === value);
}

export const THEMES = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] as const;

export type ThemePreference = (typeof THEMES)[number]["value"];

export function isThemePreference(value: unknown): value is ThemePreference {
  return THEMES.some((theme) => theme.value === value);
}

/**
 * Where an application saves its choices in `localStorage`. Its app.html reads the same keys
 * before the first paint, so the window never flashes the default colors.
 */
export function storageKeys(prefix: string) {
  return { theme: `${prefix}:theme`, palette: `${prefix}:palette` };
}
