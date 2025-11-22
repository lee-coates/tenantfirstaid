import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MessageWindow from "../../pages/Chat/components/MessageWindow";
import { IMessage } from "../../hooks/useMessages";

beforeAll(() => {
  if (!("scrollTo" in HTMLElement.prototype)) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    HTMLElement.prototype.scrollTo = function () {};
  }
});

describe("MessageWindow component", () => {
  const messages: IMessage[] = [
    { role: "user", content: "first message", messageId: "1" },
    { role: "model", content: "second message", messageId: "2" },
    { role: "user", content: "third message", messageId: "3" },
  ];

  const defaultProps = {
    messages,
    addMessage: vi.fn(),
    setMessages: vi.fn(),
    location: { city: "portland", state: "or" },
    setLocation: vi.fn(),
    isOngoing: true,
  };

  it("hides first 2 messages on letter page", () => {
    render(
      <MemoryRouter initialEntries={["/letter/some-org"]}>
        <MessageWindow {...defaultProps} />
      </MemoryRouter>,
    );

    expect(screen.queryByText("first message")).toBeNull();
    expect(screen.queryByText("second message")).toBeNull();
    expect(screen.getByText("third message")).toBeInTheDocument();
  });

  it("shows all messages on non-letter pages", () => {
    render(
      <MemoryRouter initialEntries={["/chat"]}>
        <MessageWindow {...defaultProps} />
      </MemoryRouter>,
    );

    expect(screen.getByText("first message")).toBeInTheDocument();
    expect(screen.getByText("second message")).toBeInTheDocument();
    expect(screen.getByText("third message")).toBeInTheDocument();
  });
});
