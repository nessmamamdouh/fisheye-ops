import { useEffect } from "react";
import { X } from "lucide-react";

/**
 * Modal — centered dialog with backdrop blur, matching `.fe-overlay` /
 * `.fe-modal-box` (spring-in animation, blurred backdrop).
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
      className="fe-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className={[
          "fe-modal-box w-full rounded-lg bg-white shadow-xl dark:bg-gray-800",
          SIZE_CLASSES[size] || SIZE_CLASSES.md,
        ].join(" ")}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="font-sans font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
            <button
              onClick={onClose}
              aria-label="Close"
              className="rounded-sm p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
            >
              <X size={16} />
            </button>
          </div>
        )}
        <div className="px-5 py-4 max-h-[70vh] overflow-y-auto">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-gray-100 dark:border-gray-700">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
