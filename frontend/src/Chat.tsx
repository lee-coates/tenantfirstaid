import MessageWindow from "./pages/Chat/components/MessageWindow";
import useMessages from "./hooks/useMessages";
import { useLetterContent } from "./hooks/useLetterContent";
import ChatDisclaimer from "./pages/Chat/components/ChatDisclaimer";
import FrequentInquiries from "./pages/Chat/components/FrequentInquiries";
import MessageContainer from "./shared/components/MessageContainer";
import FeatureSnippet from "./shared/components/FeatureSnippet";
import MobilePanel from "./shared/components/MobilePanel";
import clsx from "clsx";

export default function Chat() {
  const { addMessage, messages, setMessages } = useMessages();
  const isOngoing = messages.length > 0;
  const { letterContent } = useLetterContent(messages);

  return (
    <div className="min-h-full lg:h-full w-full flex flex-col lg:flex-row transition-all duration-300">
      <div className="flex-1 lg:flex-none lg:my-0 w-full lg:w-3/5 flex lg:order-2">
        <MessageContainer isOngoing={isOngoing} letterContent={letterContent}>
          <div
            className={clsx(
              "flex flex-col min-h-0",
              letterContent === "" ? "flex-1" : "flex-1/3",
              !isOngoing &&
                "lg:justify-center [@media(max-height:800px)]:justify-start! [@media(max-height:800px)]:overflow-y-auto",
            )}
          >
            <MessageWindow
              messages={messages}
              addMessage={addMessage}
              setMessages={setMessages}
              isOngoing={isOngoing}
            />
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
          <ChatDisclaimer isOngoing={isOngoing} />
        </div>
      </div>
    </div>
  );
}
