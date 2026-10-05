// The checks every palette has to pass, for Node tests: this package's own, and each
// application's, run against the stylesheet as the application loads it (this package's colors
// plus its own overrides) and against its own source.
//
// Level AA of the Web Content Accessibility Guidelines: 4.5:1 for text, 3:1 for the focus outline
// and for accent lines that show a state. The colors are read straight from the stylesheet,
// working out which rules apply the way the browser's cascade would, so a new palette or a
// changed color can't ship without passing.

import { CODE_COLORS, DEFAULT_PALETTE, PALETTES, TERMINAL_BACKGROUND_SHADES, storageKeys } from "./palettes.js";

/** This package's stylesheet, for `readFileSync`. */
export const STYLESHEET_URL = new URL("./palettes.css", import.meta.url);

export const TEXT = 4.5;
export const NON_TEXT = 3;

export interface State {
  palette: string;
  /** What the person chose. */
  theme: "system" | "light" | "dark";
  /** What the operating system is set to. */
  system: "light" | "dark";
}

/** The theme states that matter: following the system, and choosing against it. */
export const STATES = [
  { theme: "system", system: "dark", scheme: "dark" },
  { theme: "system", system: "light", scheme: "light" },
  { theme: "dark", system: "light", scheme: "dark" },
  { theme: "light", system: "dark", scheme: "light" },
] as const;

// --- Reading the stylesheet --------------------------------------------------------------------

interface Rule {
  media: string | null;
  selector: string;
  declarations: Record<string, string>;
  order: number;
}

/** Every rule, with @media blocks flattened. */
function parseRules(source: string): Rule[] {
  const rules: Rule[] = [];
  const text = source.replace(/\/\*[\s\S]*?\*\//g, "");
  let order = 0;

  function walk(body: string, media: string | null) {
    let index = 0;
    while (index < body.length) {
      const open = body.indexOf("{", index);
      if (open === -1) break;
      const prelude = body.slice(index, open).trim();
      let depth = 1;
      let close = open + 1;
      while (depth > 0 && close < body.length) {
        if (body[close] === "{") depth++;
        else if (body[close] === "}") depth--;
        close++;
      }
      const inner = body.slice(open + 1, close - 1);
      if (prelude.startsWith("@media")) {
        walk(inner, prelude.slice("@media".length).trim());
      } else {
        const declarations: Record<string, string> = {};
        for (const part of inner.split(";")) {
          const colon = part.indexOf(":");
          if (colon === -1) continue;
          declarations[part.slice(0, colon).trim()] = part.slice(colon + 1).trim();
        }
        for (const selector of prelude.split(",")) {
          rules.push({ media, selector: selector.trim(), declarations, order: order++ });
        }
      }
      index = close;
    }
  }

  walk(text, null);
  return rules;
}

const ATTRIBUTE = /\[([a-z-]+)(\^?=)"([^"]*)"\]/g;

/**
 * Matches the selector shapes used on the root: `:root`, attribute selectors (`[data-x="y"]`,
 * `[data-x^="y"]`) and `:not([...])`. Anything else doesn't match, which leaves out rules for
 * other elements and for special windows (like `:root.popover`). Returns the selector's
 * specificity, or null when it doesn't match.
 */
function match(selector: string, attributes: Record<string, string>): number | null {
  if (!selector.startsWith(":root")) return null;
  let rest = selector.slice(":root".length);
  let specificity = 1;

  const test = (name: string, operator: string, value: string) => {
    const actual = attributes[name.replace(/^data-/, "")];
    if (actual === undefined) return false;
    return operator === "=" ? actual === value : actual.startsWith(value);
  };

  rest = rest.replace(/:not\((\[[^\]]+\])\)/g, (_, inner: string) => {
    const found = new RegExp(ATTRIBUTE.source).exec(inner);
    if (!found) return "?";
    specificity++;
    if (test(found[1], found[2], found[3])) specificity = -Infinity;
    return "";
  });
  rest = rest.replace(ATTRIBUTE, (_, name: string, operator: string, value: string) => {
    specificity++;
    if (!test(name, operator, value)) specificity = -Infinity;
    return "";
  });

  return rest.trim() === "" && specificity > 0 ? specificity : null;
}

function mediaMatches(media: string | null, system: "light" | "dark") {
  if (media === null) return true;
  if (media === "(prefers-color-scheme: light)") return system === "light";
  if (media === "(prefers-color-scheme: dark)") return system === "dark";
  return false; // reduced motion and anything else: not color, not relevant here
}

