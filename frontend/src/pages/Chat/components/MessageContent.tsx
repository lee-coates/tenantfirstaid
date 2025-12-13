import type { IMessage } from "../../../hooks/useMessages";
import DOMPurify, { SANITIZE_SETTINGS } from "../../../shared/utils/dompurify";

interface Props {
  message: IMessage;
}

export default function MessageContent({ message }: Props) {
  const messageContent = DOMPurify.sanitize(message.content, SANITIZE_SETTINGS)
    .split("-----generate letter-----")[0]
    .trim();

  return (
    <>
      <strong>{message.role === "model" ? "Bot: " : "You: "}</strong>
      <span
        className={`
          whitespace-pre-wrap
          ${messageContent.length === 0 ? "animate-dot-pulse" : ""}`.trim()}
        dangerouslySetInnerHTML={{
          __html: messageContent.length === 0 ? "..." : messageContent,
        }}
      ></span>
    </>
  );
}
