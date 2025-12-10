import { useCallback, useEffect } from "react";
import { type IMessage } from "../../../hooks/useMessages";
import { streamText } from "../utils/streamHelper";
import useHousingContext from "../../../hooks/useHousingContext";

interface Props {
  addMessage: (args: {
    city: string | null;
    state: string;
  }) => Promise<ReadableStreamDefaultReader<Uint8Array> | undefined>;
  setMessages: React.Dispatch<React.SetStateAction<IMessage[]>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  value: string;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export default function InputField({
  addMessage,
  setMessages,
  isLoading,
  setIsLoading,
  inputRef,
  value,
  onChange,
}: Props) {
  const { housingLocation } = useHousingContext();

  const handleSend = async () => {
    if (!value.trim()) return;

    onChange({
      target: { value: "" },
    } as React.ChangeEvent<HTMLTextAreaElement>);

    const userMessageId = Date.now().toString();
    // Add user message
    setMessages((prev) => [
      ...prev,
      { role: "user", content: value, messageId: userMessageId },
    ]);

    await streamText({
      addMessage,
      setMessages,
      housingLocation,
      setIsLoading,
    });
  };

  const resizeTextArea = useCallback(() => {
    const inputElement = inputRef.current;
    if (inputElement !== null) {
      inputElement.style.height = "auto";
      inputElement.style.height = `${inputElement.scrollHeight}px`;
    }
  }, [inputRef]);

  useEffect(() => {
    resizeTextArea();
  }, [value, resizeTextArea]);

  return (
    <div className="flex gap-2 mt-4 justify-center items-center mx-auto max-w-[700px]">
      <textarea
        value={value}
        onChange={onChange}
        onInput={resizeTextArea}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSend();
          }
        }}
        rows={1}
        className="overflow-auto resize-none max-h-22 w-full px-3 py-2 border border-[#ddd] rounded-md box-border transition-colors duration-300 focus:outline-0 focus:border-[#4a90e2] focus:shadow-[0_0_0_2px_rgba(74,144,226,0.2)]"
        placeholder="Type your message here..."
        disabled={isLoading}
        ref={inputRef}
      />
      <button
        className={`h-10 text-sm sm:text-base bg-[#1F584F] hover:bg-[#4F8B82] text-white rounded-md transition-color duration-300 ${isLoading ? "cursor-progress" : "cursor-pointer"}`}
        onClick={handleSend}
        disabled={isLoading || !value.trim()}
      >
        {isLoading ? "..." : "Send"}
      </button>
    </div>
  );
}
