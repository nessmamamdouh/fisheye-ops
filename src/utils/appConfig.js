// ═══════════════════════════════════════════════════════════════════════════════
// ⚙️ APP CONFIG — editable client list / colors / auto-classification rules
// Lets the Settings → Configuration page override what used to be hardcoded
// constants in App.jsx (CLIENTS_LIST, CLIENT_META, mapClient()).
// Persisted to localStorage + synced to Supabase (table: fisheye_app_data,
// key: 'fisheyeAppConfig_v1'), same pattern as fisheyeClients_v1 / fisheyePartners_v1.
// ═══════════════════════════════════════════════════════════════════════════════

export const CONFIG_KEY = "fisheyeAppConfig_v1";

export const DEFAULT_CLIENTS_LIST = ["Sela", "Channel Play", "Riva Engineering 2"];

export const DEFAULT_CLIENT_META = {
  // requiresPO: this client's billing/payroll only counts an employee as
  // billable once a PO number is on file (see FinanceModule + Action Center).
  // Kept on the client's own meta record so it survives a rename made from
  // the Configuration page instead of being tied to the literal word "Sela".
  "Sela":               { badge: "#bbf7d0", text: "#14532d", dot: "#16a34a", phone: "", requiresPO: true },
  "SPL":                { badge: "#e9d5ff", text: "#4c1d95", dot: "#7c3aed", phone: "" },
  "Channel Play":       { badge: "#bfdbfe", text: "#1e3a8a", dot: "#2563eb", phone: "" },
  "Riva Engineering 2": { badge: "#fecdd3", text: "#881337", dot: "#A02843", phone: "" },
  "Combuzz HR":         { badge: "#fed7aa", text: "#7c2d12", dot: "#ea580c", phone: "" },
  "Pentagram":          { badge: "#ccfbf1", text: "#134e4a", dot: "#0d9488", phone: "" },
  "ZATCA":              { badge: "#bbf7d0", text: "#14532d", dot: "#16a34a", phone: "" },
  "SETS":               { badge: "#bfdbfe", text: "#1e3a8a", dot: "#2563eb", phone: "" },
  "Riyadh Bank":        { badge: "#fecdd3", text: "#881337", dot: "#A02843", phone: "" },
  "Pintagram":          { badge: "#fef08a", text: "#713f12", dot: "#ca8a04", phone: "" },
  "Alsoudah":           { badge: "#a5f3fc", text: "#164e63", dot: "#0891b2", phone: "" },
  "Alpha":              { badge: "#e5e7eb", text: "#374151", dot: "#6b7280", phone: "" },
  "Esnad International":{ badge: "#fbcfe8", text: "#831843", dot: "#db2777", phone: "" },
  "Finara":             { badge: "#d9f99d", text: "#365314", dot: "#65a30d", phone: "" },
  "ZERENE":             { badge: "#bbf7d0", text: "#14532d", dot: "#15803d", phone: "" },
  "Haykala":            { badge: "#bfdbfe", text: "#1e3a8a", dot: "#1d4ed8", phone: "" },
  "AME":                { badge: "#fecdd3", text: "#881337", dot: "#be123c", phone: "" },
  "Elaraby":            { badge: "#fef08a", text: "#713f12", dot: "#a16207", phone: "" },
  "Emboard":            { badge: "#a5f3fc", text: "#164e63", dot: "#0e7490", phone: "" },
};

