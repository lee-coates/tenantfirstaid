import { Link } from "react-router-dom";

interface Props {
  isOngoing: boolean;
}

export default function LetterDisclaimer({ isOngoing }: Props) {
  return isOngoing ? (
    <span>
      <strong>Disclaimer</strong>: This tool provides general information and
      drafts letters based solely on what you enter. It is not legal advice and
      does not create an attorney–client relationship. As explained further in
      the{" "}
      <Link to="/privacy-policy" target="_blank" className="underline">
        Privacy Policy
      </Link>
      , we do not save any data from these conversations, but you can enter your
      personal information into the chatbox and it will appear in the
      corresponding brackets of the letter.
    </span>
  ) : (
    <span>
      The information provided by this chatbot is general information only and
      does not constitute legal advice. While Tenant First Aid strives to keep
      the content accurate and up to date, completeness and accuracy is not
      guaranteed. If you have a specific legal issue or question, consider
      contacting a qualified attorney or a local legal aid clinic for
      personalized assistance.
    </span>
  );
}
