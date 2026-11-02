/**
 * `localStorage` access that cannot throw.
 *
 * Storage is absent on the server and can throw outright in a private window
 * or with site data blocked, so every call is guarded and a failure simply
 * means "nothing stored".
 */
export function browserStorage(): Storage | undefined {
  return typeof window === "undefined" ? undefined : window.localStorage;
}

export function readJson<T>(
  storage: Storage | undefined,
  key: string,
  isValid: (value: unknown) => value is T,
): T | null {
  if (!storage) return null;

  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeJson(
  storage: Storage | undefined,
  key: string,
  value: unknown,
): void {
  if (!storage) return;

  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Nothing to do: the value stays in memory for this session only.
  }
}

export function removeKey(storage: Storage | undefined, key: string): void {
  if (!storage) return;

  try {
    storage.removeItem(key);
  } catch {
    // Ignored for the same reason as above.
  }
}
