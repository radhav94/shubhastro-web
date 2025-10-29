import React from "react";
import styles from "./AshtakvargaContent.module.scss";
import DynamicChart from "../../../../component/UI/charts/kundli/DynamicChart";

const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: "easeOut" },
    },
};



const AshtakvargaContent = ({ data }) => {
    const planets = data?.planetData?.filter((p) => p?.name !== "Ascendant");
    const svgBirthUrl = data?.birthChart?.svg
        ? `data:image/svg+xml;base64,${btoa(data?.birthChart?.svg || "")}`
        : null;
    const svgNavamsaUrl = data?.navamasaChart?.svg
        ? `data:image/svg+xml;base64,${btoa(data?.navamasaChart?.svg || "")}`
        : null;

    return (

        <div className={styles.mainContainer}>
            <div className={styles.textContainer} >
                <h1 className={styles.cardTitle} >Ashtakvarga Chart</h1>
                <p>
                    Ashtakvarga is used to assess the strength and patterns that are present in a birth chart. The Ashtakvarga or Ashtakavarga is a numerical quantification or score of each planet placed in the chart with reference to the other 7 planets and the Lagna. In Sarva Ashtaka Varga the total scores of all the BAVs are overlaid and then totalled. This makes the SAV of the chart. The total of all the scores should be 337</p>
            </div>
            <div className={styles.grid}>
                {/* Bhav Chalit Chart */}
                <DynamicChart title="Sav" src={svgBirthUrl} />
                <DynamicChart title="Asc" src={svgNavamsaUrl} />
                <DynamicChart title="Jupiter"  src={svgBirthUrl} />
                <DynamicChart title="Mars" src={svgBirthUrl} />
                <DynamicChart title="Mercury" src={svgNavamsaUrl} />
                <DynamicChart title="Moon"  src={svgBirthUrl} />
                <DynamicChart title="Saturn" src={svgBirthUrl} />
                <DynamicChart title="Sun" src={svgNavamsaUrl} />
                <DynamicChart title="Venus"  src={svgBirthUrl} />

            </div>
        </div>


    );
};

export default AshtakvargaContent;
