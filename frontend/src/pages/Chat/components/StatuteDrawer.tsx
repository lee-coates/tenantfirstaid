import useStatutes from "../../../hooks/useStatutes";

interface StatuteDrawerProps {
  open: boolean;
  statute: string | null;
  onClose: () => void;
}

export default function StatuteDrawer({
  open,
  statute,
  onClose,
}: StatuteDrawerProps) {
  const baseStatuteMatch = statute?.match(/(?:ORS\s*)?(\d{2,3}\.\d+)/);
  const baseStatute = baseStatuteMatch ? baseStatuteMatch[1] : "";
  const { statuteDetails, isLoading, isError } = useStatutes(baseStatute);

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        className={`
          sm:transition-[width] sm:duration-600 sm:ease-[cubic-bezier(.22,1.5,.36,1)]
          sm:overflow-hidden
          sm:h-[calc(100dvh-10rem)]
          ${open ? "sm:w-96 pointer-events-auto" : "sm:w-0 pointer-events-none"}
          w-full
          fixed sm:static bottom-0 right-0
          z-40
        `}
      >
        <div
          className={`
            transition-transform duration-500 ease-[cubic-bezier(.22,1.5,.36,1)]
            bg-[#F4F4F2] shadow-lg rounded
            h-[70vh] sm:h-full
            w-full
            ${
              open
                ? "translate-y-0 sm:translate-y-0"
                : "translate-y-full sm:translate-y-0"
            }
          `}
        >
          <div className="relative h-full flex flex-col overflow-y-auto p-8">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 cursor-pointer text-3xl leading-none"
              onClick={onClose}
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-10 h-10 text-[#1F584F]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <h2 className="text-xl font-bold mb-4">Statute Annotation</h2>
            {statute && (
              <>
                <div className="font-mono text-blue-700 mb-2">{statute}</div>
                <a
                  href={`https://oregon.public.law/statutes/ors_${baseStatute}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800"
                >
                  View on Oregon Public Law
                </a>
                <p className="my-4">
                  See details below for <strong>{statute}</strong>.
                </p>
                <div className="space-y-2">
                  {isLoading
                    ? "Loading details..."
                    : isError
                    ? "Unable to fetch details..."
                    : statuteDetails?.text
                        .split("\n")
                        .map((line, i) => <p key={i}>{line}</p>)}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
