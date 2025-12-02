import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import {
  vi,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
} from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { CitySelectOptions } from "../../pages/Chat/components/CitySelectField";
import { IMessage } from "../../hooks/useMessages";

beforeAll(() => {
  if (!("scrollTo" in HTMLElement.prototype)) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    HTMLElement.prototype.scrollTo = function () {};
  }
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

const mockStreamText = vi.fn();
const mockUseMessages = vi.fn();
const mockUseLocation = vi.fn();

vi.mock("../../pages/Chat/utils/streamHelper", () => ({
  streamText: mockStreamText,
}));

vi.mock("../../hooks/useMessages", () => ({
  default: mockUseMessages,
}));

vi.mock("../../hooks/useLocation", () => ({
  default: mockUseLocation,
}));

vi.mock("../../hooks/useLetterContent", () => ({
  useLetterContent: () => ({ letterContent: "" }),
}));

vi.mock("../../pages/Chat/components/MessageWindow", () => ({
  default: () => <div data-testid="message-window" />,
}));

vi.mock("../../LetterGenerationDialog", () => ({
  default: ({ ref }: { ref: React.Ref<HTMLDialogElement | null> }) => (
    <dialog ref={ref} open>
      <p>Some content</p>
      <button>close</button>
    </dialog>
  ),
}));

const renderLetter = async () => {
  const { default: Letter } = await import("../../Letter");
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/letter/org/portland"]}>
        <Routes>
          <Route path="/letter/:org/:loc" element={<Letter />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("Letter component - effect orchestration", () => {
  beforeEach(() => {
    mockStreamText.mockClear();
    mockStreamText.mockResolvedValue(undefined);

    mockUseMessages.mockReturnValue({
      addMessage: vi.fn(),
      messages: [],
      setMessages: vi.fn(),
    });

    mockUseLocation.mockReturnValue({
      location: null,
      setLocation: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("first effect adds user message before second effect calls streamText", async () => {
    const callOrder: string[] = [];
    const mockSetMessages = vi.fn(() => {
      callOrder.push("setMessages");
    });
    const mockAddMessage = vi.fn();

    mockStreamText.mockImplementation(async () => {
      callOrder.push("streamText");
      return Promise.resolve(undefined);
    });

    mockUseMessages.mockReturnValue({
      addMessage: mockAddMessage,
      messages: [],
      setMessages: mockSetMessages,
    });

    await renderLetter();

    await waitFor(() => {
      expect(callOrder).toContain("setMessages");
      expect(callOrder).toContain("streamText");
    });

    expect(callOrder.indexOf("setMessages")).toBeLessThan(
      callOrder.indexOf("streamText"),
    );

    expect(mockStreamText).toHaveBeenCalledWith(
      expect.objectContaining({
        addMessage: mockAddMessage,
        setMessages: mockSetMessages,
        location: expect.objectContaining(CitySelectOptions["portland"]),
      }),
    );
  });

  it("shows loading state before second message arrives", async () => {
    const mockSetMessages = vi.fn();
    const mockAddMessage = vi.fn();

    mockUseMessages.mockReturnValue({
      addMessage: mockAddMessage,
      messages: [{ role: "user", content: "hi", messageId: "1" }],
      setMessages: mockSetMessages,
    });

    await renderLetter();
    await waitFor(() => {
      expect(screen.queryByText("Generating letter...")).not.toBeNull();
    });
  });

  it("dialog closes when close button clicked", async () => {
    const closeMock = vi.fn();
    HTMLDialogElement.prototype.close = closeMock;

    await renderLetter();

    const closeButton = screen.getByText("Close");

    act(() => {
      fireEvent.click(closeButton);
    });

    expect(closeMock).toHaveBeenCalled();
  });

  it("renders correctly when accessing /letter route directly", async () => {
    const { default: Letter } = await import("../../Letter");
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/letter"]}>
          <Routes>
            <Route path="/letter" element={<Letter />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(mockStreamText).toHaveBeenCalled();
    });
  });

  it("shows error message when stream fails", async () => {
    const mockSetMessages = vi.fn();
    mockStreamText.mockResolvedValue(undefined);

    mockUseMessages.mockReturnValue({
      addMessage: vi.fn(),
      messages: [],
      setMessages: mockSetMessages,
    });

    await renderLetter();

    await waitFor(() => {
      expect(mockSetMessages).toHaveBeenCalledWith(expect.any(Function));
    });

    const setMessagesCall = mockSetMessages.mock.calls.find((call) => {
      const result = call[0]([]);
      return result.some((msg: IMessage) =>
        msg.content.includes("unable to be streamed"),
      );
    });
    expect(setMessagesCall).toBeDefined();
  });
});
