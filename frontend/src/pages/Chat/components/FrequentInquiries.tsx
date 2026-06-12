import { useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import clsx from "clsx";
import useActiveJurisdiction from "../../../hooks/useActiveJurisdiction";
import type { JurisdictionKey } from "../../../shared/constants/jurisdictions";
import { pathFor } from "../../../shared/utils/jurisdiction";
import { readStorage, writeStorage } from "../../../shared/utils/storage";

interface Inquiry {
  question: string;
  answer: string;
  /** Extra guidance shown only when the matching city jurisdiction is active. */
  local?: Partial<Record<Exclude<JurisdictionKey, "oregon">, string>>;
}

// Matches a statutory citation: Oregon Revised Statutes (with optional range),
// Eugene Code (EC), or Portland City Code (PCC), plus the "draft it here"
// call-to-action that links to the letter feature.
const LINKABLE =
  /ORS \d+\.\d+(?:\s*(?:–|-|to)\s*\d+\.\d+)?|EC \d+\.\d+|PCC \d+\.\d+(?:\.\d+)?|\bdraft it here\b/g;

/** Resolves a matched citation to its canonical source URL, mirroring the chat's links. */
function citationHref(citation: string): string | null {
  if (citation.startsWith("ORS ")) {
    const section = citation.match(/\d+\.\d+/)?.[0];
    return section ? `https://oregon.public.law/statutes/ors_${section}` : null;
  }
  if (citation.startsWith("EC ")) {
    return `https://eugene.municipal.codes/EC/${citation.slice(3)}`;
  }
  if (citation.startsWith("PCC ")) {
    // "PCC 30.01.085" -> /code/30/01/085 (portland.gov uses path segments per level).
    const path = citation.slice(4).split(".").join("/");
    return `https://www.portland.gov/code/${path}`;
  }
  return null;
}

/**
 * Renders answer text with each statutory citation turned into a link to its source,
 * matching the per-section citation style the chat uses (e.g. ORS 90.394 -> ors_90.394).
 * "draft it here" becomes an in-app link to the letter feature (`letterHref`);
 * a null `letterHref` renders it as plain text instead.
 */
function renderAnswer(text: string, letterHref: string | null): ReactNode[] {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(LINKABLE)) {
    const start = match.index;
    if (start > lastIndex) parts.push(text.slice(lastIndex, start));
    let node: ReactNode;
    if (match[0] === "draft it here") {
      node =
        letterHref === null ? (
          match[0]
        ) : (
          <Link
            key={start}
            to={letterHref}
            className="underline hover:opacity-80"
          >
            {match[0]}
          </Link>
        );
    } else {
      const href = citationHref(match[0]);
      node = href ? (
        <a
          key={start}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${match[0]} (opens in new tab)`}
          className="underline hover:opacity-80"
        >
          {match[0]}
        </a>
      ) : (
        match[0]
      );
    }
    parts.push(node);
    lastIndex = start + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

// Oregon-focused FAQ content drawn from the most common tenant concerns Oregon
// law librarians report from patrons. Each answer cites state law (ORS chapter 90),
// and entries with a `local` note add Portland (PCC Title 30) or Eugene (EC 8.425)
// rules shown only when that jurisdiction is active. Year-specific figures
// (e.g. the ORS 90.324 rent cap) must be re-verified annually.
const INQUIRIES: Inquiry[] = [
  {
    question: "I received an eviction notice. What should I do?",
    answer:
      "There are several types of evictions under Oregon law and tenant rights and remedies vary depending on the type. Our chatbot can provide more information on specific types. No matter what, be sure to show up to your hearing. Tenants who don't appear usually lose automatically, even if they have a strong defense. By attending, you can challenge an improper notice, raise a defense, or work out more time to stay or move. You may also get free legal help at or before your hearing — just bring your court papers, lease, and payment records. Check your papers for the date and time.",
  },
  {
    question: "How do I get my landlord to make a repair?",
    answer:
      "Oregon landlords must keep rentals in habitable condition (ORS 90.320), so give written notice describing the problem; if they don't fix it within a reasonable time you may have remedies including repair-and-deduct or damages (ORS 90.360, ORS 90.365 for essential services like heat or water). A dated written request protects your rights — you can draft it here.",
    local: {
      eugene:
        "Eugene's habitability standards go beyond state law: a permanent heat source must be able to reach 68°F three feet above the floor in every habitable room (portable heaters do not qualify), and landlord-supplied appliances and door and window locks must be kept in working order (EC 8.425).",
    },
  },
  {
    question: "How much can my landlord increase my rent?",
    answer:
      "For 2026 the cap is 9.5% over any 12-month period (6% for larger manufactured-dwelling parks), with only one increase per year, none in the first year, and at least 90 days' written notice (ORS 90.323; ORS 90.324 sets the annual figure).",
    local: {
      portland:
        "A rent increase of 10% or more within a rolling 12-month period triggers mandatory relocation assistance of roughly $2,900–$4,500 if you choose to move (PCC 30.01.085).",
    },
  },
  {
    question:
      "How do I recover personal property after losing access to my home?",
    answer:
      "A landlord can't lock you out, shut off your utilities, or remove your belongings without a court order — doing so is an unlawful ouster, and you can recover possession plus up to two months' rent or twice your actual damages, whichever is greater (ORS 90.375). If your tenancy has actually ended, the landlord must instead store and let you reclaim your property through the abandoned-property process (ORS 90.425); get legal help quickly either way.",
  },
  {
    question:
      "What about property damage caused by the tenant or the landlord?",
    answer:
      "A tenant is responsible for damage they cause beyond ordinary wear and tear, and the landlord may deduct reasonable repair costs from the security deposit, supported by a written accounting (ORS 90.300). The landlord, in turn, must keep the premises in repair and is responsible for damage resulting from a failure to maintain it. It is advisable to document the unit's condition with dated photographs at move-in and move-out, and to put any dispute in writing.",
    local: {
      portland:
        "The landlord must complete a photo walk-through condition report at move-in and a final inspection within one week of move-out (with 24 hours' notice), and may not charge your deposit for damage or wear that is not documented on that report (PCC 30.01.087).",
      eugene:
        "The landlord must provide photo and written documentation of the unit's condition at move-in, and again with any deposit-deduction accounting (EC 8.425).",
    },
  },
  {
    question: "How should I respond to a notice from my landlord?",
    answer:
      "It is important to read any notice carefully to identify its type, the deadline, and whether you may 'cure' (fix) the issue. A nonpayment notice (ORS 90.394) provides a set period to pay; a for-cause notice (ORS 90.392) typically allows time to correct a lease violation. Acting within that period — by paying, correcting the problem, or responding in writing — will often stop the termination. If you miss the deadline, the landlord may file an eviction case, so it is best to respond promptly and keep copies.",
    local: {
      portland:
        "A no-cause or qualifying-reason termination requires the landlord to pay relocation assistance ($2,900–$4,500 by unit size) at least 45 days before the termination date, and the notice must describe your rights (PCC 30.01.085).",
      eugene:
        "Certain terminations require 90 days' written notice plus relocation assistance equal to two months' rent (EC 8.425).",
    },
  },
  {
    question: "How are conflicts among tenants resolved?",
    answer:
      "Disputes between tenants — over noise, shared spaces, or behavior — are generally addressed through the lease and the landlord, who may enforce the rules and, in serious cases, issue a for-cause notice. It is advisable to document incidents and report them to the landlord. If another person's conduct threatens your safety, you may have additional protections; for example, ORS 90.445 addresses terminating a perpetrator's tenancy in domestic-violence situations.",
  },
  {
    question: "What is the eviction process for nonpayment of rent?",
    answer:
      "Under ORS 90.394, a landlord may terminate for nonpayment only after rent is past due. For a week-to-week tenancy, the notice must give at least 72 hours and may be served no sooner than the 5th day of the rental period. For all other tenancies, the landlord must give either a 10-day notice (no sooner than the 8th day) or a 13-day notice (no sooner than the 5th day). The notice must state the amount owed and the deadline to pay. If you pay the full past-due rent (not including late fees) by that deadline, the tenancy continues; otherwise, the landlord may file an FED eviction case.",
  },
  {
    question: "Do tenants in RV parks have eviction protections?",
    answer:
      "Yes — if you rent space in an RV park long-term (not a vacation stay of 90 days or less), you're a tenant entitled to a written rental agreement and the protections of Oregon landlord-tenant law, and the landlord must use proper notice and the court process to evict you (ORS 90.230; for-cause termination rules under ORS 90.392 and ORS 90.630).",
  },
  {
    question:
      "What do I do if my roommate, who is a co-signer on the lease, wants to move out?",
    answer:
      "Anyone who signed the lease is jointly and severally liable for the full rent and stays legally responsible even after moving out, until the landlord agrees in writing to remove them (ORS 90.220). Don't assume they're off the hook — ask the landlord to sign a new or amended agreement, which you can request in a letter.",
  },
  {
    question: "How do I respond to harassment by a landlord or manager?",
    answer:
      "Document every incident with dates, and know that landlords can't harass you or retaliate for asserting your rights, complaining, or organizing — violations can cost them up to twice your rent or actual damages plus attorney fees (ORS 90.385). A written notice demanding the conduct stop is a strong first step (draft it here).",
    local: {
      eugene:
        "Eugene tenants have added local protections, including against harassment and for relocation assistance (EC 8.425).",
    },
  },
];

const OPEN_FAQ_STORAGE_KEY = "faqOpenIndex";

/**
 * Reads the persisted open-FAQ index so the accordion survives route changes.
 * Falls back to the first entry; "none" means the user collapsed all of them.
 */
function initialOpenIndex(): number | null {
  const stored = readStorage(OPEN_FAQ_STORAGE_KEY);
  if (stored === null) return 0;
  if (stored === "none") return null;
  const index = Number(stored);
  return Number.isInteger(index) && index >= 0 && index < INQUIRIES.length
    ? index
    : 0;
}

/**
 * Static FAQ accordion shown on the Chat page left rail.
 * Modeled after the PNW Housing Assistant "Frequent Inquiries" panel:
 * click a question to expand its answer. Not wired into the chat agent.
 */
export default function FrequentInquiries() {
  const [openIndex, setOpenIndex] = useState<number | null>(initialOpenIndex);
  const { active } = useActiveJurisdiction();
  const { pathname } = useLocation();
  // On the letter page the CTA would link to the page itself (and drop any
  // ?org= context on remount), so render it as plain text there.
  const letterHref = pathname.startsWith("/letter")
    ? null
    : pathFor("letter", active);

  const toggleInquiry = (index: number) => {
    const next = openIndex === index ? null : index;
    setOpenIndex(next);
    writeStorage(OPEN_FAQ_STORAGE_KEY, next === null ? "none" : String(next));
  };

  return (
    <div className="flex flex-col gap-3 p-4 pt-8">
      <h2 className="hidden lg:block text-xl">Frequent Inquiries</h2>
      <ul className="flex flex-col gap-2">
        {INQUIRIES.map((inquiry, index) => {
          const isOpen = openIndex === index;
          const localNote =
            active.key !== "oregon" ? inquiry.local?.[active.key] : undefined;
          const panelId = `faq-answer-${index}`;
          return (
            <li
              key={inquiry.question}
              className={clsx(
                "rounded border overflow-hidden transition-colors",
                isOpen
                  ? "border-gray-dark bg-green-light/40"
                  : "border-gray-medium hover:border-gray-dark bg-white",
              )}
            >
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggleInquiry(index)}
                className="w-full text-left text-sm rounded-none shadow-none"
              >
                {inquiry.question}
              </button>
              <div
                id={panelId}
                inert={!isOpen}
                className={clsx(
                  "grid transition-[grid-template-rows] duration-300 ease-in-out",
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                )}
              >
                <p
                  className={clsx(
                    "overflow-hidden text-sm text-gray-dark border-gray-medium",
                    isOpen && "border-t",
                  )}
                >
                  <span className="block px-3 py-3">
                    {localNote && (
                      <span className="mr-1 font-semibold text-green-dark">
                        Statewide:
                      </span>
                    )}
                    {renderAnswer(inquiry.answer, letterHref)}
                  </span>
                  {localNote && (
                    <span className="block border-t border-gray-medium bg-green-light/30 px-3 py-3">
                      <span className="mr-1 font-semibold text-green-dark">
                        {active.label}:
                      </span>
                      {renderAnswer(localNote, letterHref)}
                    </span>
                  )}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
