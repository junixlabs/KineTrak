/** Prefixed unique id, e.g. makeId('f') -> "f_3fa85f64". */
export function makeId(prefix: string): string {
  const uuid =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(16).slice(2)
  return `${prefix}_${uuid.replace(/-/g, '').slice(0, 10)}`
}

/** Next free uppercase letter code (A..Z, then A1, B1, …) given existing codes. */
export function nextNodeCode(existing: (string | undefined)[]): string {
  const used = new Set(existing.filter(Boolean) as string[])
  for (let round = 0; round < 50; round++) {
    for (let i = 0; i < 26; i++) {
      const code = String.fromCharCode(65 + i) + (round === 0 ? '' : String(round))
      if (!used.has(code)) return code
    }
  }
  return makeId('n')
}
