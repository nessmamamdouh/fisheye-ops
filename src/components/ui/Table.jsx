/**
 * Table — a set of thin wrapper components (not a data-grid) that apply the
 * app's existing table look (`.fe-table`: bold ledger-line header, row
 * hover, monospace numeric columns) so any screen's <table> markup gets it
 * for free. Deliberately has NO entrance/stagger animation: a table an
 * operator opens dozens of times a day should never move for style (see
 * DESIGN_SYSTEM.md's animation gate) — only real interactions (row hover)
 * get motion.
 *
 * @example
 * <Table.Root>
 *   <Table.Head>
 *     <tr><Table.Th>Name</Table.Th><Table.Th align="right">Salary</Table.Th></tr>
 *   </Table.Head>
 *   <tbody>
 *     {rows.map(r => (
 *       <Table.Tr key={r.id}>
 *         <Table.Td>{r.name}</Table.Td>
 *         <Table.Td align="right" numeric>{r.salary}</Table.Td>
 *       </Table.Tr>
 *     ))}
 *   </tbody>
 * </Table.Root>
 */
function Root({ className = "", children }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-stone-200 shadow-sm dark:border-stone-700">
      <table className={["w-full text-sm font-sans", className].join(" ")}>{children}</table>
    </div>
  );
}

// A dark "masthead" header (not a soft tint) is the signature table move
// for this system -- a considered, premium-ledger feel instead of a
// default browser table -- with a thin brand-crimson rule underneath it.
function Head({ children }) {
  return <thead className="bg-stone-900 border-b-2 border-primary">{children}</thead>;
}

function Th({ align = "left", className = "", children }) {
  return (
    <th
      className={[
        "px-3 py-3 text-[10.5px] font-extrabold uppercase tracking-wider text-stone-300",
        align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left",
        className,
      ].join(" ")}
    >
      {children}
    </th>
  );
}

function Td({ align = "left", numeric = false, className = "", children }) {
  return (
    <td
      className={[
        "border-b border-stone-100 px-3 py-2.5 transition-colors duration-100 dark:border-stone-700",
        align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left",
        numeric ? "font-mono tabular-nums" : "",
        className,
      ].join(" ")}
    >
      {children}
    </td>
  );
}

// Optional row wrapper with the standard hover-gated fill baked in. Plain
// <tr> markup still works with Table.Td — this just saves callers from
// repeating the hover class on every table in the app.
function Tr({ className = "", children, ...rest }) {
  return (
    <tr className={["[@media(hover:hover)]:hover:bg-stone-50 transition-colors duration-100", className].join(" ")} {...rest}>
      {children}
    </tr>
  );
}

const Table = { Root, Head, Th, Td, Tr };
export default Table;
