/**
 * Copy buttons for `CodeBlock`s rendered as static HTML (outside React
 * islands, e.g. on /docs and /guides). Hydrated islands handle their own clicks,
 * so buttons inside an `<astro-island>` are ignored here.
 */

const CHECK_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check w-4 h-4 text-success" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>';

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Fallback for environments where the Clipboard API is unavailable.
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
    } catch {
      // Nothing we can do — silently fail
    }
    document.body.removeChild(textarea);
  }
}

const timers = new WeakMap<HTMLButtonElement, ReturnType<typeof setTimeout>>();
const originals = new WeakMap<HTMLButtonElement, string>();

document.addEventListener("click", (event) => {
  const button = (event.target as Element | null)?.closest<HTMLButtonElement>(
    "button[data-code-copy]",
  );
  if (!button || button.closest("astro-island")) return;

  const code = button.closest(".rounded-lg")?.querySelector("pre code")?.textContent ?? "";
  void copyText(code);

  if (!originals.has(button)) originals.set(button, button.innerHTML);
  clearTimeout(timers.get(button));
  button.innerHTML = CHECK_ICON;
  button.setAttribute("aria-label", "Copied!");
  timers.set(
    button,
    setTimeout(() => {
      button.innerHTML = originals.get(button) ?? "";
      button.setAttribute("aria-label", "Copy code");
    }, 2000),
  );
});
