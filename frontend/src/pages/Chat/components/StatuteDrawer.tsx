interface StatuteDrawerProps {
    open: boolean;
    statute: string | null;
    onClose: () => void;
}

export default function StatuteDrawer({ open, statute, onClose }: StatuteDrawerProps) {
    const baseStatuteMatch = statute?.match(/(?:ORS\s*)?(\d{2,3}\.\d+)/);
    const baseStatute = baseStatuteMatch ? baseStatuteMatch[1] : "";

    return (
        <div
            className={`
                    fixed sm:static bottom-0 right-0
                    transition-transform duration-500
        ease-[cubic-bezier(.22,1.5,.36,1)] bg-white shadow-lg overflow-hidden
                    w-full sm:w-96
                    h-[70vh] sm:h-[calc(100dvh-10rem)]
                    z-50
                    ${open ? "translate-y-0 sm:translate-y-0" : "translate-y-full sm:hidden"}
                    
                `}
        >
            {open && (
                <div className="relative h-full flex flex-col overflow-y-auto">
                    <button
                        className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 cursor-pointer text-3xl leading-none"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-10 h-10 text-[#4a90e2]"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <div className="p-8">
                        <h2 className="text-xl font-bold mb-4">Statute Annotation</h2>
                        {statute && (
                            <div>
                                <div className="font-mono text-blue-700 mb-2">{statute}</div>
                                <a
                                    href={`https://oregon.public.law/statutes/ors_${baseStatute}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 underline hover:text-blue-800"
                                >
                                    View on Oregon Public Law
                                </a>
                                <p className="mt-4">
                                    Annotation or details for <strong>{statute}</strong> go here.
                                </p>
                                <p>
                                    Lorem ipsum, dolor sit amet consectetur adipisicing elit. Facilis voluptates quia alias impedit aspernatur beatae eveniet quisquam adipisci veniam nam eum ex, id molestias itaque illum est expedita repudiandae corporis.
                                    Dolorum placeat asperiores quis porro. Non et reprehenderit minima repellat sapiente itaque sed, perferendis harum cumque alias esse aliquid exercitationem commodi deleniti vitae debitis libero reiciendis aspernatur earum eum vero?
                                    Dignissimos cum nulla numquam cupiditate modi iure ullam exercitationem obcaecati recusandae eum? Consequatur repudiandae illum quia. Nesciunt beatae nulla illum doloremque, dolorum voluptas neque, saepe, quo ex totam maxime? Nemo!
                                    Suscipit excepturi quos, a laudantium atque, doloremque illum quaerat impedit tenetur quod quibusdam aperiam sapiente consequuntur dolores, praesentium tempora incidunt voluptate qui? Facilis corrupti culpa nobis repellendus doloremque quo laboriosam.
                                    Sapiente reprehenderit aspernatur assumenda distinctio, magni in laudantium consequatur quod et! Unde cupiditate accusamus est eos possimus repellendus labore quaerat amet quo quod incidunt ipsum dolorum provident libero, recusandae consequuntur?
                                    Illo, facere. Omnis reiciendis dolorem sit debitis harum, consequatur quisquam soluta velit, expedita eum mollitia culpa modi dolores perferendis, sed vitae vel totam? Animi qui facere placeat labore quam expedita.
                                    Facere, deserunt quis. Animi quos omnis est ipsam eius sunt a totam distinctio atque. Alias necessitatibus temporibus in architecto. Omnis voluptate minima reiciendis ullam fugiat praesentium, accusamus id repudiandae aut?
                                    Eius nisi quidem quae consequatur autem exercitationem labore nobis. Quas saepe iusto ratione corporis ipsa quae inventore fuga quos! Molestiae esse magni quasi! Debitis laudantium tenetur itaque officia quaerat. Minus.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}