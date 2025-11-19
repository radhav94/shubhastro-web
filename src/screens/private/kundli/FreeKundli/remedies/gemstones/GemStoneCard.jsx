import React from "react";
import PrimaryText from "../../../../../../component/PrimaryText";
import styles from "./GemStoneCard.module.scss";

const GemStoneCard = ({ gem }) => {
    if (!gem) return null;

    return (
        <div className={styles.wrapper}>

            {/* TITLE */}
            <PrimaryText size="xl" weight="700" className={styles.title}>
                {gem.name}
            </PrimaryText>

            <PrimaryText size="md" weight="500" className={styles.subTitle}>
                Planet: {gem.planet}
            </PrimaryText>

            {/* DESCRIPTION */}
            <PrimaryText size="base" className={styles.description}>
                {gem.description}
            </PrimaryText>

            {/* BASIC DETAILS CARD */}
            <div className={styles.cardBox}>
                <PrimaryText size="lg" weight="600" className={styles.cardTitle}>
                    Basic Details
                </PrimaryText>

                <div className={styles.grid}>
                    <div><strong>Gem:</strong> {gem.gem}</div>
                    <div><strong>Other Name:</strong> {gem.other_name}</div>
                    <div><strong>Finger:</strong> {gem.finger}</div>
                    <div><strong>Weight:</strong> {gem.weight}</div>
                    <div><strong>Day:</strong> {gem.day}</div>
                    <div><strong>Metal:</strong> {gem.metal}</div>
                </div>
            </div>

            {/* SUBSTITUTE */}
            <div className={styles.cardBox}>
                <PrimaryText size="lg" weight="600" className={styles.cardTitle}>
                    Substitutes
                </PrimaryText>

                <div className={styles.rowList}>
                    {gem.substitute.map((item, index) => (
                        <div key={index} className={`${styles.rowItem} ${styles.subRow}`}>
                            {item}
                        </div>
                    ))}
                </div>
            </div>

            {/* NOT TO WEAR WITH */}
            <div className={styles.cardBox}>
                <PrimaryText size="lg" weight="600" className={styles.cardTitle}>
                    Not to Wear With
                </PrimaryText>

                <div className={styles.rowList}>
                    {gem.not_to_wear_with.map((item, index) => (
                        <div key={index} className={`${styles.rowItem} ${styles.notRow}`}>
                            {item}
                        </div>
                    ))}
                </div>
            </div>

            {/* GOOD RESULTS */}
            <div className={styles.cardBox}>
                <PrimaryText size="lg" weight="600" className={styles.cardTitle}>
                    Good Results
                </PrimaryText>

                <div className={styles.rowList}>
                    {gem.good_results.map((item, index) => (
                        <div key={index} className={`${styles.rowItem} ${styles.goodRow}`}>
                            {item}
                        </div>
                    ))}
                </div>
            </div>

            {/* DISEASES */}
            <div className={styles.cardBox}>
                <PrimaryText size="lg" weight="600" className={styles.cardTitle}>
                    Diseases It Helps With
                </PrimaryText>

                <div className={styles.rowList}>
                    {gem.diseases_cure.map((item, index) => (
                        <div key={index} className={`${styles.rowItem} ${styles.disRow}`}>
                            {item}
                        </div>
                    ))}
                </div>
            </div>

            {/* FLAW RESULTS */}
            <div className={styles.cardBox}>
                <PrimaryText size="lg" weight="600" className={styles.cardTitle}>
                    Flaws & Their Effects
                </PrimaryText>

                <div className={styles.table}>
                    {gem.flaw_results.map((row, index) => (
                        <div className={styles.tableRow} key={index}>
                            <div className={styles.cellLeft}>{row.flaw_type}</div>
                            <div className={styles.cellRight}>{row.flaw_effects}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* TIME TO WEAR */}
            <div className={styles.cardBox}>
                <PrimaryText size="lg" weight="600" className={styles.cardTitle}>
                    Time to Wear
                </PrimaryText>
                <PrimaryText size="base">{gem.time_to_wear}</PrimaryText>
            </div>

            {/* METHODS */}
            <div className={styles.cardBox}>
                <PrimaryText size="lg" weight="600" className={styles.cardTitle}>
                    How to Wear
                </PrimaryText>
                <PrimaryText size="base">{gem.methods}</PrimaryText>
            </div>

            {/* MANTRA */}
            <div className={styles.cardBox}>
                <PrimaryText size="lg" weight="600" className={styles.cardTitle}>
                    Mantra
                </PrimaryText>
                <PrimaryText size="base" className={styles.mantra}>
                    {gem.mantra}
                </PrimaryText>
            </div>

        </div>
    );
};

export default GemStoneCard;
