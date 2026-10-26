import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createHttpClient } from "@/shared/api";

import { createCatalogApi } from "./catalog-api";

const BASE_URL = "http://gateway.test";

describe("catalogApi", () => {
  const fetchMock = vi.fn<typeof fetch>();
  const api = createCatalogApi(createHttpClient(BASE_URL));

  function requestedUrl(): string {
    return String(fetchMock.mock.calls[0][0]);
  }

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    // A fresh Response per call: a body can only be read once.
    fetchMock.mockImplementation(() =>
      Promise.resolve(
        new Response("{}", { headers: { "Content-Type": "application/json" } }),
      ),
    );
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("lists products without a query when no filter is given", async () => {
    await api.listProducts();

    expect(requestedUrl()).toBe(`${BASE_URL}/api/products`);
  });

  it("passes the category filter and paging through", async () => {
    await api.listProducts({ category: "kitap", page: 2, pageSize: 12 });

    expect(requestedUrl()).toBe(
      `${BASE_URL}/api/products?category=kitap&page=2&pageSize=12`,
    );
  });

  it("reads a single product", async () => {
    await api.getProduct("product-1");

    expect(requestedUrl()).toBe(`${BASE_URL}/api/products/product-1`);
  });

  it("reads the category list", async () => {
    await api.listCategories();

    expect(requestedUrl()).toBe(`${BASE_URL}/api/products/categories`);
  });

  it("uses the right verb for each mutation", async () => {
    await api.createProduct({
      name: "Daktilo",
      category: "koleksiyon",
      startingPrice: 500,
    });
    await api.updateProduct("product-1", { startingPrice: 600 });
    await api.deleteProduct("product-1");

    expect(fetchMock.mock.calls.map(([, init]) => init?.method)).toEqual([
      "POST",
      "PUT",
      "DELETE",
    ]);
  });
});
