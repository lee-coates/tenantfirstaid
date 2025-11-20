import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import About from "../../About";

describe("About component", () => {
  it("renders without crashing", () => {
    render(<About />);
    expect(screen.getByText("About Tenant First Aid")).not.toBeNull();
  });

  it("displays legal disclaimer section", () => {
    render(<About />);
    expect(
      screen.getByText("Legal Disclaimer & Privacy Notice"),
    ).not.toBeNull();
  });

  it("displays contact information", () => {
    render(<About />);
    expect(screen.getByText("michael@qiu-qiulaw.com")).not.toBeNull();
  });
});
