# Palettes

The color palettes in [Itrium](https://itrium.id)'s free applications,
[Honk](https://github.com/itriumid/honk) and [Hindsight](https://github.com/itriumid/hindsight),
with the Svelte pickers that switch them and the contrast check every palette has to pass.

- **Rhodonite**, Itrium's own: graphite with pink running through it. The default.
- **Catppuccin Mocha, Macchiato and Frappé**, adapted from [Catppuccin](https://catppuccin.com),
  each paired with Catppuccin Latte in light mode.

Every palette has a light and a dark version. The theme (System, Light or Dark) picks between
them, and follows the system unless someone chooses otherwise.

## Usable, not just pretty

Every palette meets level AA of the Web Content Accessibility Guidelines in every theme state:
4.5:1 for text and muted text on every surface, for text on the accent, and for text on an
accent tint; 3:1 for the focus outline and for accent lines that show a state. Four things make
sure that holds where people actually see it:

1. **A failing palette can't be published.** `pnpm test` works out each palette in every theme
   state the way the browser's cascade would and checks every pairing. It's a required check on
   every pull request, and the release workflow runs it again before publishing. The checker
   has tests of its own, with deliberately broken palettes, so it can't quietly pass everything.
2. **Each application checks the colors as it uses them.** The checker is part of the package
   (`@itrium/palettes/check`). Applications run it against this stylesheet plus their own, check
   that every accent line in their components uses `--accent-edge`, and check that the saved
   choice is applied before the first paint.
3. **People look at it.** Every pull request screenshots `preview/`, every palette in light and
   dark, as an artifact on the run.
4. **What's installed is what was tested.** Applications pin an exact version, so an update is a
   pull request their own checks run on, and every version on npm is published from this
   repository's release workflow with a provenance attestation.

## Using it

```sh
pnpm add @itrium/palettes
```

Import the stylesheet before your own, so your own can build on its tokens:

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import "@itrium/palettes/palettes.css";
  import "../app.css";
  import { onMount } from "svelte";
  import { theme } from "$lib/theme";

  let { children } = $props();
  onMount(() => theme.apply());
</script>
```

One `Theme` per application, saved under its own prefix:

```ts
// src/lib/theme.ts
import { Theme } from "@itrium/palettes";

export const theme = new Theme({
  storagePrefix: "honk", // honk:theme and honk:palette in localStorage
  onApply: (choice) => {
    // For what the stylesheet can't reach, like a native title bar. null follows the system.
  },
});
```

The pickers take it as a property:

```svelte
<script lang="ts">
  import { PalettePicker, ThemeSwitcher } from "@itrium/palettes";
  import { theme } from "$lib/theme";
</script>

<PalettePicker {theme} />
<ThemeSwitcher {theme} />
```

So the window never flashes the default colors, `app.html` applies the saved choice before the
first paint. A palette the stylesheet doesn't know falls back to Rhodonite, so this never needs
to change when a palette is added:

```html
<script>
  try {
    const root = document.documentElement;
    const theme = localStorage.getItem("honk:theme");
    if (theme === "light" || theme === "dark") root.dataset.theme = theme;
    const palette = localStorage.getItem("honk:palette");
    if (palette && palette !== "rhodonite") root.dataset.palette = palette;
  } catch {}
</script>
```

And a test, run in Continuous Integration:

```js
// tests/palettes.test.mjs, run with `node --test`
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { STYLESHEET_URL, accentLineProblems, paletteProblems, prePaintProblems } from "@itrium/palettes/check";

test("every palette meets level AA as we use it", () => {
  const css = readFileSync(STYLESHEET_URL, "utf8") + readFileSync("src/app.css", "utf8");
  assert.deepEqual(paletteProblems(css), []);
});
```

`accentLineProblems` takes your stylesheets and components, and `prePaintProblems` takes
`app.html` and your prefix. Each returns a list of what's wrong, empty when everything passes.
In Node, import the palette list from `@itrium/palettes/palettes`; the main entry includes the
Svelte components, which only a bundler can load.

## The tokens

| Token | Use |
| --- | --- |
| `--bg` | The window's background |
| `--surface` | Cards, pads and rows on it |
| `--elevated` | Controls: buttons, menus, inputs |
| `--border` | Borders that don't show a state |
| `--text`, `--muted` | Text and secondary text |
| `--accent`, `--on-accent` | The one accent fill, and text on it |
| `--accent-edge` | The accent as a line: a border, outline, underline or `accent-color`. Light palettes deepen it so it reaches 3:1 |
| `--tint-strength` | How strongly the accent tints a surface with text on it: `color-mix(in srgb, var(--accent) var(--tint-strength), transparent)` over `--surface` |
| `--focus` | The focus outline |

**Fills use the accent; lines use the accent edge.** The accent keeps one meaning everywhere:
what's playing, what has focus, the primary action.

Rhodonite:

| Token | Dark | Light |
| --- | --- | --- |
| Background | `#2B2B2B` | `#FAFAFA` |
| Surface | `#343434` | `#FFFFFF` |
| Elevated | `#3E3E3E` | `#F1F1F1` |
| Border | `#474747` | `#E4E4E4` |
| Text | `#F2F2F2` | `#2B2B2B` |
| Muted | `#AAAAAA` | `#6B6B6B` |
| Accent | `#FEBFCA` | `#FEBFCA` |
| Accent edge | `#FEBFCA` | `#C46475` |
| Focus | `#FEBFCA` | `#2B2B2B` |

The Catppuccin palettes map Catppuccin's colors onto the same tokens: background on `base`,
surfaces on `mantle`, elevated controls on `surface0`, borders on `surface1`, muted text on
`subtext1`, and `mauve` as the accent, the default in Catppuccin's own ports. Text on the accent
is `crust` in the dark flavors and Latte's `base` in light mode.

## Adding a palette

1. Add it to `PALETTES` in `src/lib/palettes.ts`.
2. Add its colors to `src/lib/palettes.css`, light and dark, under `data-palette="<id>"`.
3. Run `pnpm test`. A popular palette is adapted until it passes, not shipped as it comes, and
   the adaptations are written down next to its colors.
4. Credit its source here.

## Development

Setting up, pull requests and releasing are in [`CONTRIBUTING.md`](CONTRIBUTING.md).

## License

[MIT](LICENSE). Catppuccin's colors are also MIT-licensed, by the
[Catppuccin](https://github.com/catppuccin/catppuccin) organization.
