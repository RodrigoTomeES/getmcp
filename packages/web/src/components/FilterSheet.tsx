"use client";

import { useEffect, useCallback, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

type FilterSheetProps = {
  open: boolean;
  onClose: () => void;
  onClearAll: () => void;
  resultCount: number;
  children: ReactNode;
};

export function FilterSheet({
  open,
  onClose,
  onClearAll,
  resultCount,
  children,
}: FilterSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      previousFocus.current = document.activeElement as HTMLElement | null;
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleEscape);
      // Focus the sheet for screen readers
      sheetRef.current?.focus();
    } else {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscape);
      previousFocus.current?.focus();
    }

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, handleEscape]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        tabIndex={-1}
        className={`fixed bottom-0 inset-x-0 z-50 bg-surface rounded-t-2xl max-h-[85vh] flex flex-col transition-transform duration-300 ease-out outline-none ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
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
    </>
  );
}
