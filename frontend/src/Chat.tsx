import MessageWindow from "./pages/Chat/components/MessageWindow";
import useMessages from "./hooks/useMessages";
import { useLetterContent } from "./hooks/useLetterContent";
import ChatDisclaimer from "./pages/Chat/components/ChatDisclaimer";
import MessageContainer from "./shared/components/MessageContainer";

export default function Chat() {
  const { addMessage, messages, setMessages } = useMessages();
  const isOngoing = messages.length > 0;
  const { letterContent } = useLetterContent(messages);

  return (
    <div className="flex pt-16 h-screen items-center justify-center">
      <div className="flex-1 h-full sm:h-auto items-center transition-all duration-300">
        <MessageContainer isOngoing={isOngoing} letterContent={letterContent}>
          <div
            className={`flex flex-col ${letterContent === "" ? "flex-1" : "flex-1/3"}`}
          >
            <MessageWindow
              messages={messages}
              addMessage={addMessage}
              setMessages={setMessages}
              isOngoing={isOngoing}
            />
          </div>
        </MessageContainer>
        <ChatDisclaimer isOngoing={isOngoing} />
      </div>
    </div>
  );
}
