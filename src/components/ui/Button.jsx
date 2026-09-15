import { forwardRef } from "react";

/**
 * Button — Fisheye Ops design system ("Refined Editorial Enterprise").
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
// hover: gated to real pointers (`[@media(hover:hover)]:`) so a tap on
// touch doesn't leave a phantom hover state stuck on the button — see the
// apple-design / ui-ux-pro-max "hover-vs-tap" rule.
const VARIANT_CLASSES = {
  primary: "bg-primary text-white border border-transparent [@media(hover:hover)]:hover:bg-primary-dark [@media(hover:hover)]:hover:shadow-brand",
  secondary: "bg-secondary text-white border border-transparent [@media(hover:hover)]:hover:opacity-90",
  ghost: "bg-white text-stone-900 border border-stone-200 [@media(hover:hover)]:hover:bg-stone-100 [@media(hover:hover)]:hover:border-stone-400 dark:bg-stone-900 dark:text-stone-50 dark:border-stone-600",
  danger: "bg-error-700 text-white border border-transparent [@media(hover:hover)]:hover:bg-error-800",
  success: "bg-success-600 text-white border border-transparent [@media(hover:hover)]:hover:bg-success-800",
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
        // Press feedback fires on the transform only (never on color/bg),
        // 120ms — within the skill's 100-160ms button-press range. Colors
        // still use Tailwind's default transition for the hover state.
        "transition-[background-color,box-shadow,transform] duration-150 ease-out whitespace-nowrap select-none",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
        "disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] active:duration-[120ms]",
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
