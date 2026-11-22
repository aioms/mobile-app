import { describe, expect, it } from "vitest";
import { parseProductInventoryInput } from "./productInventoryInput";

describe("parseProductInventoryInput", () => {
  it("parses decimal quantities with a period", () => {
    expect(parseProductInventoryInput("0.1")).toBe(0.1);
    expect(parseProductInventoryInput("1.5")).toBe(1.5);
  });

  it("parses decimal quantities with a comma", () => {
    expect(parseProductInventoryInput("1,5")).toBe(1.5);
  });

  it("supports whole and zero quantities", () => {
    expect(parseProductInventoryInput("123")).toBe(123);
    expect(parseProductInventoryInput("0")).toBe(0);
  });

  it("rejects empty and malformed values", () => {
    expect(parseProductInventoryInput("")).toBeNull();
    expect(parseProductInventoryInput(".")).toBeNull();
    expect(parseProductInventoryInput("1,2.3")).toBeNull();
    expect(parseProductInventoryInput("abc")).toBeNull();
  });
});
