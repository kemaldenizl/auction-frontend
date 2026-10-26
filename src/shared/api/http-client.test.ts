import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError, isApiError } from "./api-error";
import { createHttpClient, toQueryString } from "./http-client";

const BASE_URL = "http://gateway.test";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("toQueryString", () => {
  it("drops undefined, null and empty values so optional filters can be spread in", () => {
    expect(
      toQueryString({
        category: "kitap",
        page: 2,
        search: "",
        status: undefined,
        take: null,
      }),
    ).toBe("?category=kitap&page=2");
  });

  it("returns an empty string when nothing is left", () => {
    expect(toQueryString({ page: undefined })).toBe("");
    expect(toQueryString()).toBe("");
  });

  it("encodes values", () => {
    expect(toQueryString({ category: "ev & bahçe" })).toBe(
      "?category=ev+%26+bah%C3%A7e",
    );
  });
});

describe("createHttpClient", () => {
  const fetchMock = vi.fn<typeof fetch>();
  const http = createHttpClient(BASE_URL);

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("builds the URL from the base path and query", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ items: [] }));

    await http.get("/api/products", { query: { page: 3 } });

    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_URL}/api/products?page=3`,
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("sends a JSON body and content type only when there is a body", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: "1" }));

    await http.post("/api/products", { name: "Daktilo" });

    const [, init] = fetchMock.mock.calls[0];
    expect(init?.body).toBe('{"name":"Daktilo"}');
    expect(init?.headers).toMatchObject({
      "Content-Type": "application/json",
    });
  });

  it("omits the content type on a bodyless POST", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: "1" }));

    await http.post("/api/auctions/1/start");

    const [, init] = fetchMock.mock.calls[0];
    expect(init?.body).toBeUndefined();
    expect(init?.headers).not.toHaveProperty("Content-Type");
  });

  it("returns undefined for 204 instead of trying to parse a body", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(http.delete("/api/products/1")).resolves.toBeUndefined();
  });

  it("keeps errorCode and minimumRequired from a ProblemDetails body", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          title: "Teklif reddedildi",
          status: 409,
          detail: "Teklif çok düşük",
          errorCode: "bid_too_low",
          traceId: "trace-1",
          minimumRequired: 1_150,
        },
        409,
      ),
    );

    const error = await http
      .post("/api/auctions/1/bids", { amount: 10 })
      .catch((cause: unknown) => cause);

    expect(isApiError(error)).toBe(true);
    const apiError = error as ApiError;
    expect(apiError.message).toBe("Teklif çok düşük");
    expect(apiError.errorCode).toBe("bid_too_low");
    expect(apiError.minimumRequired).toBe(1_150);
    expect(apiError.status).toBe(409);
  });

  it("still produces a usable error when the body is not ProblemDetails", async () => {
    // A proxy failing in front of the service sends HTML, not JSON.
    fetchMock.mockResolvedValue(
      new Response("<html>Bad Gateway</html>", {
        status: 502,
        statusText: "Bad Gateway",
      }),
    );

    const error = (await http
      .get("/api/products")
      .catch((cause: unknown) => cause)) as ApiError;

    expect(error.status).toBe(502);
    expect(error.errorCode).toBe("unknown");
    expect(error.message).toContain("502");
  });

  it("reports a 404 so a caller can turn it into a not-found page", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          title: "Bulunamadı",
          status: 404,
          detail: "Ürün yok",
          errorCode: "not_found",
          traceId: "",
        },
        404,
      ),
    );

    const error = (await http
      .get("/api/products/missing")
      .catch((cause: unknown) => cause)) as ApiError;

    expect(error.isNotFound).toBe(true);
  });

  it("wraps a transport failure as a network error", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    const error = (await http
      .get("/api/products")
      .catch((cause: unknown) => cause)) as ApiError;

    expect(error.errorCode).toBe("network_error");
    expect(error.status).toBe(0);
    expect(error.message).toBe("fetch failed");
  });
});
