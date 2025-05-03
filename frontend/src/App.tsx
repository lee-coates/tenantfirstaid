import { useState } from "react";

export default function App() {
  const [text, setText] = useState("");
  const [conversationHistory, setConversationHistory] = useState<string[]>([]);

  const handleSend = async () => {
    const userMessage = text;
    setText("");
  
    // Append user's message once
    setConversationHistory((prev) => [...prev, `You: ${userMessage}`, "Bot: "]);
  
    const res = await fetch("/api/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage, session_id: 1 }),
    });
  
    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
  
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        fullText += chunk;
  
        // Update only the last line (the bot's message)
        setConversationHistory((prev) => [
          ...prev.slice(0, -1),
          `Bot: ${fullText}`,
        ]);
      }
    }
  };

  return (
    <div className="container">
      <div className="label">
        {conversationHistory.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
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
        className="input"
      />
      <button className="button" onClick={handleSend}>
        Send
      </button>
    </div>
  );
}