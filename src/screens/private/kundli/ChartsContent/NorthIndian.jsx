import { useSelector } from "react-redux";
import DynamicChart from "../../../../component/UI/charts/kundli/DynamicChart";
import styles from "./ChartsContent.module.scss";
import { useGetChartQuery } from "../../../../redux/api/kundli/kundliApi";
const NorthIndian = () => {
  const payload = useSelector((state) => state?.form?.kundliPayload);

  const chartTypes = [
    "chalit",
    "SUN",
    "MOON",
    "D1",
    "D2",
    "D3",
    "D4",
    "D5",
    "D7",
    "D9",
    "D10",
    "D12",
    "D16",
    "D20",
    "D24",
    "D27",
    "D30",
    "D40",
    "D45",
    "D60",
  ];
  const charts = chartTypes.map((type) =>
    useGetChartQuery(payload ? { chartType: type, payload } : skipToken)
  );

  function getSvgUrl(svgString) {
    return svgString ? `data:image/svg+xml;base64,${btoa(svgString)}` : null;
  }

  // Usage
  const svgChalitUrl = getSvgUrl(charts[0]?.data);
  const svgSunUrl = getSvgUrl(charts[1]?.data?.svg);
  const svgMoonUrl = getSvgUrl(charts[2]?.data?.svg);
  const svgBirthUrl = getSvgUrl(charts[3]?.data?.svg);
  const svgHoraUrl = getSvgUrl(charts[4]?.data?.svg);
  const svgDrekkanaUrl = getSvgUrl(charts[5]?.data?.svg);
  const svgChaturthamsaChartaUrl = getSvgUrl(charts[6]?.data?.svg);
  const svgSaptamsaChartUrl = getSvgUrl(charts[7]?.data?.svg);
  const svgNavamsaUrl = getSvgUrl(charts[8]?.data?.svg);
  const svgDasamsaUrl = getSvgUrl(charts[9]?.data?.svg);
  const svgDwadasamsaUrl = getSvgUrl(charts[10]?.data?.svg);
  const svgShodasamsaUrl = getSvgUrl(charts[11]?.data?.svg);
  const svgVimsamsaUrl = getSvgUrl(charts[12]?.data?.svg);
  const svgChaturvisamsaUrl = getSvgUrl(charts[13]?.data?.svg);
  const svgSaptavisamsaUrl = getSvgUrl(charts[14]?.data?.svg);
  const svgTrimsamsaUrl = getSvgUrl(charts[15]?.data?.svg);
  const svgKhavedamsaUrl = getSvgUrl(charts[16]?.data?.svg);
  const svgAkshavedamsaaUrl = getSvgUrl(charts[17]?.data?.svg);
  const svgShashtiamsaaUrl = getSvgUrl(charts[18]?.data?.svg);

  return (
    <div>
      <div className={styles.mainContainer}>
        <div className={styles.grid}>
          <DynamicChart title="Chalit" src={svgChalitUrl} />
          <DynamicChart title="Sun" src={svgSunUrl} />
          <DynamicChart title="Moon" src={svgMoonUrl} />
          <DynamicChart
            title="Lagna / Ascendant / Basic Birth Chart"
            src={svgBirthUrl}
          />
          <DynamicChart title="Hora (Wealth / Income Chart)" src={svgHoraUrl} />
          <DynamicChart
            title="Drekkana (Relationship with siblings)"
            src={svgDrekkanaUrl}
          />
          <DynamicChart
            title="Chaturthamsa (Assets)"
            src={svgChaturthamsaChartaUrl}
          />
          <DynamicChart title="Saptamsa (Progeny)" src={svgSaptamsaChartUrl} />
          <DynamicChart title="Dasamsa (Profession)" src={svgNavamsaUrl} />
          <DynamicChart
            title="Navamsa (Prospects of marriage)"
            src={svgDasamsaUrl}
          />
          <DynamicChart
            title="Dwadasamsa (Native parents / Ancestors)"
            src={svgDwadasamsaUrl}
          />
          <DynamicChart title="Shodasamsa (Travel)" src={svgShodasamsaUrl} />
          <DynamicChart
            title="Vimsamsa (Spiritual progress)"
            src={svgVimsamsaUrl}
          />
          <DynamicChart
            title="Chaturvimsamsa (Intellectual)"
            src={svgChaturvisamsaUrl}
          />
          <DynamicChart
            title="Saptavimsamsa (Strength / Protection)"
            src={svgSaptavisamsaUrl}
          />
          <DynamicChart title="Trimsamsa (Misfortunes)" src={svgTrimsamsaUrl} />
          <DynamicChart
            title="Khavedamsa (Auspicious time)"
            src={svgKhavedamsaUrl}
          />
          <DynamicChart
            title="Akshavedamsa (General issues)"
            src={svgAkshavedamsaaUrl}
          />
          <DynamicChart
            title="Shastiamsa (Summary of charts)"
            src={svgShashtiamsaaUrl}
          />
        </div>

        {/* Planetary Table */}
      </div>
    </div>
  );
};

export default NorthIndian;
