import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Select — native <select>, styled to match Input's border/focus behavior.
 * Uses a native element on purpose (not a custom dropdown) so it keeps free
 * keyboard/accessibility/mobile support. For lookup fields with many
 * options (employee, client, department), ERP guidance recommends a
 * searchable type-ahead instead — this stays a plain native select for
 * short, fixed option lists (status, type, etc).
 *
 * @param {{value: string, label: string}[]} [options] - convenience prop; alternatively pass <option> children directly
 * @param {boolean} [error=false]
 *
 * @example
 * <Select value={status} onChange={e => setStatus(e.target.value)}
 *   options={[{value:"active",label:"Active"},{value:"archived",label:"Archived"}]} />
 */
const Select = forwardRef(function Select({ error = false, options, className = "", children, ...rest }, ref) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={[
          "w-full appearance-none font-sans text-sm rounded-sm border bg-white px-3 py-2 pr-8 outline-none transition-colors duration-150 ease-out cursor-pointer",
          "dark:bg-stone-900 dark:text-stone-50",
          error
            ? "border-error-600 focus:border-error-600 focus:ring-2 focus:ring-error-100"
            : "border-stone-200 [@media(hover:hover)]:hover:border-stone-400 focus:border-primary focus:ring-2 focus:ring-primary-pale dark:border-stone-600",
          className,
        ].join(" ")}
        {...rest}
      >
        {options ? options.map(o => <option key={o.value} value={o.value}>{o.label}</option>) : children}
      </select>
      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" aria-hidden="true" />
    </div>
  );
});

export default Select;
