import { useContext } from "react";
import { HousingContext } from "../contexts/HousingContext";

export default function useHousingContext() {
  const context = useContext(HousingContext);
  if (!context) {
    throw new Error(
      "useHousing can only be used within HousingContextProvider",
    );
  }
  return context;
}
