import { describe, expect, it } from "vitest";

import {
  ApiError,
  UserFacingError,
  errorMessage,
  isApiError,
} from "./api-error";

function problem(overrides: Partial<ConstructorParameters<typeof ApiError>[0]> = {}) {
  return new ApiError({
    title: "İş kuralı ihlali",
    status: 409,
    detail: "Teklif çok düşük.",
    errorCode: "bid_too_low",
    traceId: "trace-1",
    ...overrides,
  });
}

describe("ApiError", () => {
  it("uses the detail as its message, falling back to the title", () => {
    expect(problem().message).toBe("Teklif çok düşük.");
    expect(problem({ detail: "" }).message).toBe("İş kuralı ihlali");
  });

  it("classifies the statuses the UI branches on", () => {
    expect(problem({ status: 401 }).isUnauthorized).toBe(true);
    expect(problem({ status: 403 }).isForbidden).toBe(true);
    expect(problem({ status: 404 }).isNotFound).toBe(true);
    expect(problem({ status: 429 }).isRateLimited).toBe(true);
    expect(problem().isUnauthorized).toBe(false);
  });

  it("exposes the bid floor the server named", () => {
    expect(problem({ minimumRequired: 44_500 }).minimumRequired).toBe(44_500);
  });

  it("falls back to correlationId when traceId is absent", () => {
    // The services report the same value under two names, historically.
    expect(
      problem({ traceId: "", correlationId: "corr-1" }).traceId,
    ).toBe("corr-1");
  });

  it("lower-cases validation keys and translates the server's English", () => {
    // The server names fields in PascalCase and writes in English; inputs use
    // camelCase and the user reads Turkish.
    const error = problem({
      status: 400,
      errorCode: "validation.invalid",
      errors: {
        Password: ["The length of 'Password' must be at least 12 characters."],
        Email: ["'Email' is not a valid email address."],
      },
    });

    expect(error.fieldErrors).toEqual({
      password: "En az 12 karakter olmalı.",
      email: "Geçerli bir e-posta adresi girin.",
    });
  });

  it("reports every failed rule once, not just the first", () => {
    const error = problem({
      errors: {
        Password: [
          "Password must contain at least one uppercase letter.",
          "Password must contain at least one digit.",
          "Password must contain at least one uppercase letter.",
        ],
      },
    });

    expect(error.fieldErrors.password).toBe(
      "En az bir büyük harf içermeli. En az bir rakam içermeli.",
    );
  });

  it("has no field errors when the body carries none", () => {
    expect(problem().fieldErrors).toEqual({});
    expect(problem({ errors: { Password: [] } }).fieldErrors).toEqual({});
  });

  it("is recognisable through isApiError", () => {
    expect(isApiError(problem())).toBe(true);
    expect(isApiError(new Error("boom"))).toBe(false);
  });
});

describe("errorMessage", () => {
  it("explains a rate limit in words the user can act on", () => {
    expect(
      errorMessage(problem({ status: 429, errorCode: "rate_limited" }), "fallback"),
    ).toMatch(/biraz sonra/i);
  });

  it("never shows the server's technical detail", () => {
    // `detail` is written for developers — often English, sometimes naming
    // tokens or endpoints. The errorCode decides what the user reads.
    const error = problem({
      status: 401,
      errorCode: "unauthorized",
      detail: "Bu uç için geçerli bir access token gerekiyor.",
    });

    expect(errorMessage(error, "fallback")).not.toMatch(/token|uç/);
    expect(errorMessage(error, "fallback")).toMatch(/oturum/i);
  });

  it("shows the floor when a bid was too low", () => {
    expect(
      errorMessage(problem({ minimumRequired: 44_500 }), "fallback"),
    ).toMatch(/En az .*44\.500/);
  });

  it("shows messages written for the user, and nothing else", () => {
    expect(errorMessage(new UserFacingError("Bağlantı hazır değil."), "x")).toBe(
      "Bağlantı hazır değil.",
    );
    expect(errorMessage(new Error("Failed to fetch"), "fallback")).toBe("fallback");
    expect(errorMessage("boom", "fallback")).toBe("fallback");
  });
});
