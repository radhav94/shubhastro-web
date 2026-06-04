import React from "react";
import styles from "./KundaliContent.module.scss";
import DynamicTable from "../../../../component/UI/table/kundli/DynamicTable";
import DynamicChart from "../../../../component/UI/charts/kundli/DynamicChart";
import {
  useGetChartQuery,
  useGetPlanetsQuery,
} from "../../../../redux/api/kundli/kundliApi";
import { skipToken } from "@reduxjs/toolkit/query";
import { useSelector } from "react-redux";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import { buildVedicParam } from "../../../../utils/VedicParams.js/vedicParams";
import { sanitizeSvg } from "../../../../utils/helper/sanitizeSvg";
import { planetaryHeaders, formatPlanetData } from "./NorthIndian";
import useLang from "../../../../utils/hooks/useLang";

const SouthIndian = ({ style = "south" }) => {
  const payload = useSelector((state) => state?.form?.kundliPayload);
  const lang = useLang();
  const params = payload ? buildVedicParam(payload, { style, lang }) : null;

  /** Load Planet Data */
  const {
    data,
    isLoading: planetLoading,
    isSuccess: planetSuccess,
  } = useGetPlanetsQuery(params ? params : skipToken);

  const planetData = formatPlanetData(data?.response);

  /** Load Charts */
  const {
    data: birthChart,
    isLoading: birthLoading,
    isSuccess: birthSuccess,
  } = useGetChartQuery(params ? { chartType: "D1", params } : skipToken);

  const {
    data: navamsaChart,
    isLoading: navLoading,
    isSuccess: navSuccess,
  } = useGetChartQuery(params ? { chartType: "D9", params } : skipToken);

  const loading = planetLoading || birthLoading || navLoading;

  return (
    <div>
      <PrimaryLoader isLoading={loading} />

      {planetSuccess && birthSuccess && navSuccess && (
        <div className={styles.mainContainer}>
          <div className={styles.grid}>
            {/* D1: Lagna Chart */}
            <DynamicChart
              title="Lagna / Ascendant Chart"
              src={sanitizeSvg(birthChart)}
            />

            {/* D9: Navamsa */}
            <DynamicChart
              title="Navamsa Chart"
              src={sanitizeSvg(navamsaChart)}
            />
          </div>

          {/* Planetary Table */}
          {planetData?.length > 0 && (
            <DynamicTable
              title="Planetary Details"
              headers={planetaryHeaders}
              data={planetData}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default SouthIndian;
