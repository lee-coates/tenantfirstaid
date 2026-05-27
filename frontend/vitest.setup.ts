/// <reference types="@testing-library/jest-dom" />
import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement matchMedia; MobilePanel uses it to resync open state
// across the lg breakpoint. Provide a minimal stub so component tests render.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
