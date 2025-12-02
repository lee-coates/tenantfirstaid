import {
  CitySelectOptions,
  type CitySelectOptionType,
} from "../../Chat/components/CitySelectField";

interface IBuildLetterReturnType {
  userMessage: string;
  selectedLocation: CitySelectOptionType;
}

function buildLetterUserMessage(
  org: string | undefined,
  loc: string | undefined
): IBuildLetterReturnType | null {
  const selectedLocation = CitySelectOptions[loc || "oregon"];
  if (selectedLocation === undefined) return null;
  const locationString =
    selectedLocation.city && selectedLocation.state
      ? `${selectedLocation.city}, ${selectedLocation.state}`
      : selectedLocation.city || selectedLocation.state?.toUpperCase() || "";
  const sanitizedOrg = org
    ?.replace(/[<>'"{}[\]]/g, "")
    .trim()
    .slice(0, 100);
  const promptParts = [
    sanitizedOrg && `Hello, I've been redirected from ${sanitizedOrg}.`,
    `Draft a letter related to housing issues for my area${locationString ? ` (${locationString})` : ""} to my landlord.`,
    `The issue could be maintenance issues, unsafe conditions, or anything else affecting my home, use a broken faucet as an example.`,
    `Use the information in this prompt to generate a letter to my landlord.`,
    `Do not ask for additional information until the letter is generated.`,
    `Update the letter as we discuss.`,
    `Update all placeholders for city and state in the letter with${locationString ? ` (${locationString})` : ""}`,
    `When all but the signature placeholder have been replaced, please confirm that I have proof-read the letter for accuracy in content and tone,`,
    `provide instructions for how to copy and paste(formatted) the letter from the browser into a application of my choice,`,
    `the necessary and optional notification / deliveries to the recipient(s), and retention / receipt best practices.`,
    sanitizedOrg &&
      `Have the user follow the steps mention from ${sanitizedOrg} first after letter completion, if there were any.`,
  ];

  return {
    userMessage: promptParts.join(" ").trim(),
    selectedLocation,
  };
}

export { buildLetterUserMessage };
