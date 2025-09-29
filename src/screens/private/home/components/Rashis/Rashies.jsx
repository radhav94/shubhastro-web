import React from "react";

import styles from "./Rashis.module.scss";
import { AppIcons, appSvgs } from "../../../../../utils/appImages";
import { Title } from "../../../../../component";

const rashisData = [
  { id: 1, name: "Aries", image: appSvgs.Aries },
  { id: 2, name: "Taurus", image: appSvgs.Taurus },
  { id: 3, name: "Gemini", image: appSvgs.Gemini },
  { id: 4, name: "Cancer", image: appSvgs.Cancer },
  { id: 5, name: "Leo", image: appSvgs.Leos },
  { id: 6, name: "Virgo", image: appSvgs.Virgo },
  { id: 7, name: "Libra", image: appSvgs.Libra },
  { id: 8, name: "Scorpio", image: appSvgs.Scorpio },
  { id: 9, name: "Sagittarius", image: appSvgs.Sagittarius },
  { id: 10, name: "Capricorn", image: appSvgs.Capricorn },
  { id: 11, name: "Aquarius", image: appSvgs.Aquarius },
  { id: 12, name: "Pisces", image: appSvgs.Pisces },
];

const Rashis = () => {
  return (
    <div>
      <Title title="Today's Astrologers Prediction" />

      <div className={styles.rashisContainer}>
        {rashisData.map((rashi) => (
          <div key={rashi.id} className={styles.card}>
            <img src={rashi.image} alt={rashi.name} className={styles.image} />
            <p className={styles.name}>{rashi.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Rashis;
