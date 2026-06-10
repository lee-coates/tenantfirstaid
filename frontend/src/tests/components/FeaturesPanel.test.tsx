import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import FeaturesPanel from "../../shared/components/FeaturesPanel";

// MobilePanel uses window.matchMedia to watch the lg breakpoint.
vi.stubGlobal(
  "matchMedia",
  vi.fn().mockReturnValue({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }),
);

const renderPanel = (disclaimer = <p>Disclaimer text</p>) =>
  render(<FeaturesPanel disclaimer={disclaimer} />);

describe("FeaturesPanel", () => {
  it("renders open by default", () => {
    renderPanel();
    expect(getToggle()).toHaveAttribute("aria-expanded", "true");
  });

  it("renders features content", () => {
    renderPanel();
    expect(
      screen.getByText(/instant answers to common rental questions/i),
    ).toBeInTheDocument();
  });

  it("renders the disclaimer prop", () => {
    renderPanel(<p>Custom disclaimer</p>);
    expect(screen.getByText("Custom disclaimer")).toBeInTheDocument();
  });

  it("closes when the toggle button is clicked", () => {
    renderPanel();
    fireEvent.click(getToggle());
    expect(getToggle()).toHaveAttribute("aria-expanded", "false");
  });

  it("reopens when the toggle button is clicked a second time", () => {
    renderPanel();
    fireEvent.click(getToggle());
    fireEvent.click(getToggle());
    expect(getToggle()).toHaveAttribute("aria-expanded", "true");
  });

  it("applies opacity class to content when closed", () => {
    const { container } = renderPanel();
    fireEvent.click(getToggle());
    const contentWrapper = container.querySelector(".lg\\:opacity-0");
    expect(contentWrapper).toBeInTheDocument();
  });

  it("removes opacity class from content when open", () => {
    const { container } = renderPanel();
    const contentWrapper = container.querySelector(".lg\\:opacity-0");
    expect(contentWrapper).not.toBeInTheDocument();
  });
});

function getToggle() {
  return screen.getByRole("button", { name: /toggle features panel/i });
}
