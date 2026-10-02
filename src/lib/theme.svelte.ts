import {
  DEFAULT_PALETTE,
  isPaletteId,
  isThemePreference,
  storageKeys,
  type PaletteId,
  type ThemePreference,
} from "./palettes.js";

export interface ThemeOptions {
  /** Prefixes the `localStorage` keys, for example "honk" for `honk:theme` and `honk:palette`. */
  storagePrefix: string;
  /**
   * Called after the colors change, for what the stylesheet can't reach, like a native title
   * bar. `null` means follow the system.
   */
  onApply?: (theme: "light" | "dark" | null) => void;
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

/** The chosen theme and palette, saved per application and applied to the root element. */
export class Theme {
  preference = $state<ThemePreference>("system");
  palette = $state<PaletteId>(DEFAULT_PALETTE);

  #keys: { theme: string; palette: string };
  #onApply: ThemeOptions["onApply"];

  constructor({ storagePrefix, onApply }: ThemeOptions) {
    this.#keys = storageKeys(storagePrefix);
    this.#onApply = onApply;
    this.#load();
    // Windows of the same application share storage, so a change in one reaches the others.
    if (typeof window !== "undefined") {
      window.addEventListener("storage", (event) => {
        if (event.key !== this.#keys.theme && event.key !== this.#keys.palette) return;
        this.#load();
        this.apply();
      });
    }
  }

  #load() {
    const preference = read(this.#keys.theme);
    this.preference = isThemePreference(preference) ? preference : "system";
    const palette = read(this.#keys.palette);
    this.palette = isPaletteId(palette) ? palette : DEFAULT_PALETTE;
  }

  set(preference: ThemePreference) {
    this.preference = preference;
    write(this.#keys.theme, preference);
    this.apply();
  }

  setPalette(palette: PaletteId) {
    this.palette = palette;
    write(this.#keys.palette, palette);
    this.apply();
  }

  /** Puts the choices on the root element. Call once on mount, then after every change. */
  apply() {
    const root = document.documentElement;
    if (this.preference === "system") delete root.dataset.theme;
    else root.dataset.theme = this.preference;

    if (this.palette === DEFAULT_PALETTE) delete root.dataset.palette;
    else root.dataset.palette = this.palette;

    this.#onApply?.(this.preference === "system" ? null : this.preference);
  }
}
