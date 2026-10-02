<!--
  System, Light or Dark. Styled with the palette's tokens; spacing and radii come from the
  application's own tokens when it has them.
-->
<script>
  import { THEMES } from "./palettes.js";

  /** @type {{ theme: import("./theme.svelte.js").Theme, label?: string }} */
  let { theme, label = "Theme" } = $props();
</script>

<div class="switcher" role="radiogroup" aria-label={label}>
  {#each THEMES as option (option.value)}
    <button
      type="button"
      role="radio"
      aria-checked={theme.preference === option.value}
      onclick={() => theme.set(option.value)}
    >
      {option.label}
    </button>
  {/each}
</div>

<style>
  .switcher {
    display: inline-flex;
    padding: 2px;
    gap: 2px;
    background: var(--elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius-md, 10px);
  }

  button {
    padding: var(--space-1, 4px) var(--space-3, 12px);
    border: 0;
    border-radius: var(--radius-sm, 6px);
    background: transparent;
    color: var(--muted);
    font: inherit;
    transition:
      background var(--duration, 120ms) var(--ease, ease),
      color var(--duration, 120ms) var(--ease, ease);
  }

  button:hover {
    color: var(--text);
  }

  button[aria-checked="true"] {
    background: var(--accent);
    color: var(--on-accent);
    /* The fill alone is too faint against light backgrounds to show which is chosen. */
    box-shadow: inset 0 0 0 1px var(--accent-edge);
  }
</style>
