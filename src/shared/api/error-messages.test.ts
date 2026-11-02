import { describe, expect, it } from "vitest";

import { messageForProblem, translateFieldMessage } from "./error-messages";

describe("messageForProblem", () => {
  it("maps a known code to plain Turkish", () => {
    expect(
      messageForProblem({ status: 401, errorCode: "auth.invalid_credentials" }),
    ).toBe("E-posta adresi ya da parola hatalı.");
  });

  it("falls back on the status for a code it does not know", () => {
    expect(messageForProblem({ status: 404, errorCode: "mystery" })).toBe(
      "Aradığınız kayıt bulunamadı.",
    );
    expect(messageForProblem({ status: 503, errorCode: "mystery" })).toMatch(
      /Beklenmeyen bir hata/,
    );
  });

  it("uses the caller's fallback when nothing else fits", () => {
    expect(
      messageForProblem({ status: 418, errorCode: "teapot" }, "Olmadı."),
    ).toBe("Olmadı.");
  });

  it("explains an unreachable server without naming infrastructure", () => {
    const message = messageForProblem({ status: 0, errorCode: "network_error" });

    expect(message).toMatch(/bağlantı/i);
    expect(message).not.toMatch(/gateway|api/i);
  });

  it("names the floor for a bid that was too low", () => {
    expect(
      messageForProblem({
        status: 409,
        errorCode: "bid_too_low",
        minimumRequired: 1_150,
      }),
    ).toMatch(/En az .*1\.150 vermelisiniz/);
  });
});

describe("translateFieldMessage", () => {
  it.each([
    ["The length of 'Password' must be at least 12 characters.", "En az 12 karakter olmalı."],
    ["Password must contain at least one uppercase letter.", "En az bir büyük harf içermeli."],
    ["Password must contain at least one digit.", "En az bir rakam içermeli."],
    ["Password must contain at least one non-alphanumeric character.", "En az bir özel karakter içermeli (!, ?, * gibi)."],
    ["'Email' is not a valid email address.", "Geçerli bir e-posta adresi girin."],
    ["'Name' must not be empty.", "Bu alan zorunlu."],
  ])("translates %j", (input, expected) => {
    expect(translateFieldMessage(input)).toBe(expected);
  });

  it("gives a neutral hint for anything it does not recognise", () => {
    expect(translateFieldMessage("Something odd happened.")).toBe(
      "Bu alanı kontrol edin.",
    );
  });
});
