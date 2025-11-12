import { ILocation } from "../../../hooks/useLocation";
import { type IMessage } from "../../../hooks/useMessages";

interface IStreamTextOptions {
  userMessage: string;
  addMessage: (args: {
    city: string | null;
    state: string;
  }) => Promise<ReadableStreamDefaultReader<Uint8Array> | undefined>;
  setMessages: React.Dispatch<React.SetStateAction<IMessage[]>>;
  location: ILocation;
  setIsLoading?: React.Dispatch<React.SetStateAction<boolean>>;
}

async function streamText({
  userMessage,
  addMessage,
  setMessages,
  location,
  setIsLoading,
}: IStreamTextOptions) {
  const userMessageId = Date.now().toString();
  const botMessageId = (Date.now() + 1).toString();

  setIsLoading?.(true);

  // Add user message
  setMessages((prev) => [
    ...prev,
    { role: "user", content: userMessage, messageId: userMessageId },
  ]);

  // Add empty bot message that will be updated
  setMessages((prev) => [
    ...prev,
    {
      role: "model",
      content: "",
      messageId: botMessageId,
    },
  ]);

  try {
    const reader = await addMessage({
      city: location?.city,
      state: location?.state || "",
    });
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
          msg.messageId === botMessageId ? { ...msg, content: fullText } : msg,
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
    setIsLoading?.(false);
  }
}

export { streamText };
