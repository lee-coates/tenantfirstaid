import { describe, it, expect } from "vitest";
import {
  isKnownState,
  classifyStateSegment,
  resolveJurisdiction,
  jurisdictionFromPathname,
  jurisdictionByKey,
  toLocation,
  pathFor,
} from "../../shared/utils/jurisdiction";
import { JURISDICTION_OPTIONS } from "../../shared/constants/jurisdictions";

describe("resolveJurisdiction", () => {
  it("defaults a bare path to Oregon at large", () => {
    expect(toLocation(resolveJurisdiction())).toEqual({
      state: "or",
      city: null,
    });
  });

  it("resolves state + city segments", () => {
    expect(toLocation(resolveJurisdiction("or", "portland"))).toEqual({
      state: "or",
      city: "portland",
    });
  });

  it("falls back to state-at-large for an unknown city", () => {
    expect(toLocation(resolveJurisdiction("or", "salem"))).toEqual({
      state: "or",
      city: null,
    });
  });

  it("falls back to Oregon at large for an unknown state", () => {
    expect(resolveJurisdiction("wa", "seattle").key).toBe("oregon");
  });
});

describe("isKnownState", () => {
  it("recognizes supported states case-insensitively", () => {
    expect(isKnownState("or")).toBe(true);
    expect(isKnownState("OR")).toBe(true);
  });

  it("rejects org slugs and undefined", () => {
    expect(isKnownState("pha")).toBe(false);
    expect(isKnownState(undefined)).toBe(false);
  });
});

describe("classifyStateSegment", () => {
  it("treats a supported state or absent segment as supported", () => {
    expect(classifyStateSegment("or")).toBe("supported");
    expect(classifyStateSegment("OR")).toBe("supported");
    expect(classifyStateSegment(undefined)).toBe("supported");
  });

  it("flags a real US state we don't serve as out-of-state", () => {
    expect(classifyStateSegment("wa")).toBe("out-of-state");
    expect(classifyStateSegment("CA")).toBe("out-of-state");
  });

  it("treats a non-state slug (legacy org or typo) as unknown", () => {
    expect(classifyStateSegment("pha")).toBe("unknown");
    expect(classifyStateSegment("portland")).toBe("unknown");
  });
});

describe("jurisdictionFromPathname", () => {
  it("reads the jurisdiction from a chat/letter pathname", () => {
    expect(jurisdictionFromPathname("/chat/or/portland").key).toBe("portland");
    expect(jurisdictionFromPathname("/letter/or/eugene").key).toBe("eugene");
    expect(jurisdictionFromPathname("/chat/or").key).toBe("oregon");
  });

  it("defaults bare and non-feature paths to Oregon", () => {
    expect(jurisdictionFromPathname("/chat").key).toBe("oregon");
    expect(jurisdictionFromPathname("/about").key).toBe("oregon");
    expect(jurisdictionFromPathname("/").key).toBe("oregon");
  });
});

describe("jurisdictionByKey", () => {
  it("returns the matching option case-insensitively", () => {
    expect(jurisdictionByKey("eugene").pathSuffix).toBe("/or/eugene");
    expect(jurisdictionByKey("PORTLAND").key).toBe("portland");
  });

  it("defaults legacy loc values without a match to Oregon", () => {
    // Legacy /letter/:loc values (oregon/other/unknown/undefined) collapse here.
    expect(jurisdictionByKey("oregon").pathSuffix).toBe("/or");
    expect(jurisdictionByKey("other").key).toBe("oregon");
    expect(jurisdictionByKey(null).key).toBe("oregon");
    expect(jurisdictionByKey(undefined).key).toBe("oregon");
  });
});

describe("pathFor", () => {
  it("builds a feature path carrying the jurisdiction", () => {
    expect(pathFor("chat", jurisdictionByKey("oregon"))).toBe("/chat/or");
    expect(pathFor("letter", jurisdictionByKey("portland"))).toBe(
      "/letter/or/portland",
    );
  });

  it("appends a search string when given", () => {
    expect(pathFor("letter", jurisdictionByKey("eugene"), "?org=x")).toBe(
      "/letter/or/eugene?org=x",
    );
  });
});

describe("JURISDICTION_OPTIONS", () => {
  it("keeps each pathSuffix consistent with its state/city", () => {
    for (const option of JURISDICTION_OPTIONS) {
      const expected = option.city
        ? `/${option.state}/${option.city}`
        : `/${option.state}`;
      expect(option.pathSuffix).toBe(expected);
    }
  });
});
