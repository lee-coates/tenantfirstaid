import MessageWindow from "./pages/Chat/components/MessageWindow";
import useMessages from "./hooks/useMessages";
import useLocation, { ILocation } from "./hooks/useLocation";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useLetterContent } from "./hooks/useLetterContent";
import { streamText } from "./pages/Chat/utils/streamHelper";
import { buildLetterUserMessage } from "./pages/Chat/utils/letterHelper";

export default function Letter() {
  const { addMessage, messages, setMessages } = useMessages();
  const { location, setLocation } = useLocation();
  const isOngoing = messages.length > 0;
  const { letterContent } = useLetterContent(messages);
  const { org, loc } = useParams();
  const [startStreaming, setStartStreaming] = useState(false);
  const streamLocationRef = useRef<ILocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const LOADING_DISPLAY_DELAY_MS = 1000;

  useEffect(() => {
    if (org === undefined) return;
    const output = buildLetterUserMessage(org, loc);
    if (output === null) return;

    const userMessageId = Date.now().toString();
    // Add user message
    setMessages((prev) => [
      ...prev,
      { role: "user", content: output.userMessage, messageId: userMessageId },
    ]);
    streamLocationRef.current = output.selectedLocation;
    setStartStreaming(true);
  }, [loc, org, setMessages]);

  useEffect(() => {
    if (startStreaming === false || streamLocationRef.current === null) return;
    // Reset state to prevent re-running
    setStartStreaming(false);

    const runGenerateLetter = async () => {
      if (streamLocationRef.current !== null) {
        await streamText({
          addMessage,
          setMessages,
          location: streamLocationRef.current,
        });
      }
    };

    runGenerateLetter();
  }, [messages, startStreaming, addMessage, setMessages]);

  useEffect(() => {
    if (messages.length > 1 && messages[1].content !== "") {
      // Include 1s delay for smoother transition
      const timeoutId = setTimeout(
        () => setIsLoading(false),
        LOADING_DISPLAY_DELAY_MS,
      );
      return () => clearTimeout(timeoutId);
    }
  }, [messages]);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  return (
    <>
      <div className="h-dvh pt-16 flex items-center">
        <dialog
          ref={dialogRef}
          className="rounded-lg p-6 min-w-[300px] fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <div className="flex flex-col items-end">
            <p>
              You've been redirected here so we can help you create a letter to
              your landlord. It'll take a few seconds to complete your initial
              letter. You could instruct the tool to update the letter to your
              liking after it's generated. Once your letter is complete, you
              should go back to your previous page and follow the remaining
              steps.
            </p>
            <button
              onClick={() => dialogRef.current?.close()}
              className="cursor-pointer underline text-blue-600 hover:text-blue-500 text-sm"
            >
              close
            </button>
          </div>
        </dialog>
        <div className="flex w-full items-center">
          <div className="flex-1 transition-all duration-300 relative">
            <div
              className={`container relative flex flex-col sm:flex-row gap-4 mx-auto p-6 bg-[#F4F4F2] rounded-lg shadow-[0_4px_6px_rgba(0,0,0,0.1)]
              ${
                isOngoing
                  ? "justify-between h-[calc(100dvh-4rem-64px)] max-h-[calc(100dvh-4rem-64px)] sm:h-[calc(100dvh-10rem-64px)]"
                  : "justify-center max-w-[600px]"
              }`}
            >
              {letterContent !== "" ? (
                <div className="flex flex-col gap-4 items-center flex-2/3 h-[40%] sm:h-full">
                  <div className="overflow-y-scroll pr-4 w-full">
                    <span
                      className="whitespace-pre-wrap generated-letter"
                      dangerouslySetInnerHTML={{
                        __html: letterContent,
                      }}
                    />
                  </div>
                </div>
              ) : null}
              <div
                className={`flex flex-col ${letterContent === "" ? "flex-1" : "flex-1/3"} h-[60%] sm:h-full`}
              >
                {isLoading ? (
                  <div className="flex flex-1 items-center justify-center animate-pulse text-lg">
                    Generating letter...
                  </div>
                ) : (
                  <MessageWindow
                    messages={messages}
                    addMessage={addMessage}
                    location={location}
                    setLocation={setLocation}
                    setMessages={setMessages}
                    isOngoing={isOngoing}
                  />
                )}
              </div>
            </div>
            <div
              className={`container mx-auto text-xs px-4 text-center ${isOngoing ? "max-w-auto my-2" : "max-w-[600px] my-4"}`}
            >
              <p className={`${isOngoing ? "mb-0" : "mb-2"}`}>
                {isOngoing ? (
                  <span>
                    <strong>Disclaimer</strong>: This tool provides general
                    information and drafts letters based solely on what you
                    enter. It is not legal advice and does not create an
                    attorney–client relationship. As explained further in the{" "}
                    <Link
                      to="/privacy-policy"
                      target="_blank"
                      className="underline"
                    >
                      Privacy Policy
                    </Link>
                    , we do not save any data from these conversations, but you
                    can enter your personal information into the chatbox and it
                    will appear in the corresponding brackets of the letter.
                  </span>
                ) : (
                  "The information provided by this chatbot is general information only and does not constitute legal advice. While Tenant First Aid strives to keep the content accurate and up to date, completeness and accuracy is not guaranteed. If you have a specific legal issue or question, consider contacting a qualified attorney or a local legal aid clinic for personalized assistance."
                )}
              </p>
              <p>For questions, contact michael@qiu-qiulaw.com</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
