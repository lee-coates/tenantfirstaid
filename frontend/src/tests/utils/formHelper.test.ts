import { describe, it, expect } from "vitest";
import { buildChatUserMessage } from "../../pages/Chat/utils/formHelper";
import { ILocation } from "../../contexts/HousingContext";

describe("buildChatUserMessage", () => {
  it("builds message with all fields populated", () => {
    const location: ILocation = {
      city: "portland",
      state: "or",
    };
    const housingType = "Apartment/House Rental";
    const tenantTopic = "Eviction and Notices";
    const issueDescription = "My landlord served me an eviction notice";

    const result = buildChatUserMessage(
      location,
      housingType,
      tenantTopic,
      issueDescription,
    );

    expect(result.userMessage).toContain("portland, or");
    expect(result.userMessage).toContain("Apartment/House Rental");
    expect(result.userMessage).toContain("Eviction and Notices");
    expect(result.userMessage).toContain(
      "My landlord served me an eviction notice",
    );
  });

  it("handles null city gracefully", () => {
    const location: ILocation = {
      city: null,
      state: "or",
    };
    const housingType = "Apartment/House Rental";
    const tenantTopic = "Rent Issues";
    const issueDescription = "Rent increase";

    const result = buildChatUserMessage(
      location,
      housingType,
      tenantTopic,
      issueDescription,
    );

    expect(result.userMessage).toContain("OR.");
    expect(result.userMessage).not.toContain("null");
  });

  it("includes all prompt parts", () => {
    const location: ILocation = {
      city: "portland",
      state: "or",
    };
    const housingType = "Apartment/House Rental";
    const tenantTopic = "Eviction and Notices";
    const issueDescription = "My landlord served me an eviction notice";

    const result = buildChatUserMessage(
      location,
      housingType,
      tenantTopic,
      issueDescription,
    );

    const message = result.userMessage;

    expect(message).toContain("I'm a tenant located in");
    expect(message).toContain(
      "I currently reside in the following housing type:",
    );
    expect(message).toContain("I would like to ask you about");
    expect(message).toContain(
      "Can you help me with the following issue or question:",
    );
  });
});
