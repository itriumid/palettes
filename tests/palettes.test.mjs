// Runs against the built package (`pnpm test` builds first), so what's tested is what's
// published.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  STYLESHEET_URL,
  accentLineProblems,
  paletteProblems,
  prePaintProblems,
  tokensFor,
} from "../dist/check.js";
import { PALETTES } from "../dist/palettes.js";

const css = readFileSync(STYLESHEET_URL, "utf8");

test("every palette meets level AA in every theme state", () => {
  assert.deepEqual(paletteProblems(css), []);
});

test("every palette has a rule of its own in the stylesheet", () => {
  for (const { id } of PALETTES.slice(1)) {
    assert.ok(css.includes(`[data-palette="${id}"]`), `${id} has no rule`);
  }
});

test("an unknown palette falls back to Rhodonite", () => {
  for (const system of ["light", "dark"]) {
    assert.deepEqual(
      tokensFor(css, { palette: "something-else", theme: "system", system }),
      tokensFor(css, { palette: "rhodonite", theme: "system", system }),
    );
  }
});

// The checker has to fail what it should, or a broken checker passes everything.

test("the check catches text that's too faint", () => {
  const faint = `${css}\n:root[data-palette="catppuccin-mocha"] { --muted: #45475a; }`;
  const problems = paletteProblems(faint);
  assert.ok(problems.some((problem) => problem.includes("catppuccin-mocha") && problem.includes("--muted on --bg")), problems.join("\n"));
});

test("the check catches a tint too strong for the text on it", () => {
  const strong = `${css}\n:root[data-palette="catppuccin-frappe"] { --tint-strength: 90%; }`;
  assert.ok(paletteProblems(strong).some((problem) => problem.includes("catppuccin-frappe") && problem.includes("accent tint")));
});

test("the check catches light colors missing when the light theme is chosen", () => {
  const broken = css.replace(':root[data-palette^="catppuccin-"][data-theme="light"]', ":root.nowhere");
  assert.ok(paletteProblems(broken).some((problem) => problem.includes("differ between following the system and choosing light")));
});

test("the check catches a palette with no colors of its own", () => {
  const missing = css.replace(':root[data-palette="catppuccin-macchiato"]', ":root.nowhere");
  assert.ok(paletteProblems(missing).some((problem) => problem.includes("catppuccin-macchiato: has no dark colors of its own")));
});

test("accent lines and accent-color have to use --accent-edge", () => {
  const files = [
    { name: "Pad.svelte", text: ".pad {\n  border: 1px solid var(--accent);\n}" },
    { name: "Chip.svelte", text: ".chip { outline: 2px solid var(--accent-edge); background: var(--accent); }" },
    { name: "Form.svelte", text: "input {\n  accent-color: var(--accent);\n}\nselect { accent-color: var(--accent-edge); }" },
  ];
  assert.deepEqual(accentLineProblems(files), [
    "Pad.svelte:2: border: 1px solid var(--accent);",
    "Form.svelte:2: accent-color: var(--accent);",
  ]);
});

test("app.html has to read both keys before the first paint", () => {
  const html = 'localStorage.getItem("honk:theme"); localStorage.getItem("honk:palette");';
  assert.deepEqual(prePaintProblems(html, "honk"), []);
  assert.deepEqual(prePaintProblems(html, "hindsight"), [
    "app.html doesn't read hindsight:theme before the first paint",
    "app.html doesn't read hindsight:palette before the first paint",
  ]);
});
