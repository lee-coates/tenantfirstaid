import { describe, it, expect } from "vitest";
import { buildLetterUserMessage } from "../../pages/Chat/utils/letterHelper";

describe("buildLetterUserMessage", () => {
  it("includes org when provided, but loc is undefined", () => {
    const output = buildLetterUserMessage("MyOrg", undefined);
    expect(output?.userMessage).toContain("MyOrg");
    expect(output?.userMessage).toContain("(OR)");
  });

  it("includes location string for portland", () => {
    const output = buildLetterUserMessage("MyOrg", "portland");
    expect(output?.userMessage).toContain("MyOrg");
    expect(output?.userMessage).toContain("(portland, or)");
  });

  it("includes location string for eugene", () => {
    const output = buildLetterUserMessage("MyOrg", "eugene");
    expect(output?.userMessage).toContain("MyOrg");
    expect(output?.userMessage).toContain("(eugene, or)");
  });

  it("includes location string for oregon", () => {
    const output = buildLetterUserMessage("MyOrg", "oregon");
    expect(output?.userMessage).toContain("MyOrg");
    expect(output?.userMessage).toContain("(OR)");
  });
});
