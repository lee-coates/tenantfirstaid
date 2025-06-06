
interface StatuteDrawerProps {
    open: boolean;
    statute: string | null;
    onClose: () => void;
}

export default function StatuteDrawer({ open, statute, onClose }: StatuteDrawerProps) {
    const baseStatuteMatch = statute?.match(/(?:ORS\s*)?(\d{2,3}\.\d+)/);
    const baseStatute = baseStatuteMatch ? baseStatuteMatch[1] : "";



    return (
        <>

            <div
                role="dialog"
                aria-modal="true"
                aria-hidden={!open}
                className={`
          sm:transition-[width] sm:duration-600 sm:ease-[cubic-bezier(.22,1.5,.36,1)]
          sm:overflow-hidden
          sm:h-[calc(100dvh-10rem)]
          ${open ? "sm:w-96 pointer-events-auto" : "sm:w-0 pointer-events-none"}
          w-full
          fixed sm:static bottom-0 right-0
          z-50
        `}
            >

                <div

                    className={`
            transition-transform duration-500 ease-[cubic-bezier(.22,1.5,.36,1)]
            bg-white shadow-lg rounded
            h-[70vh] sm:h-full
            w-full
            ${open ? "translate-y-0 sm:translate-y-0" : "translate-y-full sm:translate-y-0"}
          `}
                >
                    <div className="relative h-full flex flex-col overflow-y-auto p-8">
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
                        <h2 className="text-xl font-bold mb-4">Statute Annotation</h2>
                        {statute && (
                            <>
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
                                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Facilis voluptates
                                    quia alias impedit aspernatur beatae eveniet quisquam adipisci veniam nam eum
                                    ex, id molestias itaque illum est expedita repudiandae corporis.
                                    Lorem ipsum dolor sit, amet consectetur adipisicing elit. Dolorum adipisci, id sequi quia doloremque ipsa officia hic error neque natus? Voluptatem fuga rem ducimus dicta et eveniet dolor dolore sapiente!
                                    Adipisci numquam, quo quae perferendis ad iste tempore nostrum est, animi provident error quos, quas dolor? Aliquam cumque a esse nobis? Quis qui reiciendis aut accusamus fugit, eos soluta sequi.
                                    Ipsa, a animi minima dignissimos, at laboriosam quas voluptatem facilis quasi ab aut adipisci eaque similique quod asperiores, cupiditate recusandae est voluptas et corrupti excepturi. Maxime excepturi hic minus veniam?
                                    Laudantium, tempora. Placeat, iste eveniet, aspernatur, facilis minima dolorum culpa est unde quia modi dolor laboriosam eius veniam quas nobis error ut velit cumque a voluptatem fugit eligendi doloribus molestiae.
                                    Nostrum itaque fugiat blanditiis vero quasi! Saepe, amet quo. Iure eligendi id ipsum similique modi dolore ducimus expedita alias temporibus, magni laboriosam impedit ut accusantium veritatis delectus quis earum possimus.
                                    Neque dicta dolor nobis tempora ab nesciunt obcaecati ad officiis quam nihil. Perspiciatis nisi eligendi tempore quis eaque quaerat vitae molestias, consequuntur temporibus debitis harum aperiam aliquid aspernatur expedita mollitia?
                                    Libero itaque debitis quasi, quos asperiores possimus labore! Vero deserunt, fuga earum aliquid eos ad quo numquam, quisquam animi autem enim ullam, molestiae provident. Cum nostrum et soluta alias optio.
                                    Exercitationem soluta dignissimos cum reiciendis, eligendi eaque nisi at reprehenderit consequatur quis impedit debitis ab consequuntur et itaque! Voluptatum voluptatibus illum doloremque vitae, qui obcaecati alias eaque dolor praesentium asperiores.
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}