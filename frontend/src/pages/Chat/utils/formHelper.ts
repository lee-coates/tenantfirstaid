import { ILocation } from "../../../contexts/HousingContext";

interface IChatFormReturnType {
  userMessage: string;
}

function buildChatUserMessage(
  loc: ILocation,
  housingType: string | null,
  tenantTopic: string | null,
  issueDescription: string,
): IChatFormReturnType {
  const locationString =
    loc.city && loc.state
      ? `${loc.city}, ${loc.state}`
      : loc.city || loc.state?.toUpperCase() || "";

  const promptParts = [
    `I'm a tenant located in ${locationString ? `${locationString}` : ""}.`,
    `I currently reside the following housing type: ${housingType}.`,
    `I would like to ask you about ${tenantTopic}.`,
    `Can you help me with the following issue or question: ${issueDescription}`,
  ];

  return {
    userMessage: promptParts.join(" ").trim(),
  };
}

export { buildChatUserMessage };
