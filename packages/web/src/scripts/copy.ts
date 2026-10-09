/**
 * Delegated handler for copy buttons rendered as static HTML.
 *
 * Attribute contract:
 * - `button[data-copy="text"]` copies its own attribute value when non-empty
 *   (short strings that other scripts may update).
 * - `button[data-copy]` with an empty value copies the `textContent` of the
 *   first `[data-copy-text]:not([hidden])` inside `button.closest("[data-copy-root]")`.
 *
 * Feedback: the button gets `data-copied` for 2 s (style it with Tailwind
 * `group-data-copied:` variants; no markup is swapped) and one shared polite
 * live region announces "Copied to clipboard", cleared by the same timer.
 *
 * Import it from the components/pages that render copy buttons, not globally.
 * Every copy button on the site is static HTML handled here (no React island
 * renders one).
 */

const RESET_MS = 2000;
const MESSAGE = "Copied to clipboard";

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

const region = document.createElement("p");
region.className = "sr-only";
region.setAttribute("aria-live", "polite");
document.body.append(region);

const timers = new WeakMap<HTMLButtonElement, ReturnType<typeof setTimeout>>();

document.addEventListener("click", (event) => {
  const button = (event.target as Element | null)?.closest<HTMLButtonElement>("button[data-copy]");
  if (!button) return;

  const text =
    button.dataset.copy ||
    button.closest("[data-copy-root]")?.querySelector("[data-copy-text]:not([hidden])")
      ?.textContent ||
    "";
  void copyText(text);

  clearTimeout(timers.get(button));
  button.dataset.copied = "";
  region.textContent = MESSAGE;
  timers.set(
    button,
    setTimeout(() => {
      delete button.dataset.copied;
      region.textContent = "";
    }, RESET_MS),
  );
});
