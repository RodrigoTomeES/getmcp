/**
 * Inline script rendered by `RestoreChoice.astro` right after a
 * `[data-radio-panels][data-storage-key]` root (see `@/scripts/radio-panels`).
 * It runs while the page is parsed, so the saved choice is shown before the
 * first paint instead of flashing the default panel. Stale values (no radio
 * with that value) are ignored.
 *
 * Kept as one constant string so its content, and the CSP hash A7 adds for it,
 * stay byte-stable: Astro does not hash `is:inline` scripts on its own.
 */
export const RESTORE_CHOICE_SCRIPT =
  '(()=>{const root=document.currentScript.previousElementSibling;let v;try{v=localStorage.getItem(root.dataset.storageKey)}catch{}const r=v&&[...root.querySelectorAll("input[type=radio]")].find((i)=>i.value===v);if(!r)return;r.checked=true;for(const p of root.querySelectorAll("[data-panel]"))p.hidden=p.dataset.panel!==v;const s=root.querySelector("select");if(s)s.value=v})();';
