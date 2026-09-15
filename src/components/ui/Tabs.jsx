import { useLayoutEffect, useRef, useState } from "react";

/**
 * Tabs — horizontal tab bar with an animated sliding underline indicator.
 *
 * Purpose: state indication (which tab is active) + spatial consistency
 * (the indicator visibly travels to the new tab rather than teleporting).
 * Ingredients: transform only (translateX + scaleX on a 1px-wide bar —
 * never animates `width` directly, which would trigger layout), the
 * "moving on screen" ease-in-out curve, 220ms (dropdown/tab range). The
 * indicator is a crimson-to-navy gradient — the one recurring brand
 * "signature mark" reused across this design system (see the .ds-rule
 * hero divider in StyleGuide.jsx). Respects prefers-reduced-motion
 * globally (see index.css).
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
  const btnRefs = useRef({});
  const [indicator, setIndicator] = useState(null);

  useLayoutEffect(() => {
    const el = btnRefs.current[active];
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [active, tabs]);

  return (
    <div className={["relative flex items-center border-b border-stone-200 dark:border-stone-700", className].join(" ")} role="tablist">
      {tabs.map(t => {
        const isActive = t.key === active;
        const Icon = t.icon;
        return (
          <button
            key={t.key}
            ref={el => { btnRefs.current[t.key] = el; }}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(t.key)}
            className={[
              "font-sans inline-flex items-center gap-1.5 px-3.5 py-3 text-[11.5px] uppercase tracking-wide transition-colors duration-150 ease-out",
              isActive ? "text-primary font-extrabold" : "text-stone-500 [@media(hover:hover)]:hover:text-stone-900 font-bold",
            ].join(" ")}
          >
            {Icon && <Icon size={13} aria-hidden="true" />}
            {t.label}
          </button>
        );
      })}
      {indicator && (
        <div
          className="absolute bottom-0 left-0 h-[3px] w-px rounded-full bg-gradient-to-r from-primary to-secondary transition-transform duration-[220ms] ease-emphasized-in-out"
          style={{ transform: `translateX(${indicator.left}px) scaleX(${indicator.width})` }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