// Ordered, first match wins. The last rule MUST be matchType:"default".
export const DEFAULT_MAPPING_RULES = [
  { client: "Riva Engineering 2", matchType: "exact",    value: "CEO" },
  { client: "Channel Play",       matchType: "contains", value: "SILQFI" },
  { client: "SPL",                matchType: "contains", value: "SPL" },
  { client: "Combuzz HR",         matchType: "contains", value: "MAVERIC" },
  { client: "Combuzz HR",         matchType: "contains", value: "C5I" },
  { client: "Combuzz HR",         matchType: "contains", value: "INSPIRING MINDS" },
  { client: "Combuzz HR",         matchType: "contains", value: "SAUDI FRANSI" },
  { client: "Pentagram",           matchType: "contains", value: "PENTAGRAM" },
  { client: "ZATCA",               matchType: "contains", value: "ZATCA" },
  { client: "SETS",                matchType: "contains", value: "SETS" },
  { client: "Riyadh Bank",         matchType: "contains", value: "RIYADH BANK" },
  { client: "Pintagram",           matchType: "contains", value: "PINTAGRAM" },
  { client: "Alsoudah",            matchType: "contains", value: "ALSOUDAH" },
  { client: "Alpha",               matchType: "exact",    value: "ALPHA" },
  { client: "Esnad International", matchType: "contains", value: "ESNAD" },
  { client: "Finara",              matchType: "contains", value: "FINARA" },
  { client: "ZERENE",              matchType: "contains", value: "ZERENE" },
  { client: "Haykala",             matchType: "contains", value: "HAYKALA" },
  { client: "AME",                 matchType: "exact",    value: "AME" },
  { client: "Elaraby",             matchType: "contains", value: "ELARABY" },
  { client: "Emboard",             matchType: "contains", value: "EMBOARD" },
  { client: "Riva Engineerin",     matchType: "exact",    value: "WORKERS" },
  { client: "Sela",               matchType: "default",  value: "" },
];

// Small preset palette so a newly-added client always gets a legible badge
// (light background + readable text + matching dot) without a full color picker.
export const CLIENT_COLOR_PALETTE = [
  { badge: "#bbf7d0", text: "#14532d", dot: "#16a34a" }, // green
  { badge: "#bfdbfe", text: "#1e3a8a", dot: "#2563eb" }, // blue
  { badge: "#fecdd3", text: "#881337", dot: "#A02843" }, // crimson
  { badge: "#fed7aa", text: "#7c2d12", dot: "#ea580c" }, // orange
  { badge: "#e9d5ff", text: "#4c1d95", dot: "#7c3aed" }, // purple
  { badge: "#fef08a", text: "#713f12", dot: "#ca8a04" }, // amber
  { badge: "#a5f3fc", text: "#164e63", dot: "#0891b2" }, // cyan
  { badge: "#e5e7eb", text: "#374151", dot: "#6b7280" }, // gray
  { badge: "#fbcfe8", text: "#831843", dot: "#db2777" }, // pink
  { badge: "#d9f99d", text: "#365314", dot: "#65a30d" }, // lime
];

export function loadAppConfig() {
  try {
    const raw = JSON.parse(localStorage.getItem(CONFIG_KEY));
    return raw && typeof raw === "object" ? raw : null;
  } catch {
    return null;
  }
}

