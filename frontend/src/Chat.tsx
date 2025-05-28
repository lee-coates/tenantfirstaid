import { useState } from "react";

import MessageWindow from "./pages/Chat/components/MessageWindow";

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

  return (
    <div className="h-dvh pt-16 flex items-center">

      <div
        className={`container relative flex flex-col mx-auto p-6 bg-white rounded-lg shadow-[0_4px_6px_rgba(0,0,0,0.1)]
          ${isOngoing
            ? "justify-between h-[calc(100dvh-10rem)]"
            : "justify-center max-w-[600px]"
          }`}
      >
        <MessageWindow
          messages={messages}
          setMessages={setMessages}
          isOngoing={isOngoing}
        />
      </div>

    </div>
  );
}
