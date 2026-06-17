const CONTACT_EMAIL = "michael@qiu-qiulaw.com";

const REFERENCED_LAW_LIST = {
  "ORS 90": {
    link: "https://www.oregonlegislature.gov/bills_laws/ors/ors090.html",
    label: "ORS 90 (as amended 2023)",
  },
  "ORS 105": {
    link: "https://www.oregonlegislature.gov/bills_laws/ors/ors105.html",
    label: "ORS 105",
  },
  "Section 8.425": {
    link: "https://eugene.municipal.codes/EC/8.425",
    label: "Eugene Code Section 8.425",
  },
  "City Code Title 30": {
    link: "https://www.portland.gov/code/30/all",
    label: "Portland City Code Title 30",
  },
};

// Feature links whose target carries the active jurisdiction (see the navbar
// location picker), e.g. Chat -> /chat/or/portland.
const NAVBAR_FEATURES = [
  { label: "Chat", feature: "chat" },
  { label: "Letter", feature: "letter" },
] as const;

const NAVBAR_LINKS = [
  { to: "/about", label: "About Tenant First Aid" },
  { to: "/disclaimer", label: "Disclaimer" },
  { to: "/privacy-policy", label: "Privacy Policy" },
];

export { CONTACT_EMAIL, REFERENCED_LAW_LIST, NAVBAR_LINKS, NAVBAR_FEATURES };
