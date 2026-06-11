import type { Location } from "../../types/models";
import {
  DEFAULT_JURISDICTION,
  JURISDICTION_OPTIONS,
  type JurisdictionOption,
} from "../constants/jurisdictions";

const KNOWN_STATES = new Set<string>(JURISDICTION_OPTIONS.map((o) => o.state));

// US state (plus DC) postal codes, used to tell a real out-of-state request
// apart from a legacy /letter/:org slug that just happens not to be a state.
const US_STATE_CODES = new Set<string>([
  "al",
  "ak",
  "az",
  "ar",
  "ca",
  "co",
  "ct",
  "de",
  "dc",
  "fl",
  "ga",
  "hi",
  "id",
  "il",
  "in",
  "ia",
  "ks",
  "ky",
  "la",
  "me",
  "md",
  "ma",
  "mi",
  "mn",
  "ms",
  "mo",
  "mt",
  "ne",
  "nv",
  "nh",
  "nj",
  "nm",
  "ny",
  "nc",
  "nd",
  "oh",
  "ok",
  "or",
  "pa",
  "ri",
  "sc",
  "sd",
  "tn",
  "tx",
  "ut",
  "vt",
  "va",
  "wa",
  "wv",
  "wi",
  "wy",
]);

/**
 * True when a URL segment names a supported state, used to tell a new
 * /letter/:state/:city path apart from a legacy /letter/:org/:loc path.
 */
function isKnownState(segment: string | undefined): boolean {
  return segment !== undefined && KNOWN_STATES.has(segment.toLowerCase());
}

type StateSegmentKind = "supported" | "out-of-state" | "unknown";

/**
 * Classifies a URL state segment so /chat and /letter can route it:
 * - "supported": a state we serve (or an absent segment, defaulting to Oregon).
 * - "out-of-state": a real US state we don't serve yet.
 * - "unknown": anything else (a legacy /letter org slug or a typo).
 */
function classifyStateSegment(segment: string | undefined): StateSegmentKind {
  if (segment === undefined || isKnownState(segment)) return "supported";
  if (US_STATE_CODES.has(segment.toLowerCase())) return "out-of-state";
  return "unknown";
}

/**
 * Resolves URL :state/:city segments to a jurisdiction.
 * A missing/unknown state or an unknown city falls back to Oregon at large.
 */
function resolveJurisdiction(
  stateParam?: string,
  cityParam?: string,
): JurisdictionOption {
  const state = stateParam?.toLowerCase();
  const city = cityParam?.toLowerCase() ?? null;
  if (state === undefined) return DEFAULT_JURISDICTION;
  return (
    JURISDICTION_OPTIONS.find(
      (o) => o.state === state && (o.city ?? null) === city,
    ) ??
    JURISDICTION_OPTIONS.find((o) => o.state === state && o.city === null) ??
    DEFAULT_JURISDICTION
  );
}

/**
 * Derives the active jurisdiction from a /chat or /letter pathname.
 * Lets the navbar (rendered outside the route tree, so it can't use useParams)
 * read the jurisdiction straight from the URL on first paint. Non-feature paths
 * fall back to Oregon at large.
 */
function jurisdictionFromPathname(pathname: string): JurisdictionOption {
  const match = pathname.match(/^\/(?:chat|letter)\/([^/]+)(?:\/([^/]+))?/);
  if (match === null) return DEFAULT_JURISDICTION;
  return resolveJurisdiction(match[1], match[2]);
}

/**
 * Looks up a jurisdiction by its key. Accepts an arbitrary string (e.g. a
 * legacy /letter/:loc segment, which shares the JurisdictionKey naming) and
 * falls back to Oregon at large for null/unknown values.
 */
function jurisdictionByKey(key: string | null | undefined): JurisdictionOption {
  const normalized = key?.toLowerCase() ?? null;
  return (
    JURISDICTION_OPTIONS.find((o) => o.key === normalized) ??
    DEFAULT_JURISDICTION
  );
}

function toLocation(option: JurisdictionOption): Location {
  return { state: option.state, city: option.city };
}

/**
 * Builds the path for a jurisdiction-carrying feature route,
 * e.g. pathFor("letter", portland) -> "/letter/or/portland".
 */
function pathFor(
  feature: "chat" | "letter",
  jurisdiction: JurisdictionOption,
  search = "",
): string {
  return `/${feature}${jurisdiction.pathSuffix}${search}`;
}

export {
  isKnownState,
  classifyStateSegment,
  resolveJurisdiction,
  jurisdictionFromPathname,
  jurisdictionByKey,
  toLocation,
  pathFor,
};
