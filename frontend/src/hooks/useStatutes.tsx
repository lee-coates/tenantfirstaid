import { useQuery } from "@tanstack/react-query";

interface IStatuteDetails {
  section: string;
  text: string;
}

async function fetchStatute(statute: string): Promise<IStatuteDetails> {
  try {
    const response = await fetch(`/api/citation?section=${statute}`);
    const results = await response.json();
    return results;
  } catch (err) {
    throw new Error(`Failed to fetch statute. ${err}`);
  }
}

export default function useStatutes(statute: string) {
  const { data, isLoading } = useQuery({
    queryKey: ["statute", statute],
    queryFn: async () => fetchStatute(statute),
    enabled: !!statute,
  });

  return {
    statuteDetails: data,
    isLoading,
  };
}
