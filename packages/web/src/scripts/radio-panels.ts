/**
 * Native radio groups that switch pre-rendered panels (ConfigViewer,
 * PackageManagerCommand, CliShowcase).
 *
 * Attribute contract, per `[data-radio-panels]` root:
 * - `input[type=radio]` elements whose `value` matches a `[data-panel]`;
 *   an optional `<select>` with the same option values is kept in sync.
 * - Every `[data-panel]` except the selected one is `hidden`.
 * - `data-storage-key` (optional): the choice is saved to localStorage under
 *   that key. `RestoreChoice.astro` restores it before first paint, so this
 *   module never reads it.
 *
 * Radio `name`s must be unique per page (render one instance per page).
 * Radios and selects use `autocomplete="off"` so browser form restore cannot
 * fight the stored choice; init still syncs the panels from the checked radio.
 */

for (const root of document.querySelectorAll<HTMLElement>("[data-radio-panels]")) {
  const panels = [...root.querySelectorAll<HTMLElement>("[data-panel]")];
  const radios = [...root.querySelectorAll<HTMLInputElement>("input[type=radio]")];
  const select = root.querySelector("select");

  const show = (value: string | undefined): boolean => {
    if (!value || !panels.some((panel) => panel.dataset.panel === value)) return false;
    for (const panel of panels) panel.hidden = panel.dataset.panel !== value;
    for (const radio of radios) radio.checked = radio.value === value;
    if (select) select.value = value;
    return true;
  };

  show(radios.find((radio) => radio.checked)?.value);

  root.addEventListener("change", (event) => {
    const { value } = event.target as HTMLInputElement | HTMLSelectElement;
    const key = root.dataset.storageKey;
    if (!show(value) || !key) return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // localStorage unavailable
    }
  });
}
