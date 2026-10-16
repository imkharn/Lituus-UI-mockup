/** Invalid outcome id = 2^256 − 1 (64 hex digits of F). */
export const INVALID_OUTCOME_HEX = 'F'.repeat(64)

/** Two-digit hex for a normal outcome index. */
export function outcomeIdHex(index: number): string {
  return index.toString(16).padStart(2, '0').toUpperCase()
}

/**
 * Format an outcome id for UI side labels.
 * Invalid uses the full 2^256−1 hex; others use 00, 01, … or a decimal id string.
 */
export function formatOutcomeIdLabel(
  id: string,
  opts?: { truncate?: boolean },
): string {
  if (id === INVALID_OUTCOME_HEX || /^F{16,}$/i.test(id)) {
    // Keep readable: show abbreviated 2^256−1 hex in gray labels
    return opts?.truncate === false
      ? INVALID_OUTCOME_HEX
      : `${'F'.repeat(4)}…${'F'.repeat(4)} (2²⁵⁶−1)`
  }
  return id
}
