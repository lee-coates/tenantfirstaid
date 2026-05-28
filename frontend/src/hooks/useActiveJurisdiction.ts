import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useHousingContext from "./useHousingContext";
import {
  JURISDICTION_OPTIONS,
  type JurisdictionOption,
} from "../shared/constants/jurisdictions";
import {
  jurisdictionFromPathname,
  toLocation,
} from "../shared/utils/jurisdiction";

/**
 * Exposes the active jurisdiction (read from the URL, defaulting to Oregon at
 * large) and a `selectLocation` action used by the navbar/sidebar location
 * picker. Selecting a location keeps the user on their current feature (chat
 * or letter) by navigating within it.
 */
export default function useActiveJurisdiction() {
  const { handleCityChange, handleHousingLocation } = useHousingContext();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const active = jurisdictionFromPathname(pathname);

  const selectLocation = useCallback(
    (option: JurisdictionOption) => {
      handleCityChange(option.key);
      handleHousingLocation(toLocation(option));
      if (pathname.startsWith("/letter")) {
        navigate(`/letter${option.pathSuffix}`);
      } else if (pathname.startsWith("/chat")) {
        navigate(`/chat${option.pathSuffix}`);
      }
    },
    [handleCityChange, handleHousingLocation, navigate, pathname],
  );

  return { active, options: JURISDICTION_OPTIONS, selectLocation };
}
