import { useEffect } from "react";
import { scrollToTop } from "./shared/utils/scrolling";

const REFERRALS = [
  {
    organization: "LASO",
    service: "Legal Representation (Eviction cases only)",
    locations: "All of Oregon",
    contact: (
      <>
        Tenants whose landlord has taken them to eviction court can call the
        Eviction Defense Project line (888-585-9638) or email the Project
        (evictiondefense@oregonlawcenter.org) to seek legal help. Tenants
        should leave a message on the intake line or by emailing with their
        name, date of birth, and eviction case number.
      </>
    ),
  },
  {
    organization: "CLEAR Clinic",
    service: "Answer Questions (Attorneys and licensed paralegals)",
    locations: "All of Oregon",
    contact: (
      <>
        503-389-5919
        <br />
        info@clear-clinic.org
        <br />
        https://clear-clinic.org/services
        <br />
        T &amp; Th 9am–5pm
      </>
    ),
  },
  {
    organization: "Commons Law Center",
    service: "Legal Representation (Eviction cases only)",
    locations: "Portland only",
    contact: (
      <>
        M, T &amp; Th 8am–12pm
        <br />
        No appointment needed.
        <br />
        Must already have a court date — meet at Multnomah County Courthouse.
      </>
    ),
  },
  {
    organization: "PHB Renter's Services Help Desk",
    service: "Answer Questions (Non-Attorneys)",
    locations: "Portland only",
    contact: (
      <>
        RentalServices@portlandoregon.gov
        <br />
        503-823-1303
        <br />
        M, W &amp; F 9–11am, 1–4pm
        <br />
        Online booking: https://www.portland.gov/phb/rental-services/helpdesk
      </>
    ),
  },
];

export default function Referrals() {
  useEffect(() => {
    scrollToTop();
  }, []);

  return (
    <div className="w-full px-4 py-6">
      <h2 className="text-2xl font-bold mb-6 text-center">Referrals</h2>

      <div className="overflow-x-auto">
        <table className="w-[1100px] table-fixed border-collapse text-sm text-gray-dark rounded overflow-hidden mx-auto">
          <thead>
            <tr className="bg-green-light/40">
              <th className="w-[180px] border border-gray-medium px-4 py-3 text-left font-semibold">
                Organization
              </th>
              <th className="w-[270px] border border-gray-medium px-4 py-3 text-left font-semibold">
                Service
              </th>
              <th className="w-[150px] border border-gray-medium px-4 py-3 text-left font-semibold">
                Locations
              </th>
              <th className="w-[500px] border border-gray-medium px-4 py-3 text-left font-semibold">
                Availability / Contact
              </th>
            </tr>
          </thead>
          <tbody>
            {REFERRALS.map(({ organization, service, locations, contact }) => (
              <tr key={organization} className="bg-white">
                <td className="border border-gray-medium px-4 py-3 font-semibold align-top">
                  {organization}
                </td>
                <td className="border border-gray-medium px-4 py-3 align-top">
                  {service}
                </td>
                <td className="border border-gray-medium px-4 py-3 align-top">
                  {locations}
                </td>
                <td className="border border-gray-medium px-4 py-3 align-top">
                  {contact}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
