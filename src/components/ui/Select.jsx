import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Select — native <select>, styled to match Input's border/focus behavior.
 * Uses a native element on purpose (not a custom dropdown) so it keeps free
 * keyboard/accessibility/mobile support.
 *
 * @param {{value: string, label: string}[]} [options] - convenience prop; alternatively pass <option> children directly
 * @param {boolean} [error=false]
 *
 * @example
 * <Select value={client} onChange={e => setClient(e.target.value)}
 *   options={clients.map(c => ({ value: c.name, label: c.name }))} />
 */
const Select = forwardRef(function Select({ error = false, options, className = "", children, ...rest }, ref) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={[
          "w-full appearance-none font-sans text-sm rounded-sm border bg-white px-3 py-2 pr-8 outline-none transition-colors duration-150 cursor-pointer",
          "dark:bg-gray-800 dark:text-gray-100",
          error
            ? "border-error-600 focus:border-error-600 focus:ring-2 focus:ring-error-100"
            : "border-gray-200 hover:border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary-pale dark:border-gray-600",
          className,
        ].join(" ")}
        {...rest}
      >
        {options ? options.map(o => <option key={o.value} value={o.value}>{o.label}</option>) : children}
      </select>
      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" aria-hidden="true" />
    </div>
  );
});

export default Select;
