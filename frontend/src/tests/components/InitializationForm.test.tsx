import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import InitializationForm from "../../pages/Chat/components/InitializationForm";
import HousingContextProvider from "../../contexts/HousingContext";
import useSyncJurisdiction from "../../hooks/useSyncJurisdiction";
import { MemoryRouter, Routes, Route } from "react-router-dom";

vi.mock("../../pages/Chat/utils/streamHelper", () => ({
  streamText: vi.fn(),
}));

// Mirror Chat: the jurisdiction comes from the URL (navbar picker), not the
// form, so seed it from the route params the way Chat does.
function FormHarness() {
  useSyncJurisdiction();
  return <InitializationForm addMessage={vi.fn()} setMessages={vi.fn()} />;
}

const renderInitializationForm = (entry = "/chat") => {
  render(
    <MemoryRouter initialEntries={[entry]}>
      <HousingContextProvider>
        <Routes>
          <Route path="/chat/:state?/:city?" element={<FormHarness />} />
        </Routes>
      </HousingContextProvider>
    </MemoryRouter>,
  );
};

const fillLetterForm = () => {
  fireEvent.change(screen.getByLabelText("housing type"), {
    target: { value: "Apartment/House Rental" },
  });
  fireEvent.change(screen.getByLabelText("tenant topic"), {
    target: { value: "Rent Issues" },
  });
  fireEvent.change(
    screen.getByPlaceholderText(/briefly describe your specific/i),
    { target: { value: "My landlord won't repair the heat" } },
  );
};

describe("InitializationForm", () => {
  it("renders the form fields (no location selector)", () => {
    renderInitializationForm();

    expect(screen.getByLabelText("housing type")).toBeInTheDocument();
    expect(screen.getByLabelText("tenant topic")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/briefly describe your specific/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "enter chat" }),
    ).toBeInTheDocument();

    // Location is controlled by the navbar picker, not the form.
    expect(screen.queryByLabelText("city")).not.toBeInTheDocument();
  });

  it("updates context on field changes", async () => {
    renderInitializationForm();

    const housingSelect = screen.getByLabelText("housing type");
    const topicSelect = screen.getByLabelText("tenant topic");
    const issueInput = screen.getByPlaceholderText(
      /briefly describe your specific/i,
    );

    fireEvent.change(housingSelect, {
      target: { value: "Apartment/House Rental" },
    });
    await waitFor(() => {
      expect(housingSelect).toHaveValue("Apartment/House Rental");
    });

    fireEvent.change(topicSelect, { target: { value: "Rent Issues" } });
    await waitFor(() => {
      expect(topicSelect).toHaveValue("Rent Issues");
    });

    fireEvent.change(issueInput, {
      target: { value: "My landlord won't repair the heat" },
    });
    await waitFor(() => {
      expect(issueInput).toHaveValue("My landlord won't repair the heat");
    });
  });

  it("shows/hides Generate Letter button correctly", async () => {
    renderInitializationForm();

    // Hides generate letter by default
    expect(
      screen.queryByRole("link", { name: "generate letter" }),
    ).not.toBeInTheDocument();

    fillLetterForm();

    await waitFor(() => {
      expect(
        screen.queryByRole("link", { name: "generate letter" }),
      ).toBeInTheDocument();
    });

    // Hides generate letter for Eviction and Notices
    fireEvent.change(screen.getByLabelText("tenant topic"), {
      target: { value: "Eviction and Notices" },
    });

    await waitFor(() => {
      expect(
        screen.queryByRole("link", { name: "generate letter" }),
      ).not.toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("tenant topic"), {
      target: { value: "Rent Issues" },
    });

    await waitFor(() => {
      expect(
        screen.queryByRole("link", { name: "generate letter" }),
      ).toBeInTheDocument();
    });
  });

  it("Generate Letter link carries the active jurisdiction from the URL", async () => {
    renderInitializationForm("/chat/or/portland");
    fillLetterForm();

    await waitFor(() => {
      expect(
        screen.getByRole("link", { name: "generate letter" }),
      ).toHaveAttribute("href", "/letter/or/portland");
    });
  });
});
