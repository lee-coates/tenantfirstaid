import { useState, useEffect, useRef } from "react";
import ExportMessagesButton from "./pages/Chat/components/ExportMessagesButton";
import { useNavigate } from "react-router-dom";
import MessageContent from "./pages/Chat/components/MessageContent";
import MessageFeedback from "./pages/Chat/components/MessageFeedback";
import InputField from "./pages/Chat/components/InputField";

// Generate a random session ID
const generateSessionId = (): string => {
  // Use crypto API if available for better randomness
  if (window.crypto && "randomUUID" in window.crypto) {
    return window.crypto.randomUUID();
  }

  // Fallback to a simple random string
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

export interface IMessage {
  role: "user" | "assistant";
  content: string;
  messageId: string;
  showFeedback?: boolean;
  feedbackSubmitted?: boolean;
}

export default function Chat() {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const isOngoing = messages.length > 0;

  const navigate = useNavigate();
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
      const newSessionId = generateSessionId();
      localStorage.setItem("sessionId", newSessionId);
      setSessionId(newSessionId);
    } else {
      setSessionId(cachedSessionId);
      fetchChatHistory(cachedSessionId);
    }
  }, []);

  const handleClearSession = async () => {
    const newSessionId = generateSessionId();
    localStorage.setItem("sessionId", newSessionId);
    setSessionId(newSessionId);
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
    <div className="h-screen flex items-center">
      <div
        className={`container relative flex flex-col my-20 mx-auto p-6 bg-white rounded-lg shadow-[0_4px_6px_rgba(0,0,0,0.1)]
          ${
            isOngoing
              ? "justify-between h-[calc(100vh-10rem)]"
              : "justify-center max-w-[600px]"
          }`}
      >
        <ExportMessagesButton messages={messages} />
        <div>
          <div className="relative">
            <h1 className="text-3xl text-center mb-6 mt-5 text-[#4a90e2] hover:bd-[#3a7bc8]">
              <strong>Tenant First Aid</strong>
            </h1>
          </div>
          <div
            className={`max-h-[calc(100vh-25rem)] mx-auto max-w-[700px] ${
              isOngoing ? "overflow-y-scroll" : "overflow-y-none"
            }`}
            ref={messagesRef}
          >
            {isOngoing ? (
              <div className="messages">
                {messages.map((message) => (
                  <div
                    key={message.messageId}
                    className={`message ${
                      message.role === "assistant"
                        ? "bot-message"
                        : "user-message"
                    }`}
                  >
                    <MessageContent message={message} isLoading={isLoading} />
                    {message.role === "assistant" && message.showFeedback && (
                      <MessageFeedback
                        message={message}
                        setMessages={setMessages}
                        sessionId={sessionId}
                        setFeedbackSubmitted={setFeedbackSubmitted}
                      />
                    )}
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
            sessionId={sessionId}
          />
          <div className="flex justify-center mt-4">
            <button
              className="cursor-pointer font-bold underline text-[#E3574B] hover:text-[#B8473D]"
              onClick={handleClearSession}
              title="Clear Chat"
            >
              Clear Chat
            </button>
          </div>
        </div>
        <button
          className="fixed bottom-6 right-1/4 translate-x-1/2 sm:right-8 sm:translate-x-0 bg-white border border-[#4a90e2] text-[#4a90e2] hover:bg-[#4a90e2] hover:text-white rounded-full shadow-lg px-6 py-3 font-semibold transition-colors duration-300 cursor-pointer z-50"
          onClick={() => navigate("/about")}
          title="About Us"
        >
          About Tenant First Aid
        </button>
      </div>
    </div>
  );
}
