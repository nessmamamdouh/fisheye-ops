/**
 * Badge — small status/label pill. Matches the `.fe-pill` look used across
 * the app for workflow status, client health, and PO/payroll flags.
 * Always pairs color with a text label (and optionally an icon/dot) —
 * never color alone, per the ERP accessibility rule.
 *
 * @param {"stone"|"success"|"warning"|"error"|"info"|"primary"} [color="stone"]
 * @param {React.ComponentType} [icon] - optional leading icon
 * @param {boolean} [dot=false] - render a small status dot instead of an icon
 *
 * @example
 * <Badge color="success">Healthy</Badge>
 * <Badge color="error" dot>Critical</Badge>
 */
const COLOR_CLASSES = {
  stone: "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-200",
  success: "bg-success-100 text-success-800",
  warning: "bg-warning-100 text-warning-800",
  error: "bg-error-100 text-error-800",
  info: "bg-info-100 text-info-800",
  primary: "bg-primary-pale text-primary",
};

const DOT_CLASSES = {
  stone: "bg-stone-400",
  success: "bg-success-600",
  warning: "bg-warning-600",
  error: "bg-error-600",
  info: "bg-info-600",
  primary: "bg-primary",
};

export default function Badge({ color = "stone", icon: Icon, dot = false, className = "", children }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-tight whitespace-nowrap font-sans",
        COLOR_CLASSES[color] || COLOR_CLASSES.stone,
        className,
      ].join(" ")}
    >
      {dot && <span className={["h-1.5 w-1.5 rounded-full", DOT_CLASSES[color]].join(" ")} aria-hidden="true" />}
      {Icon && <Icon size={11} aria-hidden="true" />}
      {children}
    </span>
  );
}
