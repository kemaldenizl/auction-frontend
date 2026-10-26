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
