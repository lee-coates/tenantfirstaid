import { IMessage } from "../../../Chat";

interface Props {
  message: IMessage;
  isLoading: boolean;
}

export default function MessageContent({ message, isLoading }: Props) {
  return (
    <div className="message-content">
      <strong>{message.role === "assistant" ? "Bot: " : "You: "}</strong>
      {message.role === "assistant" && message.content === "" && isLoading ? (
        <span className="dot-pulse">...</span>
      ) : (
        <span className="whitespace-pre-wrap">{message.content}</span>
      )}
    </div>
  );
}
