import { useState } from "react";
import clsx from "clsx";

interface Inquiry {
  question: string;
  answer: string;
}

// Placeholder Oregon-focused FAQ content. Pending review by a qualified
// attorney before merging — figures and timelines should be verified against
// current ORS chapter 90 and any recent legislative changes.
const INQUIRIES: Inquiry[] = [
  {
    question: "How much can a landlord increase rent in Oregon?",
    answer:
      "Under Oregon's statewide rent stabilization law (SB 611, 2023), most rent increases are capped at 10% or 7% plus inflation per year, whichever is lower. Landlords must give 90 days' written notice. Buildings less than 15 years old and certain subsidized housing are generally exempt.",
  },
  {
    question: "What is the deadline for returning a security deposit?",
    answer:
      "Oregon landlords must return a tenant's security deposit, along with a written accounting of any deductions, within 31 days after the tenancy ends and the tenant has delivered possession.",
  },
  {
    question: 'What makes a rental unit "habitable"?',
    answer:
      "Under ORS 90.320, a unit must have working plumbing, heat, hot and cold water, weatherproofing, safe electrical, working smoke and carbon monoxide alarms, and be free from infestations and serious structural hazards. The landlord must maintain these conditions throughout the tenancy.",
  },
  {
    question: "Can a tenant withhold rent for repairs?",
    answer:
      "Oregon does not allow tenants to simply stop paying rent over repair issues. Instead, tenants generally must give the landlord written notice and an opportunity to repair, then may pursue remedies such as repair-and-deduct (within limits), rent reduction, or terminating the lease. Withholding rent without following the statutory process can lead to eviction.",
  },
  {
    question: "What is the eviction process in Oregon?",
    answer:
      "An eviction (Forcible Entry and Detainer, or FED) starts with the landlord delivering a written termination notice — for example, a 72-hour or 144-hour notice for nonpayment of rent. If the tenant does not cure or move out, the landlord must file an FED case in court; only the sheriff, acting on a court judgment, can physically remove a tenant.",
  },
];

/**
 * Static FAQ accordion shown on the Chat page left rail.
 * Modeled after the PNW Housing Assistant "Frequent Inquiries" panel:
 * click a question to expand its answer. Not wired into the chat agent.
 */
export default function FrequentInquiries() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="flex flex-col gap-3 p-4 pt-8">
      <h2 className="hidden lg:block text-xl">Frequent Inquiries</h2>
      <ul className="flex flex-col gap-2">
        {INQUIRIES.map((inquiry, index) => {
          const isOpen = openIndex === index;
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
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full text-left text-sm rounded-none shadow-none"
              >
                {inquiry.question}
              </button>
              <div
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
                  <span className="block px-3 py-3">{inquiry.answer}</span>
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
