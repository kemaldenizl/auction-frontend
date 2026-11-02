import { describe, expect, it } from "vitest";

import {
  readBoolean,
  readInternalPath,
  readPage,
  readString,
} from "./search-params";

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

describe("readBoolean", () => {
  it("reads the two literal values", () => {
    expect(readBoolean("true")).toBe(true);
    expect(readBoolean("false")).toBe(false);
  });

  it("treats anything else as unset, which means 'no filter'", () => {
    expect(readBoolean(undefined)).toBeUndefined();
    expect(readBoolean("")).toBeUndefined();
    expect(readBoolean("1")).toBeUndefined();
    expect(readBoolean("yes")).toBeUndefined();
  });
});

describe("readInternalPath", () => {
  it("keeps a path within the site", () => {
    expect(readInternalPath("/auctions/123")).toBe("/auctions/123");
    expect(readInternalPath("/products?page=2")).toBe("/products?page=2");
  });

  it("refuses anything that could leave the site", () => {
    // `?next=` comes from the URL, so taking it at face value would be an
    // open redirect.
    expect(readInternalPath("https://evil.example.com")).toBe("/");
    expect(readInternalPath("//evil.example.com")).toBe("/");
    expect(readInternalPath("javascript:alert(1)")).toBe("/");
    expect(readInternalPath("auctions")).toBe("/");
  });

  it("uses the given fallback when there is nothing to read", () => {
    expect(readInternalPath(undefined, "/account")).toBe("/account");
  });
});
