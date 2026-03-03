import type { TOregonCity, TUsaState } from "../../types/LocationTypes";

/**
 * Formats a city and state into a human-readable location string.
 *
 * @returns A display string like "Portland, OR", "OR", or "" if both are null.
 */
function formatLocation(
  city: TOregonCity | null,
  state: TUsaState | null,
): string {
  const cityDisplay = city
    ? city.charAt(0).toUpperCase() + city.slice(1)
    : null;
  const stateDisplay = state && state !== "other" ? state.toUpperCase() : null;

  return [cityDisplay, stateDisplay].filter(Boolean).join(", ");
}

export { formatLocation };
