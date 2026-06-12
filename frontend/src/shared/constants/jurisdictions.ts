import type { OregonCity, UsaState } from "../../types/models";

export type JurisdictionKey = "oregon" | "portland" | "eugene";

export interface JurisdictionOption {
  key: JurisdictionKey;
  label: string;
  /** State abbreviation matching the backend UsaState (e.g. "or"). */
  state: UsaState;
  /** City within the state, or null for "state at large". */
  city: OregonCity | null;
  /** Path appended after /chat or /letter, e.g. "/or/portland". */
  pathSuffix: string;
}

/**
 * Selectable jurisdictions, ordered for navbar menus and the chat form.
 * The first entry doubles as the default fallback (Oregon at large).
 * Adding a new state (e.g. Washington) is purely additive here.
 */
export const JURISDICTION_OPTIONS: JurisdictionOption[] = [
  {
    key: "oregon",
    label: "Oregon",
    state: "or",
    city: null,
    pathSuffix: "/or",
  },
  {
    key: "portland",
    label: "Portland",
    state: "or",
    city: "portland",
    pathSuffix: "/or/portland",
  },
  {
    key: "eugene",
    label: "Eugene",
    state: "or",
    city: "eugene",
    pathSuffix: "/or/eugene",
  },
];

export const DEFAULT_JURISDICTION = JURISDICTION_OPTIONS[0];
