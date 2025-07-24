import { useState } from "react";
import sendFeedback from "../utils/feedbackHelper";
import { IMessage } from "../../../hooks/useMessages";

interface Props {
  messages: IMessage[];
  setOpenFeedback: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function FeedbackModal({ messages, setOpenFeedback }: Props) {
  const [feedback, setFeedback] = useState("");

  const handleModalClose = () => {
    setOpenFeedback(false);
    setFeedback("");
  };

  return (
    <dialog
      open
      className="absolute top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] flex flex-col gap-4 items-center justify-center w-[300px] sm:w-[500px] h-[300px] rounded-lg p-4"
    >
      <textarea
        className="resize-none h-[80%] w-full px-3 py-2 border-1 border-[#ddd] rounded-md box-border transition-colors duration-300 focus:outline-0 focus:border-[#4a90e2] focus:shadow-[0_0_0_2px_rgba(74,144,226,0.2)]"
        placeholder="Please enter your feedback with regards to the chatbot here..."
        onChange={(event) => setFeedback(event.target.value)}
      />
      <div className="flex gap-4">
        <button
          className="border rounded-full px-4 py-1 cursor-pointer"
          onClick={() => {
            if (feedback.trim() === "") handleModalClose();
            setTimeout(() => {
              sendFeedback(messages, feedback);
              handleModalClose();
            }, 1000);
          }}
        >
          Send
        </button>
        <button
          className="border rounded-full px-4 py-1 cursor-pointer"
          onClick={handleModalClose}
        >
          Close
        </button>
      </div>
    </dialog>
  );
}
