import { describe, expect, it } from "vitest";

import {
  PASSWORD_RULES,
  validatePassword,
  validatePasswordConfirmation,
} from "./password";

function failing(password: string): string[] {
  return PASSWORD_RULES.filter((rule) => !rule.test(password)).map(
    (rule) => rule.id,
  );
}

describe("password rules", () => {
  it("accepts a password that meets every rule the server enforces", () => {
    expect(failing("CokGuvenliParola1!")).toEqual([]);
    expect(validatePassword("CokGuvenliParola1!")).toBeNull();
  });

  it("catches what the server would reject, not just the length", () => {
    // Regression: only the length was checked, so a 12-character lowercase
    // password went to the server and came back with English errors.
    expect(failing("cokuzunbirparola")).toEqual(["uppercase", "digit", "symbol"]);
  });

  it("counts Turkish capitals as uppercase", () => {
    expect(failing("şİfre-uzun-123")).not.toContain("uppercase");
  });

  it("names every missing rule in one message", () => {
    expect(validatePassword("kisa")).toMatch(
      /12 karakter.*büyük harf.*rakam.*özel karakter/,
    );
  });

  it("checks the confirmation matches", () => {
    expect(validatePasswordConfirmation("a", "a")).toBeNull();
    expect(validatePasswordConfirmation("a", "b")).toBe("Parolalar eşleşmiyor.");
  });
});
