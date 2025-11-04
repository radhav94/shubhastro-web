import DynamicChart from "../../../../component/UI/charts/kundli/DynamicChart";
import styles from "./ChartsContent.module.scss";
const NorthIndian = ({ data }) => {

  function getSvgUrl(svgString) {
  return svgString ? `data:image/svg+xml;base64,${btoa(svgString)}` : null;
}

// Usage
const svgChalitUrl = getSvgUrl(data?.chalitChart);
const svgSunUrl = getSvgUrl(data?.sunChart?.svg);
const svgMoonUrl = getSvgUrl(data?.moonChart?.svg);
const svgBirthUrl = getSvgUrl(data?.birthChart?.svg);
const svgHoraUrl = getSvgUrl(data?.horaChart?.svg);
const svgDrekkanaUrl = getSvgUrl(data?.drekkanaChart?.svg);
const svgChaturthamsaChartaUrl = getSvgUrl(data?.chaturthamsaChart?.svg);
const svgSaptamsaChartUrl = getSvgUrl(data?.saptamsaChart?.svg);
const svgNavamsaUrl = getSvgUrl(data?.navamsaChart?.svg);
const svgDasamsaUrl = getSvgUrl(data?.dasamsaChart?.svg);
const svgDwadasamsaUrl = getSvgUrl(data?.dwadasamsaChart?.svg);
const svgShodasamsaUrl = getSvgUrl(data?.shodasamsaChart?.svg);
const svgVimsamsaUrl = getSvgUrl(data?.vimsamsaChart?.svg);
const svgChaturvisamsaUrl = getSvgUrl(data?.chaturvisamsaChart?.svg);
const svgSaptavisamsaUrl = getSvgUrl(data?.saptavisamsaChart?.svg);
const svgTrimsamsaUrl = getSvgUrl(data?.trimsamsaChart?.svg);
const svgKhavedamsaUrl = getSvgUrl(data?.khavedamsaChart?.svg);
const svgAkshavedamsaaUrl = getSvgUrl(data?.akshavedamsaChart?.svg);
const svgShashtiamsaaUrl = getSvgUrl(data?.shashtiamsaChart?.svg);

  return (
    <div>
      <div className={styles.mainContainer}>
        <div className={styles.grid}>
          <DynamicChart title="Chalit" src={svgChalitUrl} />
          <DynamicChart title="Sun" src={svgSunUrl} />
          <DynamicChart title="Moon" src={svgMoonUrl} />
          <DynamicChart title="Lagna / Ascendant / Basic Birth Chart" src={svgBirthUrl} />
          <DynamicChart title="Hora (Wealth / Income Chart)" src={svgHoraUrl} />
          <DynamicChart title="Drekkana (Relationship with siblings)" src={svgDrekkanaUrl} />
          <DynamicChart title="Chaturthamsa (Assets)" src={svgChaturthamsaChartaUrl} />
          <DynamicChart title="Saptamsa (Progeny)" src={svgSaptamsaChartUrl} />
          <DynamicChart title="Dasamsa (Profession)" src={svgNavamsaUrl} />
          <DynamicChart title="Navamsa (Prospects of marriage)" src={svgDasamsaUrl} />
          <DynamicChart title="Dwadasamsa (Native parents / Ancestors)" src={svgDwadasamsaUrl} />
          <DynamicChart title="Shodasamsa (Travel)" src={svgShodasamsaUrl} />
          <DynamicChart title="Vimsamsa (Spiritual progress)" src={svgVimsamsaUrl} />
          <DynamicChart title="Chaturvimsamsa (Intellectual)" src={svgChaturvisamsaUrl} />
          <DynamicChart title="Saptavimsamsa (Strength / Protection)" src={svgSaptavisamsaUrl} />
          <DynamicChart title="Trimsamsa (Misfortunes)" src={svgTrimsamsaUrl} />
          <DynamicChart title="Khavedamsa (Auspicious time)" src={svgKhavedamsaUrl} />
          <DynamicChart title="Akshavedamsa (General issues)" src={svgAkshavedamsaaUrl} />
          <DynamicChart title="Shastiamsa (Summary of charts)" src={svgShashtiamsaaUrl} />
        </div>

        {/* Planetary Table */}

      </div>
    </div>
  )
}

export default NorthIndian;