import { describe, it, expect } from "vitest";
import { buildLetterUserMessage } from "../../pages/Letter/utils/letterHelper";
import type { Location } from "../../types/models";

const OREGON_AT_LARGE: Location = { state: "or", city: null };
const PORTLAND: Location = { state: "or", city: "portland" };
const EUGENE: Location = { state: "or", city: "eugene" };

describe("buildLetterUserMessage", () => {
  it("handles undefined org parameter for direct letter access", () => {
    const output = buildLetterUserMessage(undefined, OREGON_AT_LARGE);
    expect(output.userMessage).not.toContain("redirected from");
    expect(output.userMessage).toContain("(OR)");
    expect(output.userMessage).not.toContain("undefined");
  });

  it("includes org when provided, with Oregon at large", () => {
    const output = buildLetterUserMessage("MyOrg", OREGON_AT_LARGE);
    expect(output.userMessage).toContain("redirected from");
    expect(output.userMessage).toContain("MyOrg");
    expect(output.userMessage).toContain("(OR)");
  });

  it("includes location string for portland", () => {
    const output = buildLetterUserMessage("MyOrg", PORTLAND);
    expect(output.userMessage).toContain("redirected from");
    expect(output.userMessage).toContain("MyOrg");
    expect(output.userMessage).toContain("(Portland, OR)");
  });

  it("includes location string for eugene", () => {
    const output = buildLetterUserMessage("MyOrg", EUGENE);
    expect(output.userMessage).toContain("redirected from");
    expect(output.userMessage).toContain("MyOrg");
    expect(output.userMessage).toContain("(Eugene, OR)");
  });
});
