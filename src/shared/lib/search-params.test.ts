import { describe, expect, it } from "vitest";

import { readPage, readString } from "./search-params";

describe("readString", () => {
  it("passes a single value through", () => {
    expect(readString("kitap")).toBe("kitap");
  });

  it("takes the first of a repeated parameter", () => {
    expect(readString(["kitap", "ev"])).toBe("kitap");
  });

  it("treats missing and empty as absent", () => {
    expect(readString(undefined)).toBeUndefined();
    expect(readString("")).toBeUndefined();
    expect(readString([])).toBeUndefined();
  });
});

describe("readPage", () => {
  it("parses a positive integer", () => {
    expect(readPage("4")).toBe(4);
  });

  it("falls back to the first page for anything unusable", () => {
    expect(readPage(undefined)).toBe(1);
    expect(readPage("0")).toBe(1);
    expect(readPage("-2")).toBe(1);
    expect(readPage("1.5")).toBe(1);
    expect(readPage("abc")).toBe(1);
  });
});
