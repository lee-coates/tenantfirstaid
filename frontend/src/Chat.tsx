import ExportMessagesButton from "./pages/Chat/components/ExportMessagesButton";
import { useNavigate } from "react-router-dom";
import MessageWindow from "./pages/Chat/components/MessageWindow";
import { useState } from "react";

export interface IMessage {
  role: "user" | "assistant";
  content: string;
  messageId: string;
  showFeedback?: boolean;
  feedbackSubmitted?: boolean;
}

export default function Chat() {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const isOngoing = messages.length > 0;

  const navigate = useNavigate();

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
            className={`max-h-[calc(100vh-25rem)] ${
              isOngoing ? "overflow-y-auto" : "overflow-y-hidden"
            } px-4 py-2`}
            ref={messagesRef}
          >
            {isOngoing ? (
              <div className="flex flex-col gap-4">
                {messages.map((message) => (
                  <div
                    key={message.messageId}
                    className={`flex flex-col max-w-[85%] ${
                      message.role === "assistant"
                        ? "self-start"
                        : "self-end"
                    }`}
                  >
                    <div
                      className={`p-3 rounded-2xl ${
                        message.role === "assistant"
                          ? "bg-gray-100 rounded-tl-sm"
                          : "bg-[#4a90e2] text-white rounded-tr-sm"
                      }`}
                    >
                      <strong>
                        {message.role === "assistant" ? "Bot: " : "You: "}
                      </strong>
                      {message.role === "assistant" &&
                      message.content === "" &&
                      isLoading ? (
                        <span className="animate-dot-pulse">...</span>
                      ) : (
                        <span className="whitespace-pre-wrap break-all">
                          {message.content}
                        </span>
                      )}
                    </div>

                    {message.role === "assistant" && message.showFeedback && (
                      <div className="mt-2 text-sm self-start ml-2">
                        {message.feedbackSubmitted === true ? (
                          <div className="p-2 bg-blue-50 rounded-md">
                            <span className="text-green-700">
                              Thank you for your feedback!
                            </span>
                          </div>
                        ) : feedbackOpen === message.messageId ? (
                          <div className="bg-gray-50 p-3 rounded-md border border-gray-200 w-full max-w-md">
                            <textarea
                              className="w-full p-3 border border-gray-300 rounded-md box-border transition-colors duration-300 focus:outline-none focus:border-[#4a90e2] focus:ring-2 focus:ring-[#4a90e2]/20"
                              placeholder="Describe the preferred behavior"
                              value={betterResponse}
                              onChange={(e) =>
                                setBetterResponse(e.target.value)
                              }
                              rows={4}
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                className="py-1.5 px-4 bg-[#4a90e2] hover:bg-[#3a7bc8] text-white rounded-md cursor-pointer transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() =>
                                  handleFeedback(
                                    message.messageId,
                                    betterResponse
                                  )
                                }
                                disabled={!betterResponse.trim()}
                              >
                                Submit
                              </button>
                              <button
                                className="py-1.5 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md cursor-pointer transition-colors duration-300"
                                onClick={() => setFeedbackOpen(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            className="bg-transparent border-none cursor-pointer p-1 text-gray-500 hover:text-gray-700 transition-colors duration-300"
                            onClick={() => setFeedbackOpen(message.messageId)}
                            title="Provide better response"
                          >
                            👎 This response could be better
                          </button>
                        )}
                      </div>
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
          <div className="flex gap-2 mt-4 h-11 items-stretch">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault(); // prevent form submission or newline
                  handleSend();
                }
              }}
              className="w-full p-3 border-1 border-[#ddd] rounded-md box-border transition-colors duration-300 focus:outline-0 focus:border-[#4a90e2] focus:shadow-[0_0_0_2px_rgba(74,144,226,0.2)]"
              placeholder={
                feedbackSubmitted
                  ? "Please refresh the page to start a new conversation"
                  : "Type your message here..."
              }
              disabled={isLoading || feedbackSubmitted}
              ref={inputRef}
            />
            <button
              className="px-6 bg-[#4a90e2] hover:bg-[#3a7bc8] text-white rounded-md cursor-pointer transition-color duration-300"
              onClick={handleSend}
              disabled={isLoading || !text.trim() || feedbackSubmitted}
            >
              {isLoading ? "..." : "Send"}
            </button>
          </div>
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
