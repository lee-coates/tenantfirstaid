import { Link } from "react-router-dom";
import { useState } from "react";
import ExportMessagesButton from "./pages/Chat/components/ExportMessagesButton";
import MessageWindow from "./pages/Chat/components/MessageWindow";
import StatuteDrawer from "./pages/Chat/components/StatuteDrawer";
import useMessages from "./hooks/useMessages";

export default function Chat() {
  const { messages, setMessages, isLoading, isError } = useMessages();
  const isOngoing = messages.length > 0;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedStatute, setSelectedStatute] = useState<string | null>(null);

  const handleStatuteClick = (statute: string) => {
    setSelectedStatute(statute);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedStatute(null);
  };

  return (
    <div className="h-dvh pt-16 flex items-center">
      <ExportMessagesButton messages={messages} />
      <div className="flex w-full h-full">
        <div className="flex-1 transition-all duration-300">
          <div
            className={`container relative flex flex-col mx-auto p-6 bg-white rounded-lg shadow-[0_4px_6px_rgba(0,0,0,0.1)]
              ${isOngoing
                ? "justify-between h-[calc(100dvh-10rem)]"
                : "justify-center max-w-[600px]"
              }`}
          >
            {isLoading ? (
              <div className={`${isLoading && "animate-dot-pulse"} text-center`}>
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
        <StatuteDrawer open={drawerOpen} statute={selectedStatute} onClose={closeDrawer} />
      </div>
      <Link
        className="fixed bottom-6 right-[8vw] px-6 py-1.5 bg-white border border-[#4a90e2] text-[#4a90e2] hover:bg-[#4a90e2] hover:text-white rounded-full shadow-lg font-semibold transition-colors duration-300 cursor-pointer z-50"
        to="/about"
        title="About Us"
      >
        About Tenant First Aid
      </Link>
    </div>
  );
}
