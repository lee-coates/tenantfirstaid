import { describe, it, expect } from "vitest";
import { buildLetterUserMessage } from "../../pages/Letter/utils/letterHelper";

describe("buildLetterUserMessage", () => {
  it("handles undefined org parameter for direct letter access", () => {
    const output = buildLetterUserMessage(undefined, undefined);
    expect(output?.userMessage).not.toContain("redirected from");
    expect(output?.userMessage).toContain("(OR)");
    expect(output?.userMessage).not.toContain("undefined");
  });

  it("includes org when provided, but loc is undefined", () => {
    const output = buildLetterUserMessage("MyOrg", undefined);
    expect(output?.userMessage).toContain("redirected from");
    expect(output?.userMessage).toContain("MyOrg");
    expect(output?.userMessage).toContain("(OR)");
  });

  it("includes location string for portland", () => {
    const output = buildLetterUserMessage("MyOrg", "portland");
    expect(output?.userMessage).toContain("redirected from");
    expect(output?.userMessage).toContain("MyOrg");
    expect(output?.userMessage).toContain("(Portland, OR)");
  });

  it("includes location string for eugene", () => {
    const output = buildLetterUserMessage("MyOrg", "eugene");
    expect(output?.userMessage).toContain("redirected from");
    expect(output?.userMessage).toContain("MyOrg");
    expect(output?.userMessage).toContain("(Eugene, OR)");
  });

  it("includes location string for oregon", () => {
    const output = buildLetterUserMessage("MyOrg", "oregon");
    expect(output?.userMessage).toContain("redirected from");
    expect(output?.userMessage).toContain("MyOrg");
    expect(output?.userMessage).toContain("(OR)");
  });
});
