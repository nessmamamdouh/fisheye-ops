import { useEffect } from "react";
import { X } from "lucide-react";

/**
 * Modal — centered dialog with a translucent, blurred backdrop (apple-design
 * "materials" — the scrim separates the modal task from the page behind it)
 * and a crimson-to-navy signature bar across the top. Entrance:
 * scale(0.96)+opacity -> scale(1)+opacity over 200ms on the "emphasized"
 * strong ease-out curve (see .ds-modal-box / .ds-overlay in index.css) —
 * respects prefers-reduced-motion globally (see index.css).
 *
 * @param {boolean} open
 * @param {() => void} onClose - called on backdrop click, Escape key, or the × button
 * @param {string} [title]
 * @param {"sm"|"md"|"lg"|"xl"} [size="md"]
 * @param {React.ReactNode} [footer] - typically a row of Buttons
 *
 * @example
 * <Modal open={showConfirm} onClose={() => setShowConfirm(false)} title="Delete client?"
 *   footer={<><Button variant="ghost" onClick={close}>Cancel</Button><Button variant="danger" onClick={confirm}>Delete</Button></>}>
 *   This can't be undone.
 * </Modal>
 */
const SIZE_CLASSES = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };

export default function Modal({ open, onClose, title, size = "md", footer, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = e => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="ds-overlay fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-[2px] p-4"
      onClick={onClose}
    >
      <div
        className={[
          "ds-modal-box ds-scope w-full overflow-hidden rounded-lg bg-white shadow-xl dark:bg-stone-900",
          SIZE_CLASSES[size] || SIZE_CLASSES.md,
        ].join(" ")}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={e => e.stopPropagation()}
      >
        <div className="h-1 bg-gradient-to-r from-primary to-secondary" aria-hidden="true" />
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 dark:border-stone-700">
            <h3 className="font-serif font-semibold text-stone-900 dark:text-stone-50">{title}</h3>
            <button
              onClick={onClose}
              aria-label="Close"
              className="appearance-none border-none bg-transparent cursor-pointer rounded-sm p-1 text-stone-400 transition-colors duration-150 ease-out hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-stone-700"
            >
              <X size={16} />
            </button>
          </div>
        )}
        <div className="px-5 py-4 max-h-[70vh] overflow-y-auto font-sans">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-stone-100 dark:border-stone-700">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
