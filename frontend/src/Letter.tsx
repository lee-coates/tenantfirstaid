import { HumanMessage } from "@langchain/core/messages";
import type { UiMessage } from "./shared/types/messages";
import MessageWindow from "./pages/Chat/components/MessageWindow";
import useMessages from "./hooks/useMessages";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useLetterContent } from "./hooks/useLetterContent";
import { streamText } from "./pages/Chat/utils/streamHelper";
import LetterGenerationDialog from "./pages/Letter/components/LetterGenerationDialog";
import { buildLetterUserMessage } from "./pages/Letter/utils/letterHelper";
import LetterDisclaimer from "./pages/Letter/components/LetterDisclaimer";
import MessageContainer from "./shared/components/MessageContainer";
import useHousingContext from "./hooks/useHousingContext";
import { buildChatUserMessage } from "./pages/Chat/utils/formHelper";
import type { Location } from "./types/models";
import FeatureSnippet from "./shared/components/FeatureSnippet";
import FrequentInquiries from "./pages/Chat/components/FrequentInquiries";
import MobilePanel from "./shared/components/MobilePanel";
import clsx from "clsx";

export default function Letter() {
  const { addMessage, messages, setMessages } = useMessages();
  const isOngoing = messages.length > 0;
  const { letterContent } = useLetterContent(messages);
  const { org, loc } = useParams();
  const [startStreaming, setStartStreaming] = useState(false);
  const streamLocationRef = useRef<Location | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasInitialized = useRef(false);
  const LOADING_DISPLAY_DELAY_MS = 1000;
  const { housingLocation, housingType, tenantTopic, issueDescription } =
    useHousingContext();
  const { userMessage: initialUserMessage } = buildChatUserMessage(
    housingLocation,
    housingType,
    tenantTopic,
    issueDescription,
  );

  // Adds the initial user message once and triggers streaming.
  useEffect(() => {
    if (hasInitialized.current) return;
    const output = buildLetterUserMessage(org, loc);
    if (output === null) return;
    hasInitialized.current = true;
    const hasIssueContext = issueDescription !== "";

    const userMessageId = Date.now().toString();
    // Add user message
    setMessages((prev) => [
      ...prev,
      new HumanMessage({
        content: [hasIssueContext ? initialUserMessage : "", output.userMessage]
          .join(" ")
          .trim(),
        id: userMessageId,
      }),
    ]);
    streamLocationRef.current = output.selectedLocation;
    setStartStreaming(true);
  }, [loc, org, setMessages, issueDescription, initialUserMessage]);

  useEffect(() => {
    if (startStreaming === false || streamLocationRef.current === null) return;
    // Reset state to prevent re-running
    setStartStreaming(false);

    const runGenerateLetter = async () => {
      if (streamLocationRef.current !== null) {
        let cleanCompletion = false;
        await streamText({
          addMessage,
          setMessages,
          housingLocation: streamLocationRef.current,
          onDone: () => {
            cleanCompletion = true;
            const uiMessage: UiMessage = {
              type: "ui",
              text: "What was generated is just an initial template. Please include details of your specific housing situation to update the letter.",
              id: Date.now().toString(),
            };
            setMessages((prev) => [...prev, uiMessage]);
          },
        });
        // No done chunk received — surface an error instead of a silent empty panel.
        if (!cleanCompletion) {
          const uiMessage: UiMessage = {
            type: "ui",
            text: "Unable to generate letter. Please try again or refresh the page.",
            id: Date.now().toString(),
          };
          setMessages((prev) => [...prev, uiMessage]);
        }
        // Clear spinner after a short delay for a smoother transition.
        timerRef.current = setTimeout(
          () => setIsGenerating(false),
          LOADING_DISPLAY_DELAY_MS,
        );
      }
    };

    runGenerateLetter();
  }, [startStreaming, addMessage, setMessages]);

  // Clear any pending timer if the component unmounts before it fires.
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  return (
    <>
      <LetterGenerationDialog ref={dialogRef} />
      <div className="min-h-full lg:h-full w-full flex flex-col lg:flex-row transition-all duration-300">
        <div className="flex-1 lg:flex-none lg:my-0 w-full lg:w-3/5 flex lg:order-2">
          <MessageContainer isOngoing={isOngoing} letterContent={letterContent}>
            <div
              className={clsx(
                "flex flex-col min-h-0",
                letterContent === "" ? "flex-1" : "flex-1/3",
              )}
            >
              {isGenerating ? (
                <div className="h-full flex items-center justify-center">
                  <div className="animate-pulse text-lg">
                    Generating Letter...
                  </div>
                </div>
              ) : (
                <MessageWindow
                  messages={messages}
                  addMessage={addMessage}
                  setMessages={setMessages}
                  isOngoing={isOngoing}
                />
              )}
            </div>
          </MessageContainer>
        </div>
        <div
          className={clsx(
            "flex flex-col w-full bg-paper-background",
            "border-b lg:border-b-0 border-gray-light",
            "lg:order-1 lg:my-0 lg:w-1/5 lg:border-r",
            "[@media(max-height:800px)]:my-0 [@media(max-height:800px)]:self-stretch [@media(max-height:800px)]:overflow-hidden",
          )}
        >
          <MobilePanel title="Frequent Inquiries">
            <div className="flex-1 min-h-0 lg:overflow-y-auto [@media(max-height:800px)]:overflow-y-auto">
              <FrequentInquiries />
            </div>
          </MobilePanel>
        </div>
        <div
          className={clsx(
            "flex flex-col w-full bg-paper-background",
            "border-b lg:border-b-0 border-gray-light",
            "lg:order-3 lg:my-0 lg:w-1/5 lg:border-l",
            "[@media(max-height:800px)]:my-0 [@media(max-height:800px)]:self-stretch [@media(max-height:800px)]:overflow-hidden",
          )}
        >
          <MobilePanel title="Features">
            <div className="flex flex-col flex-1 min-h-0 lg:overflow-y-auto [@media(max-height:800px)]:overflow-y-auto">
              <FeatureSnippet />
            </div>
          </MobilePanel>
          <div className="p-4 [@media(min-width:1024px)_and_(min-height:801px)]:mt-auto">
            <LetterDisclaimer isOngoing={isOngoing} />
          </div>
        </div>
      </div>
    </>
  );
}
