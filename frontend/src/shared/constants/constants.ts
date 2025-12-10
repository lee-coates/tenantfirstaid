const CONTACT_EMAIL = "michael@qiu-qiulaw.com";

interface CitySelectOptionType {
  city: string | null;
  state: string | null;
  label: string;
}

const CITY_SELECT_OPTIONS: Record<string, CitySelectOptionType> = {
  portland: {
    city: "Portland",
    state: "OR",
    label: "Portland",
  },
  eugene: {
    city: "Eugene",
    state: "OR",
    label: "Eugene",
  },
  oregon: {
    city: null,
    state: "OR",
    label: "Other city in Oregon",
  },
  other: {
    city: null,
    state: null,
    label: "City in another state",
  },
};

const HOUSING_OPTIONS = [
  "Apartment/House Rental",
  "Manufactured/Mobile Home",
  "RV/Tiny Home (on wheels)",
  "Room Rental/Shared Housing",
  "Other",
];

const TOPIC_OPTIONS = [
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

export { CITY_SELECT_OPTIONS, HOUSING_OPTIONS, TOPIC_OPTIONS, CONTACT_EMAIL };

export type { CitySelectOptionType };
