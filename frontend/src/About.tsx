import BackLink from "./shared/components/BackLink";

export default function About() {
  return (
    <div className="flex items-center pt-16 sm:mt-26 sm:pt-0">
      <div className="relative max-w-2xl m-auto p-8 bg-[#F4F4F2] rounded-lg shadow-md">
        <BackLink />
        <p className="my-6">
          <strong>Tenant First Aid</strong> is an AI-powered chatbot designed to
          help tenants navigate rental issues, answer questions, and provides
          legal advice related to housing and eviction.
        </p>
        <h2 className="text-2xl font-semibold mt-6 mb-2">Features</h2>
        <ul className="list-disc list-inside mb-6">
          <li>Instant answers to common rental questions</li>
          <li>Guidance on tenant rights and landlord obligations</li>
          <li>Easy-to-use chat interface</li>
          <li>Available 24/7</li>
        </ul>
        <h2 className="text-2xl font-semibold mt-6 mb-2">How It Works</h2>
        <p className="mb-6">
          Simply type your question or describe your situation, and Tenant First
          Aid will provide helpful information or direct you to relevant
          resources.
        </p>
        <h2 className="text-2xl font-semibold mt-6 mb-2">Disclaimer</h2>
        <p className="">
          <strong>Tenant First Aid</strong> is an AI assistant and does not
          provide legal advice. For complex or urgent legal matters, please
          consult a qualified professional.
        </p>
      </div>
    </div>
  );
}
