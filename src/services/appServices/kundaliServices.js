import { callAstrologyAPI } from "./kundaliDIrectApi";

export const getKundliData = async (values) => {
  const [birthDetails, birthPanchang, astroDetails] = await Promise.all([
    callAstrologyAPI("birth_details", values),
    callAstrologyAPI("basic_panchang", values),
    callAstrologyAPI("astro_details", values),
  ]);

  return { birthDetails, birthPanchang, astroDetails };
};
