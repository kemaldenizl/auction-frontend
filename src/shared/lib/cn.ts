export type ClassValue =
  | string
  | number
  | null
  | undefined
  | false
  | ClassValue[];

/** Joins conditional class names, dropping anything falsy. */
export function cn(...values: ClassValue[]): string {
  const classes: string[] = [];

  for (const value of values) {
    if (!value && value !== 0) continue;

    if (Array.isArray(value)) {
      const nested = cn(...value);
      if (nested) classes.push(nested);
    } else {
      classes.push(String(value));
    }
  }

  return classes.join(" ");
}
