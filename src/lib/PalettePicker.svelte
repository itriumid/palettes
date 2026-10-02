<!--
  A menu of the palettes. Styled with the palette's tokens; spacing and radii come from the
  application's own tokens when it has them.
-->
<script>
  import { PALETTES, isPaletteId } from "./palettes.js";

  /** @type {{ theme: import("./theme.svelte.js").Theme, label?: string }} */
  let { theme, label = "Colors" } = $props();
</script>

<label class="palette">
  {label}
  <select
    value={theme.palette}
    onchange={(event) => {
      const value = event.currentTarget.value;
      if (isPaletteId(value)) theme.setPalette(value);
    }}
  >
    {#each PALETTES as palette (palette.id)}
      <option value={palette.id}>{palette.label}</option>
    {/each}
  </select>
</label>

<style>
  .palette {
    display: flex;
    align-items: center;
    gap: var(--space-2, 8px);
    color: var(--muted);
  }

  select {
    padding: var(--space-1, 4px) var(--space-2, 8px);
    background: var(--elevated);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm, 6px);
    font: inherit;
  }
</style>
