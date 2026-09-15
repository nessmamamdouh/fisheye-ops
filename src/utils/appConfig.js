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

export function getEffectiveClientsList() {
  const cfg = loadAppConfig();
  return (cfg && Array.isArray(cfg.clientsList) && cfg.clientsList.length)
    ? cfg.clientsList
    : DEFAULT_CLIENTS_LIST;
}

export function getEffectiveClientMeta() {
  const cfg = loadAppConfig();
  return (cfg && cfg.clientMeta && typeof cfg.clientMeta === "object")
    ? cfg.clientMeta
    : DEFAULT_CLIENT_META;
}

export function getEffectiveMappingRules() {
  const cfg = loadAppConfig();
  return (cfg && Array.isArray(cfg.mappingRules) && cfg.mappingRules.length)
    ? cfg.mappingRules
    : DEFAULT_MAPPING_RULES;
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
