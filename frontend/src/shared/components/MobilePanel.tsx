import { useEffect, useState } from "react";
import clsx from "clsx";

interface Props {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

/**
 * Wraps a side-rail's content in a tappable header on mobile (< lg).
 * On desktop the header is hidden and content renders inline so the
 * three-column layout stays intact.
 */
export default function MobilePanel({
  title,
  defaultOpen = false,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  // Reset to default when crossing the lg breakpoint so users coming back from
  // desktop (where lg:contents makes content always visible) to mobile don't
  // see the panel snap shut on previously-visible content.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = () => setOpen(defaultOpen);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [defaultOpen]);

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="lg:hidden w-full flex items-center justify-between px-4 py-3 text-xl rounded-none shadow-none border-b border-gray-light bg-paper-background"
      >
        <span>{title}</span>
        <span aria-hidden className="text-base">
          {open ? "−" : "+"}
        </span>
      </button>
      <div
        className={clsx(
          "grid transition-[grid-template-rows] duration-300 ease-in-out",
          "lg:contents",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden lg:contents">{children}</div>
      </div>
    </>
  );
}
