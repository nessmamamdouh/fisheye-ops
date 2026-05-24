// ═══════════════════════════════════════════════════════════════════════════════
// 📦 SHARED HELPERS — Single source of truth for all modules
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * isExcluded(employee)
 * Returns true if the employee should be excluded from active counts.
 * Covers English + Arabic status values used across the system.
 */
export const isExcluded = e => {
  const st = (e.status || "").toLowerCase().trim();
  return [
    "expired",    "resigned",
    "expired_ar", "resigned_ar",
    "مستقيل",     "منتهي",
  ].includes(st);
};

/**
 * hasMissingPO(employee)
 * Returns true if the employee has no PO number assigned.
 */
export const hasMissingPO = e => !e.poNumbers || String(e.poNumbers).trim() === "";

/**
 * hasValidPO(employee)
 * Returns true if the employee has at least one PO number.
 */
export const hasValidPO = e => !!e.poNumbers && String(e.poNumbers).trim() !== "";

/**
 * isWFDone(workflowStatus)
 * Returns true if the workflow is considered complete.
 * Covers: complete, agreement signed, iqama transferred.
 */
export const isWFDone = wf =>
  ["complete", "agreement signed", "iqama transferred"]
    .some(x => (wf || "").toLowerCase().includes(x));

/**
 * getClientsList(employees)
 * Returns a sorted unique list of client names from the employee data.
 * Use this instead of a hardcoded CLIENTS_LIST wherever possible.
 */
export const getClientsList = (employees = []) =>
  [...new Set(employees.map(e => e.client).filter(Boolean))].sort();
