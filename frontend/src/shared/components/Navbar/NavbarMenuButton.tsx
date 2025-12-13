interface Props {
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function NavbarMenuButton({
  sidebarOpen,
  setSidebarOpen,
}: Props) {
  return (
    <button
      className={`
        flex flex-col justify-center items-center
        w-10 h-10 relative z-60
        hover:bg-green-medium
        transition-colors duration-300
        group`.trim()}
      onClick={() => setSidebarOpen(!sidebarOpen)}
      aria-label="Open menu"
    >
      <span
        className={`
          block w-7 h-1
          rounded 
          transition-all duration-300 ${
            sidebarOpen
              ? "rotate-45 translate-y-2 bg-green-dark group-hover:bg-green-light"
              : "bg-green-background"
          }`.trim()}
      />
      <span
        className={`
          block w-7 h-1 my-1 
          bg-green-background 
          rounded
          transition-all duration-300
          ${sidebarOpen ? "opacity-0" : ""}`.trim()}
      />
      <span
        className={`
          block w-7 h-1
          rounded
          transition-all duration-300 ${
            sidebarOpen
              ? "-rotate-45 -translate-y-2 bg-green-dark group-hover:bg-green-light"
              : "bg-green-background"
          }`.trim()}
      />
    </button>
  );
}
