import MessageWindow from "./pages/Chat/components/MessageWindow";
import useMessages from "./hooks/useMessages";
import useLocation, { ILocation } from "./hooks/useLocation";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useLetterContent } from "./hooks/useLetterContent";
import { streamText } from "./pages/Chat/utils/streamHelper";
import LetterGenerationDialog from "./pages/Letter/components/LetterGenerationDialog";
import { buildLetterUserMessage } from "./pages/Letter/utils/letterHelper";
import LetterDisclaimer from "./pages/Letter/components/LetterDisclaimer";

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
        const streamDone = await streamText({
          addMessage,
          setMessages,
          location: streamLocationRef.current,
        });

        if (streamDone) {
          setMessages((prev) => [
            ...prev,
            {
              role: "model",
              content:
                "What was generated is just an initial template. Please include details of your specific housing situation to update the letter.",
              messageId: Date.now().toString(),
            },
          ]);
        }
      }
    };

    runGenerateLetter();
  }, [messages, startStreaming, addMessage, setMessages]);

  useEffect(() => {
    // Wait for the second message (index 1) which contains the initial AI response
    if (messages.length > 1 && messages[1]?.content !== "") {
      // Include 1s delay for smoother transition
      const timeoutId = setTimeout(
        () => setIsLoading(false),
        LOADING_DISPLAY_DELAY_MS
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
        <LetterGenerationDialog ref={dialogRef} />
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
                <LetterDisclaimer isOngoing={isOngoing} />
              </p>
              <p>For questions, contact michael@qiu-qiulaw.com</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
