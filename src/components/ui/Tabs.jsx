/**
 * Tabs — horizontal tab bar. Matches `.fe-tab` (brand-colored underline for
 * the active tab, hover color shift).
 *
 * @param {{key: string, label: string, icon?: React.ComponentType}[]} tabs
 * @param {string} active - the active tab's key
 * @param {(key: string) => void} onChange
 *
 * @example
 * <Tabs tabs={[{key:"overview",label:"Overview"},{key:"projects",label:"Projects"}]}
 *   active={detailTab} onChange={setDetailTab} />
 */
export default function Tabs({ tabs, active, onChange, className = "" }) {
  return (
    <div className={["flex items-center gap-1 border-b border-gray-200 dark:border-gray-700", className].join(" ")} role="tablist">
      {tabs.map(t => {
        const isActive = t.key === active;
        const Icon = t.icon;
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(t.key)}
            className={[
              "fe-tab inline-flex items-center gap-1.5 border-b-2 px-1 py-2.5 mx-2 first:ml-0",
              isActive
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-gray-500 hover:text-primary dark:text-gray-400",
            ].join(" ")}
          >
            {Icon && <Icon size={13} aria-hidden="true" />}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
