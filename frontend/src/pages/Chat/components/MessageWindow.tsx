import { useEffect, useRef, useState } from "react";
import { IMessage } from "../../../Chat";
import InputField from "./InputField";
import MessageContent from "./MessageContent";
import MessageFeedback from "./MessageFeedback";
import useSession from "../../../hooks/useSession";
import ExportMessagesButton from "./ExportMessagesButton";

interface Props {
  messages: IMessage[];
  setMessages: React.Dispatch<React.SetStateAction<IMessage[]>>;
  isOngoing: boolean;
}

export default function MessageWindow({
  messages,
  setMessages,
  isOngoing,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const { setSessionId, handleNewSession } = useSession();
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  // Initialize session ID when component mounts
  useEffect(() => {
    // Get chat history
    const fetchChatHistory = async (sessionId: string) => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/history/${sessionId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          console.error(
            "Failed to fetch chat history.",
            res.status,
            res.statusText
          );
        }

        // `messageId` is not currently used by the backend,
        // so let's generate some dummy IDs to play nice with React.
        // We increment each time to avoid duplicate keys.
        let history: IMessage[] = await res.json();
        let messageId = Date.now();
        history = history.map((message: IMessage) => {
          messageId++;
          message.messageId = messageId.toString();
          return message;
        });
        setMessages(history);
      } catch (err) {
        console.error("Error fetching chat history", err);
      } finally {
        setIsLoading(false);
      }
    };

    const cachedSessionId = localStorage.getItem("sessionId");
    if (cachedSessionId === null) {
      handleNewSession();
    } else {
      setSessionId(cachedSessionId);
      fetchChatHistory(cachedSessionId);
    }
  }, [setMessages, setSessionId, handleNewSession]);

  const handleClearSession = () => {
    handleNewSession();
    setMessages([]);
  };

  useEffect(() => {
    inputRef.current?.focus();
    const messagesElement = messagesRef.current;
    if (messagesElement) {
      messagesElement.scrollTo({
        top: messagesElement.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  return (
    <>
      <div>

        <div
          className={`max-h-[calc(100vh-25rem)] mx-auto max-w-[700px] ${isOngoing ? "overflow-y-scroll" : "overflow-y-none"
            }`}
          ref={messagesRef}
        >
          {isOngoing ? (
            <div className="flex flex-col gap-4">
              {messages.map((message) => (
                <div
                  className={`flex w-full ${message.role === "assistant"
                    ? "justify-start"
                    : "justify-end"
                    }`}
                  key={message.messageId}
                >
                  <div
                    className={`p-3 rounded-2xl max-w-[95%] ${message.role === "assistant"
                      ? "bg-gray-100 rounded-tl-sm"
                      : "bg-[#4a90e2] text-white rounded-tr-sm"
                      }`}
                  >
                    <MessageContent message={message} isLoading={isLoading} />
                    {message.role === "assistant" && message.showFeedback && (
                      <MessageFeedback
                        message={message}
                        setMessages={setMessages}
                        setFeedbackSubmitted={setFeedbackSubmitted}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-[#888]">
              Ask me anything about tenant rights and assistance.
            </p>
          )}
        </div>
      </div>
      <div>
        <InputField
          setMessages={setMessages}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          feedbackSubmitted={feedbackSubmitted}
          inputRef={inputRef}
        />
        {messages.length > 0 ? (
          <div className="flex justify-center gap-4 mt-4">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 bg-white text-[#E3574B] font-semibold shadow-sm hover:bg-[#fff0ee] hover:border-[#E3574B] transition-colors"
              onClick={handleClearSession}
              title="Clear Chat"
            >

              Clear Chat
            </button>
            <div className="">
              <ExportMessagesButton
                messages={messages}

              />
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