/** The custom properties (and `color-scheme`) on the root element, after the cascade. */
export function tokensFor(css: string, { palette, theme, system }: State): Record<string, string> {
  const attributes: Record<string, string> = {};
  if (palette !== DEFAULT_PALETTE) attributes.palette = palette;
  if (theme !== "system") attributes.theme = theme;

  const matching = parseRules(css)
    .filter((rule) => mediaMatches(rule.media, system))
    .map((rule) => ({ ...rule, specificity: match(rule.selector, attributes) }))
    .filter((rule): rule is Rule & { specificity: number } => rule.specificity !== null)
    .sort((a, b) => a.specificity - b.specificity || a.order - b.order);

  const tokens: Record<string, string> = {};
  for (const rule of matching) {
    for (const [name, value] of Object.entries(rule.declarations)) {
      if (name.startsWith("--") || name === "color-scheme") tokens[name] = value;
    }
  }
  return tokens;
}

// --- Color math (WCAG 2.2 relative luminance and contrast ratio) -------------------------------

type Rgb = [number, number, number];

function channels(hex: string): Rgb | null {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return null;
  return [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16)) as Rgb;
}

function luminance(rgb: Rgb) {
  const [r, g, b] = rgb.map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: Rgb, b: Rgb) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

/** `color-mix(in srgb, accent <strength>, transparent)` painted over `base`. */
function tint(accent: Rgb, strength: string, base: Rgb): Rgb {
  const amount = parseFloat(strength) / 100;
  return accent.map((value, index) => value * amount + base[index] * (1 - amount)) as Rgb;
}

// --- The checks --------------------------------------------------------------------------------

const describe = ({ palette, theme, system }: State) => `${palette}, theme ${theme}, system ${system}`;

/** Every contrast pairing, for one palette in one theme state. */
function contrastProblems(css: string, state: State, scheme: "light" | "dark"): string[] {
  const tokens = tokensFor(css, state);
  const where = describe(state);
  const problems: string[] = [];

  if ((tokens["color-scheme"] ?? scheme) !== scheme) {
    problems.push(`${where}: color-scheme is ${tokens["color-scheme"]}, not ${scheme}`);
  }

  const colors: Record<string, Rgb> = {};
  for (const name of ["--bg", "--surface", "--elevated", "--text", "--muted", "--accent", "--on-accent", "--accent-edge", "--focus"]) {
    const rgb = tokens[name] === undefined ? null : channels(tokens[name]);
    if (rgb) colors[name] = rgb;
    else problems.push(`${where}: ${name} is ${tokens[name] ?? "not set"}, not a six-digit hex color`);
  }
  if (problems.length > 0) return problems;

  const pairs: [string, string, number][] = [];
  for (const background of ["--bg", "--surface", "--elevated"]) {
    pairs.push(["--text", background, TEXT], ["--muted", background, TEXT]);
    pairs.push(["--accent-edge", background, NON_TEXT]);
  }
  pairs.push(["--on-accent", "--accent", TEXT]);
  pairs.push(["--focus", "--bg", NON_TEXT], ["--focus", "--surface", NON_TEXT]);

  for (const [foreground, background, minimum] of pairs) {
    const ratio = contrast(colors[foreground], colors[background]);
    if (ratio < minimum) {
      problems.push(`${where}: ${foreground} on ${background} is ${ratio.toFixed(2)}:1, needs ${minimum}:1`);
    }
  }

  // Text on an accent tint, the way a playing pad or clip draws it.
  const strength = tokens["--tint-strength"];
  if (!/^\d+(\.\d+)?%$/.test(strength ?? "")) {
    problems.push(`${where}: --tint-strength is ${strength ?? "not set"}, not a percentage`);
  } else {
    const ratio = contrast(colors["--text"], tint(colors["--accent"], strength, colors["--surface"]));
    if (ratio < TEXT) {
      problems.push(`${where}: --text on the accent tint is ${ratio.toFixed(2)}:1, needs ${TEXT}:1`);
    }
  }
  return problems;
}

/**
 * Everything wrong with the palettes in this stylesheet: contrast in every theme state,
 * following the system giving the same colors as choosing the theme, and every palette having
 * colors of its own. An empty list means they all pass.
 */
