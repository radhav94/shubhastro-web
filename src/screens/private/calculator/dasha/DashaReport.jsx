import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  useGetDashaRepQuery,
  useGetDashaPeriodsQuery,
} from "../../../../redux/api/calculator/calcApi";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import styles from "./DashaReport.module.scss";
import CalcBackButton from "../CalcBackButton";
import TTSButton from "../../../../component/UI/TTSButton";
import { selectCalculatorData } from "../../../../redux/calculator/calculatorSlice";
import ConnectCard from "../../../../component/UI/cards/connectCard/ConnectCard";

const DashaReport = () => {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState(0);

  const stored = useSelector(selectCalculatorData("dasha_calc"));
  const { data, isLoading } = useGetDashaRepQuery(stored);
  const { data: periodsData, isLoading: periodsLoading } =
    useGetDashaPeriodsQuery(stored);

  if (isLoading || periodsLoading) return <PrimaryLoader isLoading={true} />;
  if (!data?.response?.dashas) return <div>No data found</div>;

  const dashas = data.response.dashas;
  const periods = periodsData?.response || [];

  const toggleCard = (index) => {
    setOpenIndex((prev) => (prev === index ? -1 : index));
  };

  return (
    <>
    <div className={styles.wrapper}>
      <CalcBackButton />
      <h2 className={styles.title}>
        {stored?.name
          ? `${stored.name}'s Planetary Dasha Periods`
          : "Planetary Dasha Periods"}
      </h2>

      <p className={styles.subtitle}>
        Complete analysis of your planetary periods and their influences
      </p>

      {/* DASHA PERIOD CARDS (from maha-dasha API) */}
      {periods.length > 0 && (
        <div className={styles.periodsGrid}>
          {periods.map((item, index) => (
            <div key={index} className={styles.periodCard} style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', top: '4px', right: '4px', display: 'inline-flex', zIndex: 10, pointerEvents: 'auto' }}>
                <TTSButton text={`${item.planet}. ${item.start} to ${item.end}`} />
              </span>
              <div className={styles.periodPlanet}>{item.planet}</div>
              <div className={styles.periodInfo}>
                <span className={styles.periodDate}>
                  {item.start} – {item.end}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PREDICTION CARDS — accordion on mobile */}
      <div className={styles.cardsGrid}>
        {dashas.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={index} className={styles.dashaCard}>
              <div
                className={styles.cardHeader}
                onClick={() => toggleCard(index)}
              >
                <h3>
                  {item.dasha} Mahadasha
                  {index === 0 && (
                    <span className={styles.badge}>Birth Dasha</span>
                  )}
                </h3>
                <div className={styles.headerRight}>
                  <span className={styles.date}>
                    {item.dasha_start_year} – {item.dasha_end_year}
                  </span>
                  <span style={{ display: 'inline-flex' }} onClick={(e) => e.stopPropagation()}>
                    <TTSButton text={`${item.dasha} Mahadasha. ${item.dasha_start_year} to ${item.dasha_end_year}. ${item.planet_in_zodiac || ''}. ${item.prediction || ''}`} />
                  </span>
                  <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}>
                    ▾
                  </span>
                </div>
              </div>

              <div
                className={`${styles.cardBody} ${isOpen ? styles.cardBodyOpen : ""}`}
              >
                <div className={styles.highlight}>
                  {item.planet_in_zodiac || "No data available"}
                </div>

                {item.prediction && (
                  <p className={styles.description}>{item.prediction}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* TIMELINE */}
      <div className={styles.timeline}>
        {dashas.map((item, index) => (
          <div
            key={index}
            className={`${styles.timelineRow} ${
              index % 2 === 0 ? styles.left : styles.right
            }`}
          >
            <span className={styles.dot} />
            <div className={styles.timelineCard}>
              <h4>{item.dasha} Period</h4>
              <span className={styles.timelineDate}>
                {item.dasha_start_year} – {item.dasha_end_year}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ACTIONS */}
      <div className={styles.actions}>
        <button className={styles.calculateBtn} onClick={() => navigate(-1)}>
          Calculate Again
        </button>
      </div>

      <div className={styles.connectCardWrap}>
        <ConnectCard />
      </div>
    </div>
    </>
  );
};

export default DashaReport;
