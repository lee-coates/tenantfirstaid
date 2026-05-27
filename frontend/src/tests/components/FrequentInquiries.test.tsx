import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import FrequentInquiries from "../../pages/Chat/components/FrequentInquiries";

describe("FrequentInquiries", () => {
  it("renders the first inquiry expanded by default", () => {
    render(<FrequentInquiries />);

    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).toHaveAttribute("aria-expanded", "true");
    buttons.slice(1).forEach((b) => {
      expect(b).toHaveAttribute("aria-expanded", "false");
    });
  });

  it("collapses the open inquiry when its header is clicked again", () => {
    render(<FrequentInquiries />);

    const firstButton = screen.getAllByRole("button")[0];
    expect(firstButton).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(firstButton);
    expect(firstButton).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps only one inquiry open at a time", () => {
    render(<FrequentInquiries />);

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
});
