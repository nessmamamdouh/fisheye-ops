/**
 * Card — Fisheye Ops design system ("Refined Editorial Enterprise").
 *
 * A bordered, shadowed surface. Matches the existing `.fe-card` look
 * (see index.css) but as a composable component with header/footer slots.
 *
 * @param {boolean} [interactive=false] - adds hover lift + pointer cursor (for clickable cards)
 * @param {React.ReactNode} [header] - optional header content (e.g. a title + action button row)
 * @param {React.ReactNode} [footer] - optional footer content, separated by a top border
 * @param {string} [padding="p-4"] - Tailwind padding class for the body
 *
 * @example
 * <Card header={<h3 className="font-semibold">Client Health</h3>}>
 *   <p>92% healthy</p>
 * </Card>
 * <Card interactive onClick={openClient}>...</Card>
 */
export default function Card({
  interactive = false,
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
        "bg-white border border-stone-200 rounded-lg shadow-sm",
        "dark:bg-stone-900 dark:border-stone-700",
        interactive
          ? "cursor-pointer transition-[box-shadow,transform] duration-200 ease-out [@media(hover:hover)]:hover:shadow-md [@media(hover:hover)]:hover:-translate-y-px [@media(hover:hover)]:hover:border-stone-400 dark:hover:border-stone-600"
          : "",
        className,
      ].join(" ")}
      {...rest}
    >
      {header && (
        <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-700">{header}</div>
      )}
      <div className={padding}>{children}</div>
      {footer && (
        <div className="px-4 py-3 border-t border-stone-100 dark:border-stone-700">{footer}</div>
      )}
    </div>
  );
}
