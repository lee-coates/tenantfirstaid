import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import FrequentInquiries from "../../pages/Chat/components/FrequentInquiries";
import HousingContextProvider from "../../contexts/HousingContext";

const renderPanel = (entry = "/chat/or") =>
  render(
    <HousingContextProvider>
      <MemoryRouter initialEntries={[entry]}>
        <FrequentInquiries />
      </MemoryRouter>
    </HousingContextProvider>,
  );

describe("FrequentInquiries", () => {
  it("renders the first inquiry expanded by default", () => {
    renderPanel();

    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).toHaveAttribute("aria-expanded", "true");
    buttons.slice(1).forEach((b) => {
      expect(b).toHaveAttribute("aria-expanded", "false");
    });
  });

  it("collapses the open inquiry when its header is clicked again", () => {
    renderPanel();

    const firstButton = screen.getAllByRole("button")[0];
    expect(firstButton).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(firstButton);
    expect(firstButton).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps only one inquiry open at a time", () => {
    renderPanel();

    const buttons = screen.getAllByRole("button");
    // First is open by default.
    expect(buttons[0]).toHaveAttribute("aria-expanded", "true");

    // Open the second inquiry.
    fireEvent.click(buttons[1]);

    expect(buttons[0]).toHaveAttribute("aria-expanded", "false");
    expect(buttons[1]).toHaveAttribute("aria-expanded", "true");
    buttons.slice(2).forEach((b) => {
      expect(b).toHaveAttribute("aria-expanded", "false");
    });
  });

  it("shows no city-specific note or Statewide label for Oregon at large", () => {
    renderPanel("/chat/or");

    expect(screen.queryByText("Statewide:")).not.toBeInTheDocument();
    expect(screen.queryByText("Portland:")).not.toBeInTheDocument();
    expect(screen.queryByText("Eugene:")).not.toBeInTheDocument();
    expect(screen.queryByText(/68°F/)).not.toBeInTheDocument();
  });

  it("shows Portland-specific guidance on a Portland route", () => {
    renderPanel("/chat/or/portland");

    expect(screen.getAllByText("Portland:").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Statewide:").length).toBeGreaterThan(0);
    expect(screen.queryByText("Eugene:")).not.toBeInTheDocument();
    expect(
      screen.getAllByText(/relocation assistance/i).length,
    ).toBeGreaterThan(0);
  });

  it("shows Eugene-specific guidance on a Eugene route", () => {
    renderPanel("/chat/or/eugene");

    expect(screen.getAllByText("Eugene:").length).toBeGreaterThan(0);
    expect(screen.getByText(/68°F/)).toBeInTheDocument();
    expect(screen.queryByText("Portland:")).not.toBeInTheDocument();
  });

  it("associates each question button with an existing answer panel", () => {
    renderPanel();

    screen.getAllByRole("button").forEach((b) => {
      const panelId = b.getAttribute("aria-controls") ?? "";
      expect(panelId).not.toBe("");
      expect(document.getElementById(panelId)).toBeInTheDocument();
    });
  });

  it("marks collapsed answer panels inert and the open one interactive", () => {
    renderPanel();
    const buttons = screen.getAllByRole("button");

    // The first inquiry is open by default; its panel must stay interactive.
    const openPanel = document.getElementById(
      buttons[0].getAttribute("aria-controls") ?? "",
    );
    expect(openPanel).not.toHaveAttribute("inert");

    // A collapsed inquiry's panel is inert, so its citation links are removed
    // from the tab order and the accessibility tree while hidden.
    const closedPanel = document.getElementById(
      buttons[1].getAttribute("aria-controls") ?? "",
    );
    expect(closedPanel).toHaveAttribute("inert");
  });
});
