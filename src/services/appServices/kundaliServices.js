import { callAstrologyAPI } from "./kundaliDIrectApi";

export const getKundliData = async (values) => {
  const [
    birthDetails,
    birthPanchang,
    astroDetails,
    planetDetails,
    birth_chart,
    navamsa_chart,
  ] = await Promise.all([
    callAstrologyAPI("birth_details", values),
    callAstrologyAPI("basic_panchang", values),
    callAstrologyAPI("astro_details", values),
    callAstrologyAPI("planets", values),
    callAstrologyAPI("horo_chart_image/:D1", values),
    callAstrologyAPI("horo_chart_image/:D9", values),
  ]);

  return {
    birthDetails,
    birthPanchang,
    astroDetails,
    planetDetails,
    birth_chart,
    navamsa_chart,
  };
};
