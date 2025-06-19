import type { IMessage } from "../../../hooks/useMessages";

function sanitizeText(str: string) {
  // Strips anchor tags
  str = str.replace(/<a\b[^>]*>(.*?)<\/a>/gi, "$1");

  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export default function exportMessages(messages: IMessage[]) {
  if (messages.length < 2) return;

  const newDocument = window.open("", "", "height=800,width=600");
  const messageChain = messages
    .map(
      ({ role, content }) =>
        `<p><strong>${
          role.charAt(0).toUpperCase() + role.slice(1)
        }</strong>: ${sanitizeText(content)}</p>`
    )
    .join("");

  newDocument?.document.writeln(`
    <html>
    <head>
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'none'; object-src 'none'; base-uri 'none'; style-src 'self'; img-src 'self' data:; font-src 'self'; form-action 'none';">
      <title>Conversation History</title>
      <style>
        body {
          font-family: sans-serif;
          padding: 20px;
        }
        strong {
          font-weight: bold;
        }
        p {
          margin: 12px;
        }
      </style>
    </head>
    <body>
      ${messageChain}
    </body>
    </html>
  `);

  newDocument?.document.close();
  newDocument?.focus();
  newDocument?.print();
}
