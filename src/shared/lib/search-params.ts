export type SearchParamValue = string | string[] | undefined;

/** First value of a possibly repeated query parameter, or `undefined`. */
export function readString(value: SearchParamValue): string | undefined {
  const first = Array.isArray(value) ? value[0] : value;
  return first === undefined || first === "" ? undefined : first;
}

/** A 1-based page number, falling back to 1 for anything unparseable. */
export function readPage(value: SearchParamValue): number {
  const parsed = Number(readString(value));
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
}

/** `true` / `false`, or `undefined` for anything else. */
export function readBoolean(value: SearchParamValue): boolean | undefined {
  const raw = readString(value);
  if (raw === "true") return true;
  if (raw === "false") return false;
  return undefined;
}

/**
 * A `?next=` redirect target that cannot leave this site.
 *
 * Anything absolute or protocol-relative is discarded: a redirect parameter
 * taken at face value is an open redirect, and the value comes from the URL.
 */
export function readInternalPath(
  value: SearchParamValue,
  fallback = "/",
): string {
  const raw = readString(value);
  if (!raw) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//")) return fallback;
  return raw;
}
