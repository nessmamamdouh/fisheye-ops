import { forwardRef } from "react";

/**
 * Button — Fisheye Ops design system.
 *
 * @param {"primary"|"secondary"|"ghost"|"danger"|"success"} [variant="primary"]
 * @param {"sm"|"md"|"lg"} [size="md"]
 * @param {React.ComponentType} [icon] - optional icon component (e.g. from lucide-react), rendered before children
 * @param {boolean} [loading=false] - shows a spinner and disables the button
 * @param {boolean} [fullWidth=false]
 *
 * @example
 * <Button variant="primary" onClick={save}>Save</Button>
 * <Button variant="danger" size="sm" icon={Trash2}>Delete</Button>
 * <Button variant="ghost" loading>Saving…</Button>
 */
const VARIANT_CLASSES = {
  primary: "bg-primary text-white border border-transparent hover:bg-primary-dark hover:shadow-brand",
  secondary: "bg-secondary text-white border border-transparent hover:opacity-90",
  ghost: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700",
  danger: "bg-error-700 text-white border border-transparent hover:bg-error-800",
  success: "bg-success-600 text-white border border-transparent hover:bg-success-700",
};

const SIZE_CLASSES = {
  sm: "text-xs px-2.5 py-1.5 gap-1.5 rounded-sm",
  md: "text-[13px] px-3.5 py-2 gap-1.5 rounded-sm",
  lg: "text-sm px-5 py-2.5 gap-2 rounded-md",
};

const ICON_SIZE = { sm: 13, md: 15, lg: 17 };

const Button = forwardRef(function Button(
  {
    variant = "primary",
    size = "md",
    icon: Icon,
    loading = false,
    fullWidth = false,
    disabled = false,
    className = "",
    children,
    ...rest
  },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={[
        "inline-flex items-center justify-center font-sans font-semibold tracking-tight",
        "transition-colors duration-150 whitespace-nowrap select-none",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
        "disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]",
        VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary,
        SIZE_CLASSES[size] || SIZE_CLASSES.md,
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
      {...rest}
    >
      {loading ? (
        <span
          className="inline-block rounded-full border-2 border-current border-t-transparent animate-spin"
          style={{ width: ICON_SIZE[size], height: ICON_SIZE[size] }}
          aria-hidden="true"
        />
      ) : Icon ? (
        <Icon size={ICON_SIZE[size]} aria-hidden="true" />
      ) : null}
      {children}
    </button>
  );
});

export default Button;
