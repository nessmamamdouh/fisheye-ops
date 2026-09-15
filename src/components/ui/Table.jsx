/**
 * Table — a set of thin wrapper components (not a data-grid) that apply the
 * app's existing table look (`.fe-table`: uppercase muted headers, row
 * hover, staggered entrance animation, monospace numeric columns) so any
 * screen's <table> markup gets it for free.
 *
 * @example
 * <Table.Root>
 *   <Table.Head>
 *     <tr><Table.Th>Name</Table.Th><Table.Th align="right">Salary</Table.Th></tr>
 *   </Table.Head>
 *   <tbody>
 *     {rows.map(r => (
 *       <tr key={r.id}>
 *         <Table.Td>{r.name}</Table.Td>
 *         <Table.Td align="right" numeric>{r.salary}</Table.Td>
 *       </tr>
 *     ))}
 *   </tbody>
 * </Table.Root>
 */
function Root({ className = "", children }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className={["fe-table w-full text-sm", className].join(" ")}>{children}</table>
    </div>
  );
}

function Head({ children }) {
  return <thead className="bg-gray-50 dark:bg-gray-800">{children}</thead>;
}

function Th({ align = "left", className = "", children }) {
  return (
    <th
      className={[
        "px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-400",
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
        "border-b border-gray-100 px-3 py-2.5 dark:border-gray-700",
        align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left",
        numeric ? "fe-num font-mono tabular-nums" : "",
        className,
      ].join(" ")}
    >
      {children}
    </td>
  );
}

const Table = { Root, Head, Th, Td };
export default Table;
