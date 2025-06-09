import type { IMessage } from "../../../hooks/useMessages";

const orsRegex =
  /(?:ORS\s*)?\d{2,3}\.\d+[A-Za-z]?(?:\(\d+\)(?:\([a-zA-Z0-9]+\))*)?(?:[-&](?:ORS\s*)?\d{2,3}\.\d+[A-Za-z]?(?:\(\d+\)(?:\([a-zA-Z0-9]+\))*)?)?/g;

interface ORSProps {
  text: string;
  onStatuteClick: (statute: string) => void;
}

function HighlightORS({ text, onStatuteClick }: ORSProps) {
  const parts = [];
  const matches = Array.from(text.matchAll(orsRegex));
  let lastIndex = 0;

  matches.forEach((match) => {
    const index = match.index!;
    if (lastIndex < index) {
      parts.push(text.slice(lastIndex, index));
    }


    parts.push(
      <p
        key={index}
        className="inline text-blue-600 underline cursor-pointer transition-colors hover:bg-blue-200 rounded"
        onClick={() => onStatuteClick(match[0])}

      >
        {match[0]}
      </p>
    );

    lastIndex = index + match[0].length;
  });

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
}

interface Props {
  message: IMessage;
  isLoading: boolean;
  onStatuteClick: (statute: string) => void;
}

export default function MessageContent({ message, isLoading, onStatuteClick }: Props) {




  return (
    <>
      <strong>{message.role === "assistant" ? "Bot: " : "You: "}</strong>
      {message.role === "assistant" && message.content === "" && isLoading ? (
        <span className="animate-dot-pulse">...</span>
      ) : (
        <span className="whitespace-pre-wrap">
          <HighlightORS text={message.content} onStatuteClick={onStatuteClick} />
        </span>
      )}

    </>
  );
}
