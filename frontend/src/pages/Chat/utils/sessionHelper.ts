// Generate a random session ID
export default function generateSessionId(): string {
  // Use crypto API if available for better randomness
  if (window.crypto && "randomUUID" in window.crypto) {
    return window.crypto.randomUUID();
  }

  // Fallback to a simple random string
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}
