/**
 * Card — Fisheye Ops design system ("Refined Editorial Enterprise").
 *
 * A bordered, shadowed surface. Matches the existing `.fe-card` look
 * (see index.css) but as a composable component with header/footer slots.
 *
 * @param {boolean} [interactive=false] - adds hover lift + pointer cursor (for clickable cards)
 * @param {"primary"|"secondary"} [accent] - adds a 4px colored left edge for a flagged/highlighted card
 * @param {React.ReactNode} [header] - optional header content. A bare `<h3>` inside is auto-styled
 *   (Piazzolla serif, semibold, ink) — callers don't need to restate those classes.
 * @param {React.ReactNode} [footer] - optional footer content, separated by a top border
 * @param {string} [padding="p-4"] - Tailwind padding class for the body
 *
 * @example
 * <Card header={<h3>Client Health</h3>}>
 *   <p>92% healthy</p>
 * </Card>
 * <Card interactive onClick={openClient}>...</Card>
 * <Card accent="primary" header={<h3>Flagged</h3>}>Needs review.</Card>
 */
const ACCENT_CLASSES = {
  primary: "border-l-4 border-l-primary",
  secondary: "border-l-4 border-l-secondary",
};

export default function Card({
  interactive = false,
  accent,
  header,
  footer,
  padding = "p-4",
  className = "",
  children,
  ...rest
}) {
  return (
    <div
      className={[
        "ds-scope bg-white border border-stone-200 rounded-lg shadow-sm overflow-hidden",
        "dark:bg-stone-900 dark:border-stone-700",
        accent ? ACCENT_CLASSES[accent] : "",
        interactive
          ? "cursor-pointer transition-[box-shadow,transform] duration-200 ease-out [@media(hover:hover)]:hover:shadow-md [@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:hover)]:hover:border-stone-400 dark:hover:border-stone-600"
          : "",
        className,
      ].join(" ")}
      {...rest}
    >
      {header && (
        <div className="px-4 py-3 border-b border-stone-100 bg-stone-50/60 [&_h3]:font-serif [&_h3]:font-semibold [&_h3]:text-[14px] [&_h3]:text-stone-900 dark:border-stone-700 dark:bg-transparent">
          {header}
        </div>
      )}
      <div className={padding}>{children}</div>
      {footer && (
        <div className="px-4 py-3 border-t border-stone-100 dark:border-stone-700">{footer}</div>
      )}
    </div>
  );
}
