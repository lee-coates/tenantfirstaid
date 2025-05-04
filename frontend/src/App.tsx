import { useState } from "react";

export default function App() {
  const [text, setText] = useState("");
  const [conversationHistory, setConversationHistory] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!text.trim()) return;
    
    const userMessage = text;
    setText("");
    setIsLoading(true);
  
    // Append user's message once
    setConversationHistory((prev) => [...prev, `You: ${userMessage}`, "Bot: "]);
  
    try {
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
    } catch (error) {
      console.error('Error:', error);
      setConversationHistory((prev) => [
        ...prev.slice(0, -1),
        "Bot: Sorry, I encountered an error. Please try again.",
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <h1 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#4a90e2' }}>
        Tenant First Aid
      </h1>
      <div className="label">
        {conversationHistory.length > 0 ? (
          conversationHistory.map((line, i) => (
            <p key={i}>{line}</p>
          ))
        ) : (
          <p style={{ textAlign: 'center', color: '#888' }}>
            Ask me anything about tenant rights and assistance.
          </p>
        )}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
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
          placeholder="Type your message here..."
          disabled={isLoading}
        />
        <button 
          className="button" 
          onClick={handleSend} 
          disabled={isLoading || !text.trim()}
        >
          {isLoading ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}