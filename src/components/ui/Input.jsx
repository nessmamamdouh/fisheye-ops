import { forwardRef } from "react";

/**
 * Input — text input. Matches the `.fe-input` focus/hover behavior
 * (border darkens on hover, brand-colored ring on focus).
 *
 * @param {boolean} [error=false] - renders an error (red) border
 * @param {React.ComponentType} [icon] - optional leading icon
 *
 * @example
 * <Input placeholder="Search employees…" icon={Search} />
 * <Input value={name} onChange={e => setName(e.target.value)} error={!name.trim()} />
 */
const Input = forwardRef(function Input({ error = false, icon: Icon, className = "", ...rest }, ref) {
  const field = (
    <input
      ref={ref}
      className={[
        "w-full font-sans text-sm rounded-sm border bg-white px-3 py-2 outline-none transition-colors duration-150",
        "placeholder:text-gray-400 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500",
        error
          ? "border-error-600 focus:border-error-600 focus:ring-2 focus:ring-error-100"
          : "border-gray-200 hover:border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary-pale dark:border-gray-600",
        Icon ? "pl-8" : "",
        className,
      ].join(" ")}
      {...rest}
    />
  );

  if (!Icon) return field;
  return (
    <div className="relative">
      <Icon size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" aria-hidden="true" />
      {field}
    </div>
  );
});

export default Input;
