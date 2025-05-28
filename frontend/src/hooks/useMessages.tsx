import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import useSession from "./useSession";

export interface IMessage {
  role: "user" | "assistant";
  content: string;
  messageId: string;
  showFeedback?: boolean;
  feedbackSubmitted?: boolean;
}

async function fetchChatHistory(sessionId: string) {
  try {
    const response = await fetch(`/api/history/${sessionId}`);
    let history: IMessage[] = await response.json();
    let messageId = Date.now();
    history = history.map((message: IMessage) => {
      messageId++;
      message.messageId = messageId.toString();
      return message;
    });
    return history;
  } catch (err) {
    throw new Error(`Failed to fetch chat history. ${err}`);
  }
}

async function addNewMessage(userMessage: string, sessionId: string) {
  const response = await fetch("/api/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: userMessage, session_id: sessionId }),
  });
  return response.body?.getReader();
}

export default function useMessages() {
  const queryClient = useQueryClient();

  const [messages, setMessages] = useState<IMessage[]>([]);
  const { sessionId } = useSession();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["messages", sessionId],
    queryFn: () => {
      return fetchChatHistory(sessionId);
    },
    enabled: !!sessionId,
  });

  const addMessage = useMutation({
    mutationFn: async (userMessage: string) => {
      return await addNewMessage(userMessage, sessionId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["messages", sessionId] });
    },
  });

  useEffect(() => {
    setMessages([]);
  }, [sessionId]);

  useEffect(() => {
    if (data && data.length !== 0) setMessages(data);
  }, [data]);

  return {
    messages,
    setMessages,
    addMessage: addMessage.mutateAsync,
    isLoading,
    isError,
  };
}
