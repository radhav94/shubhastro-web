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
    const { Jupiter, Mars, Mercury, Moon, Sarva, Saturn, Sun, Venus } = data?.data
    const ashtakVarga = data?.planetData?.filter((p) => p?.name !== "Ascendant");

    function getSvgUrl(svgString) {
        return svgString ? `data:image/svg+xml;base64,${btoa(svgString)}` : null;
    }

    // Usage
    const JupiterUrl = getSvgUrl(Jupiter);
    const MarsUrl = getSvgUrl(Mars);
    const MercuryUrl = getSvgUrl(Mercury);
    const MoonUrl = getSvgUrl(Moon);
    const sarvaUrl = getSvgUrl(Sarva);
    const saturnUrl = getSvgUrl(Saturn);
    const sunUrl = getSvgUrl(Sun);
    const venusUrl = getSvgUrl(Venus);

    return (

        <div className={styles.mainContainer}>
            <div className={styles.textContainer} >
                <h1 className={styles.cardTitle} >Ashtakvarga Chart</h1>
                <p>
                    Ashtakvarga is used to assess the strength and patterns that are present in a birth chart. The Ashtakvarga or Ashtakavarga is a numerical quantification or score of each planet placed in the chart with reference to the other 7 planets and the Lagna. In Sarva Ashtaka Varga the total scores of all the BAVs are overlaid and then totalled. This makes the SAV of the chart. The total of all the scores should be 337</p>
            </div>
            <div className={styles.grid}>
                <DynamicChart title="Sav" src={JupiterUrl} />
                <DynamicChart title="Asc" src={MarsUrl} />
                <DynamicChart title="Jupiter" src={MercuryUrl} />
                <DynamicChart title="Mars" src={MoonUrl} />
                <DynamicChart title="Mercury" src={sarvaUrl} />
                <DynamicChart title="Moon" src={saturnUrl} />
                <DynamicChart title="Saturn" src={sunUrl} />
                <DynamicChart title="Sun" src={venusUrl} />

            </div>
        </div>


    );

};

export default AshtakvargaContent;
