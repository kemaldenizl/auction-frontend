/** Security rejects anything shorter with a 400 on the `password` field. */
export const MIN_PASSWORD_LENGTH = 12;

export interface PasswordRule {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

/**
 * The rules Security actually enforces. The contract only documents the
 * length, but the server also demands an uppercase letter, a digit and a
 * symbol — checking just the length let obviously failing passwords through
 * to an English error message.
 */
export const PASSWORD_RULES: readonly PasswordRule[] = [
  {
    id: "length",
    label: `En az ${MIN_PASSWORD_LENGTH} karakter`,
    test: (password) => password.length >= MIN_PASSWORD_LENGTH,
  },
  {
    id: "uppercase",
    label: "Bir büyük harf",
    test: (password) => /\p{Lu}/u.test(password),
  },
  {
    id: "digit",
    label: "Bir rakam",
    test: (password) => /\d/.test(password),
  },
  {
    id: "symbol",
    label: "Bir özel karakter (!, ?, * gibi)",
    test: (password) => /[^\p{L}\d]/u.test(password),
  },
];

/**
 * Catches the rules before spending a request on them — the sensitive
 * endpoints only allow five a minute.
 */
export function validatePassword(password: string): string | null {
  const failed = PASSWORD_RULES.filter((rule) => !rule.test(password));
  if (failed.length === 0) return null;

  return `Parolanız şunları içermeli: ${failed
    .map((rule) => rule.label.toLocaleLowerCase("tr-TR"))
    .join(", ")}.`;
}

export function validatePasswordConfirmation(
  password: string,
  confirmation: string,
): string | null {
  return password === confirmation ? null : "Parolalar eşleşmiyor.";
}
