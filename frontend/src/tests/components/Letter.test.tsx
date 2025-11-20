import { render, waitFor } from "@testing-library/react";
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
    const { default: Letter } = await import("../../Letter");
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

    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/letter/MyOrg/portland"]}>
          <Routes>
            <Route path="/letter/:org/:loc" element={<Letter />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

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
});
