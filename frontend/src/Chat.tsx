import MessageWindow from "./pages/Chat/components/MessageWindow";
import useMessages from "./hooks/useMessages";
import useLocation from "./hooks/useLocation";
import { useLetterContent } from "./hooks/useLetterContent";
import ChatDisclaimer from "./pages/Chat/components/ChatDisclaimer";
import MessageContainer from "./shared/components/MessageContainer";

export default function Chat() {
  const { addMessage, messages, setMessages } = useMessages();
  const { location, setLocation } = useLocation();
  const isOngoing = messages.length > 0;
  const { letterContent } = useLetterContent(messages);

  return (
    <div
      className={`absolute ${isOngoing ? "top-16 md:top-32" : "top-1/2 -translate-y-1/2"} w-full flex items-center`}
    >
      <div className="flex-1 h-full sm:h-auto items-center transition-all duration-300">
        <MessageContainer isOngoing={isOngoing} letterContent={letterContent}>
          <div
            className={`flex flex-col ${letterContent === "" ? "flex-1" : "flex-1/3"}`}
          >
            <MessageWindow
              messages={messages}
              addMessage={addMessage}
              location={location}
              setLocation={setLocation}
              setMessages={setMessages}
              isOngoing={isOngoing}
            />
          </div>
        </MessageContainer>
        <div
          className={`container mx-auto text-xs px-4 text-center ${isOngoing ? "max-w-auto my-2" : "max-w-[600px] my-4"}`}
        >
          <p className={`${isOngoing ? "mb-0" : "mb-2"}`}>
            <strong>Disclaimer</strong>:&nbsp;
            <ChatDisclaimer isOngoing={isOngoing} />
            &nbsp;
            <span>
              For questions, contact{" "}
              <a href="mailto:michael@qiu-qiulaw.com" className="underline">
                michael@qiu-qiulaw.com
              </a>
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
