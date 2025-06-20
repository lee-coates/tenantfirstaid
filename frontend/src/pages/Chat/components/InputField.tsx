import useMessages, { type IMessage } from "../../../hooks/useMessages";

interface Props {
  setMessages: React.Dispatch<React.SetStateAction<IMessage[]>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  value: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function InputField({
  setMessages,
  isLoading,
  setIsLoading,
  inputRef,
  value,
  onChange,
}: Props) {
  const { addMessage } = useMessages();

  const handleSend = async () => {
    if (!value.trim()) return;

    const userMessage = value;
    const userMessageId = Date.now().toString();
    const botMessageId = (Date.now() + 1).toString();


    onChange({ target: { value: "" } } as React.ChangeEvent<HTMLInputElement>);
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
      },
    ]);

    try {
      const reader = await addMessage(userMessage);
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
            msg.messageId === botMessageId
              ? { ...msg, content: fullText }
              : msg,
          ),
        );
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.messageId === botMessageId
            ? {
              ...msg,
              content: "Sorry, I encountered an error. Please try again.",
            }
            : msg,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-2 mt-4 h-11 items-stretch mx-auto max-w-[700px]">
      <input
        type="text"
        value={value}
        onChange={onChange}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSend();
          }
        }}
        className="w-full p-3 border-1 border-[#ddd] rounded-md box-border transition-colors duration-300 focus:outline-0 focus:border-[#4a90e2] focus:shadow-[0_0_0_2px_rgba(74,144,226,0.2)]"
        placeholder="Type your message here..."
        disabled={isLoading}
        ref={inputRef}
      />
      <button
        className="px-6 bg-[#1F584F] hover:bg-[#4F8B82] text-white rounded-md cursor-pointer transition-color duration-300"
        onClick={handleSend}
        disabled={isLoading || !value.trim()}
      >
        {isLoading ? "..." : "Send"}
      </button>
    </div>
  );
}
