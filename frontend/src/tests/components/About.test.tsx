import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import About from "../../About";
import { MemoryRouter } from "react-router-dom";

describe("About component", () => {
  it("renders without crashing", () => {
    render(
      <MemoryRouter>
        <About />
      </MemoryRouter>,
    );
    expect(screen.getAllByText("About Tenant First Aid")).not.toBeNull();
  });

  it("displays legal disclaimer section", () => {
    render(
      <MemoryRouter>
        <About />
      </MemoryRouter>,
    );
    expect(
      screen.getAllByText("Legal Disclaimer & Privacy Notice"),
    ).not.toBeNull();
  });

  it("displays contact information", () => {
    render(
      <MemoryRouter>
        <About />
      </MemoryRouter>,
    );
    expect(screen.getAllByText("michael@qiu-qiulaw.com")).not.toBeNull();
  });
});
