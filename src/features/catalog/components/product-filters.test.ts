import { describe, expect, it } from "vitest";

import { productsHref } from "./product-filters";

describe("productsHref", () => {
  it("is the bare path when nothing is filtered", () => {
    expect(productsHref({})).toBe("/products");
  });

  it("keeps every active filter, so switching one does not drop the rest", () => {
    expect(
      productsHref({
        search: "omega",
        category: "Saat",
        sortBy: "price",
        isActive: true,
        page: 3,
      }),
    ).toBe("/products?search=omega&category=Saat&sortBy=price&isActive=true&page=3");
  });

  it("omits the server's own defaults", () => {
    // `descending` defaults to true and page 1 is the first page; spelling
    // either out would only make the URL noisier.
    expect(productsHref({ descending: true, page: 1 })).toBe("/products");
  });

  it("spells out ascending order, which is not the default", () => {
    expect(productsHref({ descending: false })).toBe(
      "/products?descending=false",
    );
  });

  it("distinguishes 'inactive only' from 'no status filter'", () => {
    expect(productsHref({ isActive: false })).toBe("/products?isActive=false");
    expect(productsHref({ isActive: undefined })).toBe("/products");
  });

  it("encodes a Turkish category", () => {
    expect(productsHref({ category: "Müzik Enstrümanı" })).toBe(
      "/products?category=M%C3%BCzik+Enstr%C3%BCman%C4%B1",
    );
  });
});
