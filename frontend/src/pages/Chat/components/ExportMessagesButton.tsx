import type { IMessage } from "../../../Chat";
import exportMessages from "../utils/exportHelper";

interface Props {
  messages: IMessage[];
}

export default function ExportMessagesButton({ messages }: Props) {
  return (
    <button
      className="absolute top-0 right-0 px-6 py-1.5 bg-[#ddd] rounded-md cursor-pointer"
      onClick={() => exportMessages(messages)}
    >
      Export
    </button>
  );
}
