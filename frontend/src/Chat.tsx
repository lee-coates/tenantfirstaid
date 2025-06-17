import { useState } from "react";
import MessageWindow from "./pages/Chat/components/MessageWindow";
import StatuteDrawer from "./pages/Chat/components/StatuteDrawer";
import useMessages from "./hooks/useMessages";

export default function Chat() {
  const { messages, setMessages, isLoading, isError } = useMessages();
  const isOngoing = messages.length > 0;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedStatute, setSelectedStatute] = useState<string | null>(null);

  const handleStatuteClick = (statute: string) => {
    if (statute === selectedStatute && drawerOpen) {
      closeDrawer();
    } else {
      setSelectedStatute(statute);
      setDrawerOpen(true);
    }
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedStatute(null);
  };

  return (
    <div className="h-dvh pt-16 flex items-center">
      <div className="flex w-full items-center ">
        <div className="flex-1 transition-all duration-300">
          <div
            className={`container relative flex flex-col mx-auto p-6 bg-[#F4F4F2] rounded-lg shadow-[0_4px_6px_rgba(0,0,0,0.1)]
              ${
                isOngoing
                  ? "justify-between h-[calc(100dvh-4rem)] max-h-[calc(100dvh-4rem)] sm:h-[calc(100dvh-10rem)]"
                  : "justify-center max-w-[600px]"
              }`}
          >
            {isLoading ? (
              <div
                className={`${isLoading && "animate-dot-pulse"} text-center`}
              >
                Loading...
              </div>
            ) : (
              <MessageWindow
                messages={messages}
                setMessages={setMessages}
                isOngoing={isOngoing}
                isError={isError}
                onStatuteClick={handleStatuteClick}
              />
            )}
          </div>
        </div>
        <StatuteDrawer
          open={drawerOpen}
          statute={selectedStatute}
          onClose={closeDrawer}
        />
      </div>
    </div>
  );
}
