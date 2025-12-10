import { createContext, useCallback, useMemo, useState } from "react";

export interface ILocation {
  city: string | null;
  state: string | null;
}

interface IHousingContextType {
  housingLocation: ILocation;
  city: string | null;
  housingType: string | null;
  tenantTopic: string | null;
  issueDescription: string;
  handleHousingLocation: ({ city, state }: ILocation) => void;
  handleCityChange: (option: string | null) => void;
  handleHousingChange: (option: string | null) => void;
  handleTenantTopic: (option: string | null) => void;
  handleIssueDescription: (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => void;
}

const HousingContext = createContext<IHousingContextType | null>(null);

interface Props {
  children: React.ReactNode;
}

export default function HousingContextProvider({ children }: Props) {
  const [city, setCity] = useState<string | null>(null);
  const [housingLocation, setHousingLocation] = useState<ILocation>({
    city: null,
    state: null,
  });
  const [housingType, setHousingType] = useState<string | null>(null);
  const [tenantTopic, setTenantTopic] = useState<string | null>(null);
  const [issueDescription, setIssueDescription] = useState("");

  const handleHousingLocation = useCallback(({ city, state }: ILocation) => {
    setHousingLocation({ city, state });
  }, []);

  const handleCityChange = useCallback((option: string | null) => {
    setCity(option);
  }, []);

  const handleHousingChange = useCallback((option: string | null) => {
    setHousingType(option);
  }, []);

  const handleTenantTopic = useCallback((option: string | null) => {
    setTenantTopic(option);
  }, []);

  const handleIssueDescription = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setIssueDescription(event.target.value);
    },
    [],
  );

  const housingContextObject = useMemo(
    () => ({
      housingLocation,
      city,
      housingType,
      tenantTopic,
      issueDescription,
      handleHousingLocation,
      handleCityChange,
      handleHousingChange,
      handleTenantTopic,
      handleIssueDescription,
    }),
    [housingLocation, city, housingType, tenantTopic, issueDescription],
  );

  return (
    <HousingContext.Provider value={housingContextObject}>
      {children}
    </HousingContext.Provider>
  );
}

export { HousingContext };
