import type { OregonCity, UsaState } from "../../types/models";
import { formatLocation } from "./formatLocation";

/**
 * Returns "I'm in <city, state>." if location is set, otherwise "".
 */
function buildLocationPrefix(
  city: OregonCity | null | undefined,
  state: UsaState | null | undefined,
): string {
  const locationString = formatLocation(city, state);
  return locationString ? `I'm in ${locationString}.` : "";
}

export { buildLocationPrefix };
