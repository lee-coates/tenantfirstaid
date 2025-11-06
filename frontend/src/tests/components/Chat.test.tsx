import { render, cleanup, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, afterEach, beforeAll } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Chat from "../../Chat";

beforeAll(() => {
  if (!("scrollTo" in HTMLElement.prototype)) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    HTMLElement.prototype.scrollTo = function () {};
  }
});

let mockUseMessagesReturn: object;
let mockUseLocationReturn: object;

vi.mock("../../hooks/useMessages", () => ({
  default: () => mockUseMessagesReturn,
}));

vi.mock("../../hooks/useLocation", () => ({
  default: () => mockUseLocationReturn,
}));

vi.mock("../../pages/Chat/components/MessageWindow", () => ({
  default: () => <div data-testid="message-window-stub" />,
}));

const mockMessages1 = [
  { content: "some text", role: "model", messageId: 1 },
  { content: "some text", role: "user", messageId: 2 },
  {
    content: "some text-----generate letter-----<p>Letter HTML</p>",
    role: "model",
    messageId: 3,
  },
];

const mockMessages2 = [
  { content: "some text", role: "model", messageId: 1 },
  { content: "some text", role: "user", messageId: 2 },
  {
    content: "some text",
    role: "model",
    messageId: 3,
  },
];

describe("Chat generated-letter block", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders .generated-letter when a message contains the separator", async () => {
    mockUseMessagesReturn = {
      addMessage: vi.fn(),
      messages: mockMessages1,
      setMessages: vi.fn(),
    };
    mockUseLocationReturn = {
      location: null,
      setLocation: vi.fn(),
    };

    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <Chat />
      </QueryClientProvider>,
    );

    await waitFor(() =>
      expect(document.querySelector(".generated-letter")).not.toBeNull(),
    );
  });

  it("does not render .generated-letter when no message contains the separator", async () => {
    mockUseMessagesReturn = {
      addMessage: vi.fn(),
      messages: mockMessages2,
      setMessages: vi.fn(),
    };
    mockUseLocationReturn = {
      location: null,
      setLocation: vi.fn(),
    };

    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <Chat />
      </QueryClientProvider>,
    );

    await waitFor(() =>
      expect(document.querySelector(".generated-letter")).toBeNull(),
    );
  });
});
