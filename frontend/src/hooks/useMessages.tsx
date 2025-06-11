import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import useSession from "./useSession";

export interface IMessage {
  role: "user" | "assistant";
  content: string;
  messageId: string;
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
    console.error("Error fetching chat history:", err);
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

async function initNewSession(city: string | null, state: string, sessionId: string) {
  const response = await fetch("/api/init", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ city, state, session_id: sessionId }),
  });
  return response.body?.getReader();
}

export default function useMessages() {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const { sessionId } = useSession();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["messages", sessionId],
    queryFn: async () => await fetchChatHistory(sessionId),
    enabled: !!sessionId,
  });

  const addMessage = useMutation({
    mutationFn: async (userMessage: string) =>
      await addNewMessage(userMessage, sessionId),
  });

  const initSession = useMutation({
    mutationFn: async ({ city, state }: { city: string | null; state: string }) =>
      await initNewSession(city, state, sessionId),
  })

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
    initSession: initSession.mutateAsync,
    isLoading,
    isError,
  };
}
