import type { IMessage } from "../../../Chat";
import exportMessages from "../utils/exportHelper";

interface Props {
  messages: IMessage[];
}

export default function ExportMessagesButton({ messages }: Props) {
  return (
    <button
      className="fixed top-6 right-[10vw] translate-x-1/2 px-6 py-1.5 bg-[#ddd] rounded-md border-1 cursor-pointer"
      onClick={() => exportMessages(messages)}
    >
      Export
    </button>
  );
}
