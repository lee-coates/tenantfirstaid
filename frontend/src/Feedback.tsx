import { useState, useEffect } from "react";

type MessageType = {
  role: string;
  content: string;
};

type ConversationType = {
  conversation: MessageType[];
  feedback: string;
};

type FeedbackEntryType = {
  prompt: string;
  conversations: ConversationType[];
};

type Props = {
  feedbackData: FeedbackEntryType[];
};

function FeedbackContent({ feedbackData }: Props) {
  const [selectedPromptIndex, setSelectedPromptIndex] = useState<number | null>(
    null
  );

  return (
    <div className="flex gap-8">
      {/* Prompt list */}
      <div className="w-[300px] overflow-y-auto">
        <h3>Prompts</h3>
        <ul className="p-0 list-none">
          {feedbackData.map((entry, index) => (
            <li
              key={index}
              className={`cursor-pointer p-2 whitespace-normal wrap-anywhere break-all block
                ${
                  selectedPromptIndex === index ? "bg-[#eee]" : "bg-transparent"
                }
                `}
              onClick={() => setSelectedPromptIndex(index)}
            >
              {entry.prompt}
            </li>
          ))}
        </ul>
      </div>

      {/* Conversations */}
      <div className="flex-1">
        <h3>Conversations</h3>
        {selectedPromptIndex === null ? (
          <p>Select a prompt to view conversations.</p>
        ) : (
          feedbackData[selectedPromptIndex].conversations.map((conv, i) => (
            <div key={i} className="mb-4 border-b-1 border-[#ccc] pb-2">
              <div>
                <strong>Conversation:</strong>{" "}
                {conv.conversation
                  .map((msg) => `${msg.role}: ${msg.content}`)
                  .join(" | ")}
              </div>
              <div>
                <strong>Feedback:</strong> {conv.feedback}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function FeedbackGate() {
  const [password, setPassword] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [feedback, setFeedback] = useState<FeedbackEntryType[] | null>(null);
  const [loading, setLoading] = useState(false);

  // Get password from localStorage on mount
  useEffect(() => {
    const storedPassword = localStorage.getItem("password");
    if (storedPassword) {
      setPassword(storedPassword);
    }
  }, []);

  // Fetch feedback if password is set and feedback not yet loaded
  useEffect(() => {
    const fetchFeedback = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/get_feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });

        if (!res.ok) {
          alert(`Failed to fetch feedback: ${res.status} ${res.statusText}`);
          localStorage.removeItem("password");
          setPassword(null);
          return;
        }

        const data: { feedback: FeedbackEntryType[] } = await res.json();
        setFeedback(data.feedback);
      } catch (err) {
        console.error("Error fetching feedback:", err);
        alert("Network error while fetching feedback.");
        localStorage.removeItem("password");
        setPassword(null);
      } finally {
        setLoading(false);
      }
    };

    if (password && !feedback && !loading) {
      fetchFeedback();
    }
  }, [password, feedback, loading]);

  const handleSubmit = () => {
    if (inputValue) {
      localStorage.setItem("password", inputValue);
      setPassword(inputValue);
    }
  };

  if (!password) {
    return (
      <div className="container my-10 mx-auto p-6 bg-white rounded-lg max-w-[600px] shadow-[0_4px_6px_rgba(0,0,0,0.1)]">
        <label>
          Password:
          <input
            className="border-1"
            type="password"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault(); // prevent form submission or newline
                handleSubmit();
              }
            }}
          />
        </label>
        <button
          className="py-1.5 px-4 bg-[#4a90e2] hover:bg-[#3a7bc8] text-white rounded-md cursor-pointer transition-color duration-300"
          onClick={handleSubmit}
        >
          Submit
        </button>
      </div>
    );
  }

  if (loading) {
    return <p>Loading...</p>;
  }

  if (feedback) {
    return <FeedbackContent feedbackData={feedback} />;
  }

  return null;
}
