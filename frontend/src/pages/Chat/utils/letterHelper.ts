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
  const sanitizedOrg = org
    .replace(/[<>'"{}[\]]/g, "")
    .trim()
    .slice(0, 100);
  const promptParts = [
    `Hello, I've been redirected from ${sanitizedOrg}.`,
    `Draft a letter related to housing issues for my area${locationString ? ` (${locationString})` : ""} to my landlord.`,
    `Use the information in this prompt to generate a letter to my landlord.`,
    `The issue could be maintenance issues, unsafe conditions, or anything else affecting my home, use a broken faucet as an example.`,
    `Update the letter as we discuss.`,
    `Update all placeholders for city and state in the letter with${locationString ? ` (${locationString})` : ""}`,
  ];

  return {
    userMessage: promptParts.join(" "),
    selectedLocation,
  };
}

export { buildLetterUserMessage };
