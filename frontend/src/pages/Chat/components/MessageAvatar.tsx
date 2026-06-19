import clsx from "clsx";
import BeaverIcon from "../../../shared/components/BeaverIcon";

type AvatarType = "ai" | "human" | "ui";

interface Props {
  type: AvatarType;
}

/**
 * Small avatar shown beside a chat bubble, themed to match the sender's
 * bubble: the mascot for AI, a person for the user, and a gear for UI/system
 * notices.
 */
export default function MessageAvatar({ type }: Props) {
  return (
    <div
      className={clsx(
        "flex shrink-0 w-8 h-8 rounded-full items-center justify-center overflow-hidden",
        type === "ai" && "bg-paper-background border-green-medium border",
        type === "human" && "bg-green-dark",
        type === "ui" && "bg-slate-200 border-slate-400 border",
      )}
    >
      {type === "ai" && <BeaverIcon className="h-5 w-auto" />}
      {type === "human" && <PersonIcon />}
      {type === "ui" && <GearIcon />}
    </div>
  );
}

function PersonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-5 h-5 text-white"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-4 h-4 text-slate-600"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
