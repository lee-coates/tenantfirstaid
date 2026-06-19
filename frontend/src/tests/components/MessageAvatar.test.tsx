import { render } from "@testing-library/react";
import MessageAvatar from "../../pages/Chat/components/MessageAvatar";

describe("MessageAvatar component", () => {
  it("renders the mascot themed avatar for AI", () => {
    const { container } = render(<MessageAvatar type="ai" />);
    expect(container.firstChild).toHaveClass(
      "bg-paper-background",
      "border-green-medium",
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders the user themed avatar for human", () => {
    const { container } = render(<MessageAvatar type="human" />);
    expect(container.firstChild).toHaveClass("bg-green-dark");
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders the system themed avatar for UI", () => {
    const { container } = render(<MessageAvatar type="ui" />);
    expect(container.firstChild).toHaveClass(
      "bg-slate-200",
      "border-slate-400",
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