export function paletteProblems(css: string): string[] {
  const problems: string[] = [];
  for (const { id: palette } of PALETTES) {
    for (const { theme, system, scheme } of STATES) {
      problems.push(...contrastProblems(css, { palette, theme, system }, scheme));
    }

    for (const scheme of ["light", "dark"] as const) {
      const other = scheme === "light" ? "dark" : "light";
      const following = tokensFor(css, { palette, theme: "system", system: scheme });
      const chosen = tokensFor(css, { palette, theme: scheme, system: other });
      if (JSON.stringify(following) !== JSON.stringify(chosen)) {
        problems.push(`${palette}: the ${scheme} colors differ between following the system and choosing ${scheme}`);
      }
      if (palette !== DEFAULT_PALETTE) {
        const own = tokensFor(css, { palette, theme: scheme, system: scheme });
        const rhodonite = tokensFor(css, { palette: DEFAULT_PALETTE, theme: scheme, system: scheme });
        if (JSON.stringify(own) === JSON.stringify(rhodonite)) {
          problems.push(`${palette}: has no ${scheme} colors of its own`);
        }
      }
    }
  }
  return problems;
}

/**
 * Everything wrong with Rhodonite's code colors (`CODE_COLORS`) against this stylesheet: every
 * syntax color at 4.5:1 on each surface code sits on (the background, the current line and a
 * selected row, menus), and every terminal color at 4.5:1 on the background, except the
 * background shades. Takes the colors so a test can feed it broken ones. An empty list means
 * they all pass.
 */
export function codeColorProblems(css: string, codeColors: typeof CODE_COLORS = CODE_COLORS): string[] {
  const problems: string[] = [];
  for (const scheme of ["dark", "light"] as const) {
    const tokens = tokensFor(css, { palette: DEFAULT_PALETTE, theme: scheme, system: scheme });
    const { syntax, terminal } = codeColors[scheme];
    const shades: readonly string[] = TERMINAL_BACKGROUND_SHADES[scheme];

    const pairs: [string, string, string][] = [];
    for (const [name, color] of Object.entries(syntax)) {
      for (const background of ["--bg", "--surface", "--elevated"]) pairs.push([`syntax ${name}`, color, background]);
    }
    for (const [name, color] of Object.entries(terminal)) {
      if (!shades.includes(name)) pairs.push([`terminal ${name}`, color, "--bg"]);
    }

    for (const [label, color, background] of pairs) {
      const foreground = channels(color);
      const surface = channels(tokens[background] ?? "");
      if (!foreground || !surface) {
        problems.push(`code colors, ${scheme}: ${foreground ? background : label} is not a six-digit hex color`);
        continue;
      }
      const ratio = contrast(foreground, surface);
      if (ratio < TEXT) {
        // Rounded down, so a failure never reads as the number it needed.
        const shown = (Math.floor(ratio * 100) / 100).toFixed(2);
        problems.push(`code colors, ${scheme}: ${label} on ${background} is ${shown}:1, needs ${TEXT}:1`);
      }
    }
  }
  return problems;
}

/**
 * The contrast checks only cover `--accent-edge` if lines use it, so a border, outline,
 * underline or shadow in the accent color has to name `--accent-edge`, not `--accent`. So does
 * `accent-color`: a checked box, radio button or slider shows a state, and light Rhodonite's
 * pink is far too faint for that on white. Takes the application's stylesheets and components;
 * returns `file:line: text` for each offender.
 */
export function accentLineProblems(files: { name: string; text: string }[]): string[] {
  const line = /(border[a-z-]*|outline[a-z-]*|text-decoration[a-z-]*|box-shadow|accent-color)\s*:[^;]*var\(--accent\)/;
  const problems: string[] = [];
  for (const { name, text } of files) {
    text.split("\n").forEach((content, index) => {
      if (line.test(content)) problems.push(`${name}:${index + 1}: ${content.trim()}`);
    });
  }
  return problems;
}

/**
 * app.html has to apply the saved theme and palette before the first paint, reading the same
 * keys the `Theme` store writes. Returns what's missing.
 */
export function prePaintProblems(html: string, storagePrefix: string): string[] {
  const keys = storageKeys(storagePrefix);
  return [keys.theme, keys.palette]
    .filter((key) => !html.includes(`localStorage.getItem("${key}")`))
    .map((key) => `app.html doesn't read ${key} before the first paint`);
}
