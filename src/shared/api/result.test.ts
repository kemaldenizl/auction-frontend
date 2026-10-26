import { describe, expect, it } from "vitest";

import { ApiError } from "./api-error";
import { attempt } from "./result";

const problem = {
  title: "Bulunamadı",
  status: 404,
  detail: "Yok",
  errorCode: "not_found",
  traceId: "",
};

describe("attempt", () => {
  it("wraps a resolved value", async () => {
    await expect(attempt(Promise.resolve(42))).resolves.toEqual({
      ok: true,
      data: 42,
    });
  });

  it("turns an ApiError into a value a component can render", async () => {
    const result = await attempt(Promise.reject(new ApiError(problem)));

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.errorCode).toBe("not_found");
  });

  it("lets a programming mistake through to the error boundary", async () => {
    await expect(
      attempt(Promise.reject(new TypeError("undefined is not a function"))),
    ).rejects.toBeInstanceOf(TypeError);
  });
});
