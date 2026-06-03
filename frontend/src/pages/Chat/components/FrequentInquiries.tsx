import { useState, type ReactNode } from "react";
import clsx from "clsx";
import useActiveJurisdiction from "../../../hooks/useActiveJurisdiction";
import type { JurisdictionKey } from "../../../shared/constants/jurisdictions";

interface Inquiry {
  question: string;
  answer: string;
  /** Extra guidance shown only when the matching city jurisdiction is active. */
  local?: Partial<Record<Exclude<JurisdictionKey, "oregon">, string>>;
}

// Matches a statutory citation: Oregon Revised Statutes (with optional range),
// Eugene Code (EC), or Portland City Code (PCC). Each resolves to its own source.
const CITATION =
  /ORS \d+\.\d+(?:\s*(?:–|-|to)\s*\d+\.\d+)?|EC \d+\.\d+|PCC \d+\.\d+(?:\.\d+)?/g;

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
 */
function renderAnswer(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(CITATION)) {
    const start = match.index;
    if (start > lastIndex) parts.push(text.slice(lastIndex, start));
    const href = citationHref(match[0]);
    parts.push(
      href ? (
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
      ),
    );
    lastIndex = start + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

// Oregon-focused FAQ content drawn from the most common tenant concerns Oregon
// law librarians report from patrons. Each answer cites state law (ORS chapter 90),
// and entries with a `local` note add Portland (PCC Title 30) or Eugene (EC 8.425)
// rules shown only when that jurisdiction is active. Pending review by a qualified
// attorney before merging — figures, dollar amounts, and timelines should be
// verified against current statutes, local codes, and recent legislative changes.
const INQUIRIES: Inquiry[] = [
  {
    question: "How do I respond to a FED (eviction lawsuit)?",
    answer:
      "A Forcible Entry and Detainer (FED) is the court eviction case a landlord files under ORS 105.100 to 105.168 after serving a termination notice. Once you have been served, it is important to appear by the first appearance date listed on the summons (often about a week out); if you do not, the court may enter a default judgment against you. Appearing preserves your right to a trial, to raise defenses, and to negotiate. Because an eviction record can follow you, you should respond promptly and may wish to consult a lawyer or legal aid.",
  },
  {
    question: "How do I get repairs or action from my landlord?",
    answer:
      "Under ORS 90.320, a landlord must keep the unit habitable — including working plumbing, heat, hot and cold water, weatherproofing, safe electrical, and smoke and carbon monoxide alarms. You should make your repair request in writing and keep a dated copy. If the landlord does not make the repair, you may have remedies such as repair-and-deduct (capped at $300 under ORS 90.368), money damages, or terminating the tenancy. Withholding rent is generally not advisable, as it can lead to eviction.",
    local: {
      eugene:
        "Eugene's habitability standards go beyond state law: a permanent heat source must be able to reach 68°F three feet above the floor in every habitable room (portable heaters do not qualify), and landlord-supplied appliances and door and window locks must be kept in working order (EC 8.425).",
    },
  },
  {
    question: "How do rent increases and deposit returns work?",
    answer:
      "Under Oregon's rent stabilization law (ORS 90.323), most annual rent increases are limited to 10% or 7% plus inflation, whichever is lower, and require 90 days' written notice. Rent generally may not be raised during the first year of the tenancy or more than once in any 12-month period, and buildings less than 15 years old are typically exempt. After you move out and return possession, the landlord must provide a written accounting of any deductions and return the balance of your deposit within 31 days (ORS 90.300).",
    local: {
      portland:
        "A rent increase of 10% or more over a rolling 12-month period entitles you to relocation assistance ($2,900–$4,500 by unit size) and the right to end the tenancy instead; 5% or more requires 90 days' notice. Security deposits are also capped (generally one month's rent) and must be held in a separate account (PCC 30.01.085, PCC 30.01.087).",
      eugene:
        "A security deposit generally cannot exceed two months' rent (EC 8.425); state law sets no cap.",
    },
  },
  {
    question:
      "How do I recover personal property after losing access to my home?",
    answer:
      "When a tenant leaves belongings behind or loses access to the unit, ORS 90.425 governs how the landlord must handle that 'abandoned' personal property. The landlord must provide written notice and allow time to arrange removal — generally at least 5 days after personal delivery or 8 days after mailing (45 days for a manufactured dwelling or floating home that you own). You should respond in writing by the deadline stated in the notice to reclaim your belongings before they may be sold or disposed of.",
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
      "It depends on the arrangement. If you own your RV and rent only the space, the manufactured/floating-home and RV space rules (ORS 90.505–90.850) may apply. However, an RV park space rented as a short-term 'vacation occupancy' — where you have signed an agreement stating that it is NOT subject to ORS chapter 90 and that the RV must leave at the end of the stay — generally falls outside the Residential Landlord and Tenant Act. You should review what your written agreement says about which rules apply.",
  },
  {
    question: "What if my roommate is a co-signer who wants to move out?",
    answer:
      "Whether a person may leave mid-lease depends on the rental agreement. A co-signer or co-tenant generally remains responsible for the obligations they signed for until the lease ends or the landlord agrees in writing to release them. Adding or removing a tenant typically requires the landlord's consent and an amended agreement. It is best to obtain any change to who is on the lease — and who owes rent — in writing.",
  },
  {
    question: "How do I respond to harassment by a landlord or manager?",
    answer:
      "Oregon law prohibits landlord 'self-help' evictions — such as unlawfully removing or excluding you, or shutting off essential services like heat, water, or electricity to force you out rather than going through the courts (ORS 90.375). A tenant may recover up to two months' rent or twice their actual damages, whichever is greater. It is advisable to document the conduct with dates, photographs, and written communications, and to keep paying rent where possible. Conduct amounting to harassment based on a protected class, or retaliation for asserting your rights, may give rise to additional claims.",
  },
];

/**
 * Static FAQ accordion shown on the Chat page left rail.
 * Modeled after the PNW Housing Assistant "Frequent Inquiries" panel:
 * click a question to expand its answer. Not wired into the chat agent.
 */
export default function FrequentInquiries() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { active } = useActiveJurisdiction();

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
                onClick={() => setOpenIndex(isOpen ? null : index)}
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
                    {renderAnswer(inquiry.answer)}
                  </span>
                  {localNote && (
                    <span className="block border-t border-gray-medium bg-green-light/30 px-3 py-3">
                      <span className="mr-1 font-semibold text-green-dark">
                        {active.label}:
                      </span>
                      {renderAnswer(localNote)}
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
