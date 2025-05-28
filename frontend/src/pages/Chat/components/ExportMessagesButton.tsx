import { IMessage } from "../../../hooks/useMessages";
import exportMessages from "../utils/exportHelper";

interface Props {
  messages: IMessage[];
}

export default function ExportMessagesButton({ messages }: Props) {
  return (
    <button
      className="fixed top-6 right-[8vw] px-6 py-1.5 bg-[#ddd] rounded-full shadow-lg border cursor-pointer z-50"
      onClick={() => exportMessages(messages)}
    >
      Export
    </button>
  );
}
