import { useState } from "react";
import useMessages from "../../../hooks/useMessages";

interface Props {
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  feedbackSubmitted: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export default function InputField({
  isLoading,
  setIsLoading,
  feedbackSubmitted,
  inputRef,
}: Props) {
  const [text, setText] = useState("");
  const { addMessage, setMessages } = useMessages();

  const handleSend = async () => {
    // If feedback was submitted, disable further interaction
    if (feedbackSubmitted) return;
    if (!text.trim()) return;

    const userMessage = text;
    const userMessageId = Date.now().toString();
    const botMessageId = (Date.now() + 1).toString();

    setText("");
    setIsLoading(true);

    // Add user message
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage, messageId: userMessageId },
    ]);

    // Add empty bot message that will be updated
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: "",
        messageId: botMessageId,
        showFeedback: false,
      },
    ]);

    try {
      const reader = await addMessage(text);
      if (!reader) return;
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        fullText += chunk;

        // Update only the bot's message
        setMessages((prev) =>
          prev.map((msg) =>
            msg.messageId === botMessageId ? { ...msg, content: fullText } : msg
          )
        );
      }

      // Set showFeedback to false for all messages, then true only for the latest bot message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.role === "assistant"
            ? { ...msg, showFeedback: msg.messageId === botMessageId }
            : msg
        )
      );
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.messageId === botMessageId) {
            return {
              ...msg,
              content: "Sorry, I encountered an error. Please try again.",
            };
          } else if (msg.role === "assistant") {
            return { ...msg, showFeedback: false };
          }
          return msg;
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-2 mt-4 h-11 items-stretch mx-auto max-w-[700px]">
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
        disabled={isLoading || !text.trim()}
      >
        {isLoading ? "..." : "Send"}
      </button>
    </div>
  );
}