// Strips characters that are invisible or near-invisible in the Configuration
// UI but make a name fail every exact-match comparison elsewhere in the app
// (Arabic/Unicode combining diacritics, zero-width characters, stray control
// characters), then trims and collapses internal whitespace. This exists
// because a client name once picked up two stray Arabic kasra marks while
// being typed/edited (looked exactly like "Sela" on screen, i.e. "SELA" with
// invisible combining marks) and every part of the app that compared against
// the plain name silently stopped matching it. Call this on every keystroke
// in the Configuration name field, not just on save, so what's on screen is
// always what actually gets compared.
export function sanitizeClientName(name) {
  return String(name || "")
    .normalize("NFC")
    // Unicode combining marks (covers Arabic tashkeel like kasra/damma/fatha
    // U+064B-U+065F/U+0670 as well as Latin/other combining diacritics
    // U+0300-U+036F) and zero-width/invisible characters.
    .replace(/[̀-ًͯ-ٰٟ​-‏﻿]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Whether this client's billing only counts employees with a PO number as
// billable (see ProfitPerClientTab in FinanceModule and the Payroll tab in
// the Action Center). Stored on the client's own meta record so a rename via
// Configuration carries the flag with it automatically. Configs saved before
// this flag existed won't have it recorded on any client yet, so fall back to
// the one client this rule has always applied to.
export function clientRequiresPO(clientName) {
  const meta = getEffectiveClientMeta();
  const m = meta[clientName];
  if (m && typeof m.requiresPO === "boolean") return m.requiresPO;
  return clientName === "Sela";
}

export function getEffectiveClientMeta() {
  const cfg = loadAppConfig();
  const saved = (cfg && cfg.clientMeta && typeof cfg.clientMeta === "object") ? cfg.clientMeta : {};
  const removed = new Set((cfg && Array.isArray(cfg.removedClients)) ? cfg.removedClients : []);
  // Defaults first so a client added later in code (e.g. a newly-registered
  // real client) always has a meta record, even on accounts whose saved
  // config predates it. A coded default the user explicitly deleted or
  // renamed away from (tracked in cfg.removedClients -- see doSave in
  // App.jsx) is dropped here BEFORE the spread, so it can't silently
  // resurrect itself on the next load/save the way a plain object spread
  // would (a spread can only add/override keys, never remove one). Saved
  // entries are spread last so anything the user actually customized here
  // (color, phone, requiresPO, a rename) still wins.
  const base = { ...DEFAULT_CLIENT_META };
  removed.forEach(name => { delete base[name]; });
  return { ...base, ...saved };
}

export function getEffectiveClientsList() {
  const cfg = loadAppConfig();
  const saved = (cfg && Array.isArray(cfg.clientsList)) ? cfg.clientsList : [];
  const removed = new Set((cfg && Array.isArray(cfg.removedClients)) ? cfg.removedClients : []);
  const meta = getEffectiveClientMeta();
  // Union of: whatever the user's saved list has, the coded base list, and
  // every client that has a meta record (coded default OR saved custom).
  // Deriving from clientMeta keys too means a client can never again "fall
  // out" of the selectable roster just because clientsList itself is stale —
  // this is what was hiding newly-registered clients from the sidebar list
  // and from the CSV-import "assign client" popup. A name the user has
  // explicitly deleted or renamed away from (cfg.removedClients) is skipped
  // here too, otherwise a coded default name could never actually be
  // removed from the Configuration page -- it would just get merged back in
  // on the very next save/reload.
  const merged = [...saved];
  DEFAULT_CLIENTS_LIST.forEach(c => { if (!removed.has(c) && !merged.includes(c)) merged.push(c); });
  Object.keys(meta).forEach(c => { if (!removed.has(c) && !merged.includes(c)) merged.push(c); });
  return merged;
}

export function getEffectiveMappingRules() {
  const cfg = loadAppConfig();
  const saved = (cfg && Array.isArray(cfg.mappingRules) && cfg.mappingRules.length) ? cfg.mappingRules : null;
  const removed = new Set((cfg && Array.isArray(cfg.removedClients)) ? cfg.removedClients : []);
  // A coded default rule the user has explicitly deleted from Settings ->
  // Clients & Deals -> Projects (recorded at save time -- see doSave in
  // App.jsx). Without this, the merge below could only ever ADD a coded
  // default rule back in, never actually drop one: deleting a rule that
  // happens to match a DEFAULT_MAPPING_RULES entry (by matchType+value)
  // would silently reappear on the very next load/save.
  const removedRuleKeys = new Set((cfg && Array.isArray(cfg.removedMappingRuleKeys)) ? cfg.removedMappingRuleKeys : []);
  if (!saved) return DEFAULT_MAPPING_RULES.filter(r => !removed.has(r.client));

  // Merge instead of replace: keep every saved rule first (these are the
  // user's own edits/reconciliations from the Configuration page and must
  // keep taking priority), then append any DEFAULT_MAPPING_RULES rule whose
  // (matchType + value) isn't already covered by a saved rule. This is what
  // lets a mapping rule added later in code for a newly-registered client
  // take effect even on an account that already has an older saved rule set
  // — without it, that account would never auto-classify or Reconcile that
  // client's projects, no matter how many rules get added going forward.
  // A rule whose client was explicitly deleted/renamed away from
  // (cfg.removedClients) is excluded from that append, otherwise deleting a
  // coded-default client would leave its old classification rule behind.
  const savedNonDefault = saved.filter(r => r.matchType !== "default");
  const savedKeys = new Set(
    savedNonDefault.map(r => `${r.matchType}:${(r.value || "").trim().toUpperCase()}`)
  );
  const missingDefaults = DEFAULT_MAPPING_RULES.filter(r =>
    r.matchType !== "default" &&
    !removed.has(r.client) &&
    !removedRuleKeys.has(`${r.matchType}:${(r.value || "").trim().toUpperCase()}`) &&
    !savedKeys.has(`${r.matchType}:${(r.value || "").trim().toUpperCase()}`)
  );
  const savedDefaultRule = saved.find(r => r.matchType === "default");
  const fallbackRule = savedDefaultRule || DEFAULT_MAPPING_RULES[DEFAULT_MAPPING_RULES.length - 1];
  return [...savedNonDefault, ...missingDefaults, fallbackRule];
}

// Pure classification function shared by the live App (mapClient) and the
// Configuration page's "test a project name" preview — keep them identical.
export function classifyProjectStrict(project = "", rules = null) {
  const p = (project || "").trim().toUpperCase();
  if (!p) return null;
  const activeRules = rules || getEffectiveMappingRules();
  for (const r of activeRules) {
    if (r.matchType === "default") return null; // no specific rule matched
    const v = (r.value || "").trim().toUpperCase();
    if (!v) continue;
    if (r.matchType === "exact" && p === v) return r.client;
    if (r.matchType === "contains" && p.includes(v)) return r.client;
  }
  return null;
}

export function classifyProject(project = "", rules = null) {
  const p = (project || "").trim().toUpperCase();
  const activeRules = rules || getEffectiveMappingRules();
  for (const r of activeRules) {
    if (r.matchType === "default") return r.client;
    const v = (r.value || "").trim().toUpperCase();
    if (!v) continue;
    if (r.matchType === "exact" && p === v) return r.client;
    if (r.matchType === "contains" && p.includes(v)) return r.client;
  }
  // Ultimate fallback if somehow no default rule exists
  const list = getEffectiveClientsList();
  return list[0] || "Sela";
}

// A deal's margin can combine THREE independent pieces, all of which count
// toward Fisheye's margin on this employee (never separate income):
//   - a percentage of the employee's salary (of either their MONTHLY
//     totalPackage, or ANNUAL = totalPackage * 12, per the deal's marginBasis)
//   - a flat SAR amount
//   - a flat SAR Saudization-visa fee, addable regardless of the above
export function dealHasAnyValue(deal) {
  const type = deal?.marginType || "percent";
  const numOrEmpty = v => v !== undefined && v !== null && v !== "" && !Number.isNaN(Number(v));
  if ((type === "percent" || type === "percent_fixed") && numOrEmpty(deal?.marginPercent ?? (type === "percent" ? deal?.marginValue : undefined))) return true;
  if ((type === "fixed" || type === "percent_fixed") && numOrEmpty(deal?.marginFixed ?? (type === "fixed" ? deal?.marginValue : undefined))) return true;
  if (numOrEmpty(deal?.saudizationFee)) return true;
  return false;
}
export function computeDealMargin(deal, totalPackage) {
  const type = deal?.marginType || "percent";
  let amount = 0;
  const parts = [];
  if (type === "percent" || type === "percent_fixed") {
    // Older deals (saved before the percent/fixed split) kept their one
    // number in `marginValue` -- fall back to it so nothing already
    // configured silently loses its percentage.
    const pct = Number(deal?.marginPercent ?? (type === "percent" ? deal?.marginValue : undefined));
    if (!Number.isNaN(pct) && pct) {
      const basis = deal?.marginBasis === "annual" ? totalPackage * 12 : totalPackage;
      amount += (pct / 100) * basis;
      parts.push(`${pct}% ${deal?.marginBasis === "annual" ? "annual" : "monthly"}`);
    }
  }
  if (type === "fixed" || type === "percent_fixed") {
    const fixed = Number(deal?.marginFixed ?? (type === "fixed" ? deal?.marginValue : undefined));
    if (!Number.isNaN(fixed) && fixed) {
      amount += fixed;
      parts.push(`${fixed} SAR`);
    }
  }
  const saudization = Number(deal?.saudizationFee);
  if (!Number.isNaN(saudization) && saudization) {
    amount += saudization;
    parts.push(`${saudization} SAR Saudization`);
  }
  return { amount, display: parts.join(" + ") };
}

// Resolves the margin that actually applies to a Direct-mode employee's
// profit calculation, as a fully computed SAR amount. Precedence:
//   1. The employee's OWN Fisheye Margin, if one has been typed on their
//      record — this always wins, so nothing already saved on an employee
//      ever changes silently when a client's Deal is added or edited later.
//   2. Otherwise, the client's Deals (configured in Settings → Clients &
//      Deals): a project-specific deal if the employee's project matches one
//      of that deal's keywords, else the client's default/base deal.
//   3. Otherwise, 0 (unchanged from the old behaviour of an employee with no
//      margin and no deal configured).
// Used by calcProfit (App.jsx) and calcLine (FinanceModule.jsx) so every
// profit/billing number in the app stays consistent with the same rule.

// Resolves a Lump Sum "position rate" margin for an employee, when their
// client's effective Deal (same project-match precedence as
// getEffectiveMargin above) is billingModel "lump_sum" / structure
// "positions" AND has a Position Rates row matching this employee's own
// `position` field (case-insensitive exact match).
//
// The math: an employee's stored totalPackage already equals
// workerRate * hoursWorked (that's how these Lump Sum packages are built
// from the client's real timesheet), so hoursWorked = totalPackage /
// workerRate can be derived WITHOUT any new per-employee hours field.
// From there:
//   grossMargin  = hours * (clientRate - workerRate)   // what Fisheye bills on top of payroll
//   partnerPayout = hours * partnerRate                // what Fisheye pays the named partner
//   netMargin     = grossMargin - partnerPayout         // what Fisheye actually keeps
//
// Returns null when no Lump Sum position match applies, so every caller
// falls back to its existing (Cost Plus / manual / partner-percent) logic
// completely unchanged.
export function getLumpSumPositionMargin(emp) {
  const totalPackage = Number(emp?.totalPackage) || 0;
  if (!totalPackage) return null;
  const meta = getEffectiveClientMeta();
  const deals = meta?.[emp?.client]?.deals;
  if (!Array.isArray(deals) || !deals.length) return null;

  const project = (emp?.project || "").trim().toUpperCase();
  let effectiveDeal = null;
  for (let i = deals.length - 1; i >= 1; i--) {
    const d = deals[i];
    const matched = (d.projectMatches || []).some(pm => {
      const v = (pm.value || "").trim().toUpperCase();
      if (!v) return false;
      return pm.matchType === "exact" ? project === v : project.includes(v);
    });
    if (matched) { effectiveDeal = d; break; }
  }
  if (!effectiveDeal) effectiveDeal = deals[0];
  if (!effectiveDeal || effectiveDeal.billingModel !== "lump_sum" || effectiveDeal.lumpSumStructure !== "positions") {
    return null;
  }

  const rates = effectiveDeal.positionRates || [];
  const posNorm = (emp?.position || "").trim().toLowerCase();
  const row = rates.find(r => (r.position || "").trim().toLowerCase() === posNorm);
  if (!row) return null;

  const workerRate = Number(row.workerRate) || 0;
  const clientRate = Number(row.clientRate) || 0;
  const partnerRate = Number(row.partnerRate) || 0;
  if (!workerRate) return null;

  const hours = totalPackage / workerRate;
  const grossMargin = hours * (clientRate - workerRate);
  const partnerPayout = hours * partnerRate;
  const netMargin = grossMargin - partnerPayout;

  return {
    source: "lump_sum",
    hours, workerRate, clientRate, partnerRate,
    grossMargin, partnerPayout, netMargin,
    partnerName: row.partnerName || "",
  };
}

export function getEffectiveMargin(emp) {
  const totalPackage = Number(emp?.totalPackage) || 0;
  const manual = Number(emp?.fisheyeMargin) || 0;
  if (manual) {
    const type = emp.fisheyeMarginType || "percent";
    const amount = type === "percent" ? (manual / 100) * totalPackage : manual;
    return { source: "manual", amount, display: type === "percent" ? `${manual}%` : `${manual} SAR` };
  }
  const meta = getEffectiveClientMeta();
  const deals = meta?.[emp?.client]?.deals;
  if (Array.isArray(deals) && deals.length) {
    const project = (emp?.project || "").trim().toUpperCase();
    // Later entries are the more specific, project-scoped deals -- check
    // those first so a project-specific override wins over the base deal.
    for (let i = deals.length - 1; i >= 1; i--) {
      const d = deals[i];
      const matched = (d.projectMatches || []).some(pm => {
        const v = (pm.value || "").trim().toUpperCase();
        if (!v) return false;
        return pm.matchType === "exact" ? project === v : project.includes(v);
      });
      if (matched && dealHasAnyValue(d)) {
        const { amount, display } = computeDealMargin(d, totalPackage);
        return { source: "deal", amount, display };
      }
    }
    const base = deals[0];
    if (base && dealHasAnyValue(base)) {
      const { amount, display } = computeDealMargin(base, totalPackage);
      return { source: "deal", amount, display };
    }
  }
  return { source: "none", amount: 0, display: "" };
}
