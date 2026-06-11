/**
 * Reads a localStorage value, returning null when the key is absent or when
 * storage access throws (e.g. blocked site data).
 */
export function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Writes a localStorage value as best-effort persistence.
 * Storage failures are ignored.
 */
export function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignored: callers treat persistence as best-effort.
  }
}
