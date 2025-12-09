interface Props {
  name: string;
  value: string;
  description: string;
  handleFunction: (option: string | null) => void;
  children: React.ReactNode;
}

export default function SelectField({
  name,
  value,
  description,
  handleFunction,
  children,
}: Props) {
  return (
    <select
      name={name}
      value={value || ""}
      onChange={(event) => handleFunction(event.target.value)}
      className="p-3 border border-[#ddd] rounded-md box-border transition-colors duration-300 focus:outline-0 focus:border-[#4a90e2] focus:shadow-[0_0_0_2px_rgba(74,144,226,0.2)]"
      required
    >
      <option value="" disabled>
        {description}
      </option>
      {children}
    </select>
  );
}
