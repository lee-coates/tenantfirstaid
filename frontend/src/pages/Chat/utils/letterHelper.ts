import {
  CitySelectOptions,
  type CitySelectOptionType,
} from "../components/CitySelectField";

interface IBuildLetterReturnType {
  userMessage: string;
  selectedLocation: CitySelectOptionType;
}

function buildLetterUserMessage(
  org: string,
  loc: string | undefined,
): IBuildLetterReturnType | null {
  const selectedLocation = CitySelectOptions[loc || "oregon"];
  if (selectedLocation === undefined) return null;
  const locationString =
    selectedLocation.city && selectedLocation.state
      ? `${selectedLocation.city}, ${selectedLocation.state}`
      : selectedLocation.city || selectedLocation.state?.toUpperCase() || "";

  return {
    userMessage: `Hello, I've been redirected from ${org}. I wish to draft a letter related to housing assistance for my area${locationString ? ` (${locationString})` : ""}, start generating a template letter for me. Update the letter as we discuss. Update my location in the letter.`,
    selectedLocation,
  };
}

export { buildLetterUserMessage };
