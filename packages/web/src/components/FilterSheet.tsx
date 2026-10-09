import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

type FilterSheetProps = {
  open: boolean;
  onClose: () => void;
  onClearAll: () => void;
  resultCount: number;
  children: ReactNode;
};

/**
 * Mobile filters as a native modal `<dialog>`. `showModal()` makes the rest of
 * the page inert (focus trap), handles Esc and restores focus on close;
 * `closedby="any"` adds backdrop light dismiss. The native `close` event calls
 * `onClose`, so the parent's `open` state stays in sync.
 */
export function FilterSheet({
  open,
  onClose,
  onClearAll,
  resultCount,
  children,
}: FilterSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  // Light-dismiss fallback for browsers without `closedby` (Safari).
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || "closedBy" in HTMLDialogElement.prototype) return;

    const onClick = (event: MouseEvent) => {
      // Backdrop clicks target the dialog itself; ignore clicks on its content.
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const inside =
        rect.top <= event.clientY &&
        event.clientY <= rect.bottom &&
        rect.left <= event.clientX &&
        event.clientX <= rect.right;
      if (!inside) dialog.close();
    };

    dialog.addEventListener("click", onClick);
    return () => dialog.removeEventListener("click", onClick);
  }, []);

  return (
    <dialog
      ref={dialogRef}
      id="filter-sheet"
      closedby="any"
      aria-label="Filters"
      onClose={onClose}
      className="m-0 mt-auto w-full max-w-none max-h-[85dvh] p-0 bg-surface text-text rounded-t-2xl backdrop:bg-black/50"
    >
      <div className="relative flex flex-col max-h-[85dvh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-3 pb-2">
          <div className="absolute left-1/2 -translate-x-1/2 top-3">
            <div className="w-10 h-1 rounded-full bg-border" />
          </div>
          <p className="text-sm font-semibold text-text mt-3">Filters</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="mt-3 p-1 rounded-md text-text-secondary hover:text-text transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>

        {/* Sticky footer */}
        <div className="border-t border-border px-6 py-4 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-accent text-white rounded-lg py-2.5 text-sm font-medium transition-colors hover:bg-accent/90"
          >
            Show {resultCount} result{resultCount !== 1 ? "s" : ""}
          </button>
          <button
            type="button"
            onClick={onClearAll}
            className="border border-border text-text-secondary rounded-lg py-2.5 px-4 text-sm transition-colors hover:border-text-secondary hover:text-text"
          >
            Clear all
          </button>
        </div>
      </div>
    </dialog>
  );
}
