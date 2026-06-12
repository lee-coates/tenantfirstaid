import { useEffect, useState } from "react";

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkWindowSize = () => {
      // Collapse to the hamburger below Tailwind's lg breakpoint so the navbar
      // links never wrap to a second line (they start wrapping ~960px).
      setIsMobile(window.matchMedia("(max-width:1023px)").matches);
    };

    checkWindowSize();
    window.addEventListener("resize", checkWindowSize);
    return () => window.removeEventListener("resize", checkWindowSize);
  }, []);

  return isMobile;
}
