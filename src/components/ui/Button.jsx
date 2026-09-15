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
// apple-design / ui-ux-pro-max "hover-vs-tap" rule. Shadows use the
// design-system-only --ds-shadow-* tokens (see index.css) — never the
// shared --shadow-* tokens ~114 legacy .fe-* styles still read — so
// this can be as bold as it wants without touching any live screen.
const VARIANT_CLASSES = {
  primary: "bg-primary text-white border border-transparent shadow-brand [@media(hover:hover)]:hover:bg-primary-dark [@media(hover:hover)]:hover:shadow-brand-lg [@media(hover:hover)]:hover:-translate-y-px",
  secondary: "bg-secondary text-white border border-transparent shadow-sm [@media(hover:hover)]:hover:opacity-90 [@media(hover:hover)]:hover:shadow-md [@media(hover:hover)]:hover:-translate-y-px",
  ghost: "bg-white text-stone-900 border border-stone-300 [@media(hover:hover)]:hover:bg-stone-100 [@media(hover:hover)]:hover:border-stone-900 dark:bg-stone-900 dark:text-stone-50 dark:border-stone-600",
  danger: "bg-error-700 text-white border border-transparent shadow-sm [@media(hover:hover)]:hover:bg-error-800 [@media(hover:hover)]:hover:shadow-md [@media(hover:hover)]:hover:-translate-y-px",
  success: "bg-success-600 text-white border border-transparent shadow-sm [@media(hover:hover)]:hover:bg-success-800 [@media(hover:hover)]:hover:shadow-md [@media(hover:hover)]:hover:-translate-y-px",
};

const SIZE_CLASSES = {
  sm: "text-[11px] px-3 py-1.5 gap-1.5 rounded-sm",
  md: "text-[12px] px-4 py-2.5 gap-2 rounded-sm",
  lg: "text-[13px] px-6 py-3 gap-2 rounded-md",
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
        "inline-flex items-center justify-center font-sans font-bold uppercase tracking-[0.02em]",
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
