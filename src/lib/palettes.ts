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

/**
 * Rhodonite's colors for code: syntax highlighting and the sixteen terminal colors, for editor
 * and terminal themes (the Rhodonite editor theme, the terminal themes). Applications don't use
 * them. The hues sit next to the pink rather than competing with it: muted and a little warm on
 * dark, deepened in the same hue on light, where the pastels can't be read. Pink is never text on
 * a light background, so light mode's pink is a deep rose.
 *
 * `codeColorProblems` in check.ts checks every one against the surfaces code sits on.
 */
export const CODE_COLORS = {
  dark: {
    syntax: {
      rose: "#f58c9d",
      sage: "#a9c9a0",
      sand: "#e6cf98",
      blue: "#9fb5d8",
      pink: "#febfca",
      teal: "#9dcec7",
      /** A step quieter than the text, so code reads by its words, not its brackets. */
      punctuation: "#d4d4d4",
    },
    terminal: {
      black: "#3e3e3e", red: "#f58c9d", green: "#a9c9a0", yellow: "#e6cf98",
      blue: "#9fb5d8", magenta: "#febfca", cyan: "#9dcec7", white: "#d4d4d4",
      brightBlack: "#969696", brightRed: "#f9a8b5", brightGreen: "#c0dcb7", brightYellow: "#f1dfb4",
      brightBlue: "#bacce8", brightMagenta: "#ffd7de", brightCyan: "#bae1db", brightWhite: "#f2f2f2",
    },
  },
  light: {
    syntax: {
      rose: "#b03a4f",
      sage: "#3f7339",
      sand: "#7f6216",
      blue: "#3a5f93",
      pink: "#a84d60",
      teal: "#2f7069",
      punctuation: "#4a4a4a",
    },
    terminal: {
      black: "#2b2b2b", red: "#b03a4f", green: "#3f7339", yellow: "#7f6216",
      blue: "#3a5f93", magenta: "#a84d60", cyan: "#2f7069", white: "#e4e4e4",
      brightBlack: "#6b6b6b", brightRed: "#b8455a", brightGreen: "#477e41", brightYellow: "#86671a",
      brightBlue: "#4a70a6", brightMagenta: "#b0566a", brightCyan: "#367a72", brightWhite: "#ffffff",
    },
  },
} as const;

/**
 * Terminal colors that are background shades by convention, not text: black on dark, white on
 * light. They're the only code colors that don't reach 4.5:1.
 */
export const TERMINAL_BACKGROUND_SHADES = {
  dark: ["black"],
  light: ["white", "brightWhite"],
} as const;

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
