import { IMessage } from "../../../hooks/useMessages";
import exportMessages from "../utils/exportHelper";

interface Props {
  messages: IMessage[];
}

export default function ExportMessagesButton({ messages }: Props) {
  return (
    <button
      className="py-2 px-4 border border-[#4a90e2] text-[#4a90e2] rounded-md font-semibold hover:bg-[#f0f6fb] transition-colors"
      onClick={() => exportMessages(messages)}
    >
      Export
    </button>
  );
}
