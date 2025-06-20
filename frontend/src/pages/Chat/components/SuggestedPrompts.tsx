interface SuggestedPromptsProps {
    onPromptClick: (prompt: string) => void;
}

const prompts = [
    "Do I qualify for Section 8?",
    "I have a leak in my roof. Help me address this with my landlord.",
    "I received an eviction notice for non-payment of rent. What should I do?",
    "I received a 'no-cause' eviction notice. How much money is my landlord required to pay me to move out?",
];

export default function SuggestedPrompts({ onPromptClick }: SuggestedPromptsProps) {
    return (
        <div className="xl:w-1/3 items-center m-auto ">
            <div className=" flex flex-col gap-4 fade-in-up items-center ">
                {prompts.map((prompt, idx) => (
                    <button
                        key={idx}
                        className="inline-flex px-3 border border-[#1f584f] rounded-4xl cursor-pointer py-1 font-medium sm:bg-white hover:bg-[#bac9b2]  "
                        onClick={() =>
                            onPromptClick(
                                Array.isArray(prompt) ? prompt.join(" ") : prompt
                            )
                        }
                        type="button"
                    >
                        {prompt}
                    </button>
                ))}
            </div>
        </div>
    );
}