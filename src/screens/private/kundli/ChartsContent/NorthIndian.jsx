import DynamicChart from "../../../../component/UI/charts/kundli/DynamicChart";
import styles from "./ChartsContent.module.scss";
const NorthIndian = ({ data }) => {
  const planets = data?.planetData?.filter((p) => p?.name !== "Ascendant");
  const svgBirthUrl = data?.birthChart?.svg
    ? `data:image/svg+xml;base64,${btoa(data?.birthChart?.svg || "")}`
    : null;
  const svgNavamsaUrl = data?.navamasaChart?.svg
    ? `data:image/svg+xml;base64,${btoa(data?.navamasaChart?.svg || "")}`
    : null;
  return (
    <div>
      <div className={styles.mainContainer}>
        <div className={styles.grid}>
          <DynamicChart title="Lagna / Ascendant Chart" src={svgBirthUrl} />
          <DynamicChart title="Navamsa" src={svgNavamsaUrl} />
          <DynamicChart title="Lagna / Ascendant Chart" src={svgBirthUrl} />
          <DynamicChart title="Navamsa" src={svgNavamsaUrl} />
          <DynamicChart title="Lagna / Ascendant Chart" src={svgBirthUrl} />
          <DynamicChart title="Navamsa" src={svgNavamsaUrl} />
          <DynamicChart title="Lagna / Ascendant Chart" src={svgBirthUrl} />
          <DynamicChart title="Navamsa" src={svgNavamsaUrl} />
          <DynamicChart title="Lagna / Ascendant Chart" src={svgBirthUrl} />
          <DynamicChart title="Navamsa" src={svgNavamsaUrl} />
          <DynamicChart title="Lagna / Ascendant Chart" src={svgBirthUrl} />
          <DynamicChart title="Navamsa" src={svgNavamsaUrl} />
          <DynamicChart title="Lagna / Ascendant Chart" src={svgBirthUrl} />
          <DynamicChart title="Navamsa" src={svgNavamsaUrl} />
          <DynamicChart title="Lagna / Ascendant Chart" src={svgBirthUrl} />
          <DynamicChart title="Navamsa" src={svgNavamsaUrl} />
          <DynamicChart title="Lagna / Ascendant Chart" src={svgBirthUrl} />
          <DynamicChart title="Navamsa" src={svgNavamsaUrl} />
          <DynamicChart title="Navamsa" src={svgNavamsaUrl} />
        </div>

        {/* Planetary Table */}

      </div>
    </div>
  )
}

export default NorthIndian;