import { IMessage } from "../../../hooks/useMessages";
import BeaverIcon from "../../../shared/components/BeaverIcon";
import { useEffect, useState } from "react";
import { buildChatUserMessage } from "../utils/formHelper";
import { streamText } from "../utils/streamHelper";
import SelectField from "./SelectField";
import { Link } from "react-router-dom";
import useHousingContext from "../../../hooks/useHousingContext";

export interface CitySelectOptionType {
  city: string | null;
  state: string | null;
  label: string;
}

const CitySelectOptions: Record<string, CitySelectOptionType> = {
  portland: {
    city: "portland",
    state: "or",
    label: "Portland",
  },
  eugene: {
    city: "eugene",
    state: "or",
    label: "Eugene",
  },
  oregon: {
    city: null,
    state: "or",
    label: "Other city in Oregon",
  },
  other: {
    city: null,
    state: null,
    label: "City in another state",
  },
};

const HousingOptions = [
  "Apartment/House Rental",
  "Manufactured/Mobile Home",
  "RV/Tiny Home (on wheels)",
  "Room Rental/Shared Housing",
  "Other",
];

const TopicOptions = [
  "Eviction and Notices",
  "Repairs and Conditions",
  "Security Deposits and Fees",
  "Rent Issues",
  "Entry and Privacy",
  "Discrimination/Fair Housing",
  "Lease/Rental Agreement",
  "Manufacture Home Park Issues",
  "Other",
];

export { CitySelectOptions };

interface Props {
  addMessage: (args: {
    city: string | null;
    state: string;
  }) => Promise<ReadableStreamDefaultReader<Uint8Array> | undefined>;
  setMessages: React.Dispatch<React.SetStateAction<IMessage[]>>;
}

export default function InitializationForm({ addMessage, setMessages }: Props) {
  const {
    housingLocation,
    city,
    housingType,
    tenantTopic,
    issueDescription,
    handleHousingLocation,
    handleCityChange,
    handleHousingChange,
    handleTenantTopic,
    handleIssueDescription,
  } = useHousingContext();
  const [initialUserMessage, setInitialUserMessage] = useState("");
  const locationString = city
    ? city.charAt(0).toUpperCase() + city.slice(1)
    : null;

  const handleLocationChange = (key: string | null) => {
    handleCityChange(key);
    handleHousingLocation({
      city:
        CitySelectOptions[key as keyof typeof CitySelectOptions]?.city || null,
      state:
        CitySelectOptions[key as keyof typeof CitySelectOptions]?.state || null,
    });
  };

  const handleInitialInput = async () => {
    // Initial user message
    const userMessageId = Date.now().toString();
    setMessages((prev) => [
      ...prev,
      { role: "user", content: initialUserMessage, messageId: userMessageId },
    ]);

    await streamText({
      addMessage,
      setMessages,
      housingLocation,
    });
  };

  useEffect(() => {
    const { userMessage: initialUserMessage } = buildChatUserMessage(
      housingLocation,
      housingType,
      tenantTopic,
      issueDescription,
    );
    setInitialUserMessage(initialUserMessage);
  }, [housingLocation, issueDescription, housingType, tenantTopic]);

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        handleInitialInput();
      }}
    >
      <div className="flex px-4 gap-4 items-center">
        <div>
          <BeaverIcon />
        </div>
        <div className="w-full">
          <p className="text-center text-[#888]">
            {city === "other"
              ? "Unfortunately, we can only answer questions related to tenant rights in Oregon at this time."
              : `Welcome to Tenant First Aid! ${locationString ? `I can help answer your questions about tenant rights in ${locationString}.` : "Start by filling the form below."}`}
          </p>
        </div>
      </div>

      <SelectField
        name="city"
        value={city || ""}
        description="Select your location"
        handleFunction={handleLocationChange}
      >
        {Object.entries(CitySelectOptions).map(([key, option]) => (
          <option key={key} value={key}>
            {option.label}
          </option>
        ))}
      </SelectField>
      <SelectField
        name="housing type"
        value={housingType || ""}
        description="Select your housing type"
        handleFunction={handleHousingChange}
      >
        {HousingOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </SelectField>
      <SelectField
        name="tenant topic"
        value={tenantTopic || ""}
        description="Select your topic"
        handleFunction={handleTenantTopic}
      >
        {TopicOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </SelectField>
      <div>
        <textarea
          className="resize-none h-[80%] w-full border transition-colors duration-300 focus:outline-0 focus:border-[#4a90e2] focus:shadow-[0_0_0_2px_rgba(74,144,226,0.2)]"
          placeholder="Briefly describe your specific housing situation or question about housing."
          onChange={handleIssueDescription}
          required
        />
      </div>

      <div className="flex justify-center gap-4">
        <button
          className={`border border-[#1F584F] text-[#1F584F] hover:bg-[#E8EEE2] transition-colors
            ${city === "other" ? "opacity-50" : ""}`}
          style={{
            cursor: city === "other" ? "not-allowed" : "pointer",
          }}
          type="submit"
          aria-label="enter chat"
          title="Enter Chat"
          disabled={city === "other"}
        >
          Start Chat
        </button>
        {housingLocation &&
          housingType &&
          tenantTopic &&
          tenantTopic !== "Eviction and Notices" &&
          issueDescription && (
            <Link
              to="letter"
              className={`flex items-center border rounded-md font-semibold py-1 px-4 border-[#4a90e2] text-[#4a90e2] hover:bg-[#E6F0FB] transition-colors
            ${city === "other" ? "opacity-50" : ""}`}
              style={{
                cursor: city === "other" ? "not-allowed" : "pointer",
              }}
              aria-label="generate letter"
              title="Generate Letter"
            >
              Generate Letter
            </Link>
          )}
      </div>
    </form>
  );
}
