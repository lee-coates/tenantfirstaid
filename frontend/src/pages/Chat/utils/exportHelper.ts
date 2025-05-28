import type { IMessage } from "../../../hooks/useMessages";

export default function exportMessages(messages: IMessage[]) {
  if (messages.length < 2) return;

  const newDocument = window.open("", "", "height=800,width=600");
  const messageChain = messages
    .map(
      ({ role, content }) =>
        `<p><strong>${
          role.charAt(0).toUpperCase() + role.slice(1)
        }</strong>: ${content}</p>`
    )
    .join("");

  newDocument?.document.writeln(`
    <html>
    <head>
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
