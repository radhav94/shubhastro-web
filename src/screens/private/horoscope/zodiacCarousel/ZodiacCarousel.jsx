import React, { useRef, useState, useEffect } from "react";
import styles from "./ZodiacCarousel.module.scss";
import { IoArrowBackOutline, IoArrowForwardOutline } from "react-icons/io5";
import { Link } from "react-router-dom";
import { zodiac, zodiacSignImages } from "../zodiac";
import { PrimaryText } from "../../../../component";
import { DefaultImages } from "../../../../utils/appImages";

const ZodiacCarousel = () => {
  const [data] = zodiac();
  const scrollRef = useRef(null);
  const signs = data.signs;

  const [disableLeft, setDisableLeft] = useState(true);
  const [disableRight, setDisableRight] = useState(false);

  const updateButtons = () => {
    const container = scrollRef.current;
    if (!container) return;

    setDisableLeft(container.scrollLeft <= 5);
    setDisableRight(
      container.scrollLeft + container.offsetWidth >= container.scrollWidth - 5
    );
  };

  useEffect(() => {
    updateButtons();
  }, []);

  const scrollByCard = (direction) => {
    const container = scrollRef.current;
    if (!container) return;

    const cardWidth = container.firstChild.getBoundingClientRect().width + 24;

    container.scrollBy({
      left: direction === "right" ? cardWidth : -cardWidth,
      behavior: "smooth",
    });

    setTimeout(updateButtons, 300);
  };

  return (
    <div className={styles.mainCon}>
      <h2 className={styles.horoscopeTitle}>
        Todays Horoscope
        <div className={styles.titleDivider}>
          <div className={styles.dividerLine}>
            <svg xmlns="http://www.w3.org/2000/svg" width="93" height="1" viewBox="0 0 93 1" fill="none">
              <path d="M92.803 0.406393C92.803 0.630933 90.7481 0.812789 88.2131 0.812789C85.6781 0.812789 0 0.630933 0 0.406393C0 0.181853 85.6786 0 88.2131 0C90.7481 0 92.803 0.181853 92.803 0.406393Z" fill="#030303"/>
            </svg>
          </div>
          <span className={styles.dividerMoon}>
            <svg xmlns="http://www.w3.org/2000/svg" width="4" height="5" viewBox="0 0 4 5" fill="none">
              <path d="M3.39392 4.18679C3.03602 4.50885 2.58016 4.7032 2.08582 4.7032C0.934798 4.7032 0 3.64991 0 2.35021C0 1.05329 0.934798 0 2.08582 0C2.18869 0 2.2891 0.00867403 2.38704 0.0232501C1.91056 0.452549 1.60687 1.11403 1.60687 1.85706C1.60687 3.04084 2.38458 4.02125 3.39392 4.18679Z" fill="#030303"/>
            </svg>
          </span>
          <div className={styles.dividerLine}>
            <svg xmlns="http://www.w3.org/2000/svg" width="93" height="1" viewBox="0 0 93 1" fill="none">
              <path d="M-4.06066e-06 0.406393C-4.06066e-06 0.630933 2.05498 0.812789 4.58996 0.812789C7.12494 0.812789 92.803 0.630933 92.803 0.406393C92.803 0.181853 7.12439 0 4.58996 0C2.05498 0 -4.06066e-06 0.181853 -4.06066e-06 0.406393Z" fill="#030303"/>
            </svg>     
          </div>
        </div>
      </h2>
      <div className={styles.carouselWrapper}>
        <button
          className={`${styles.arrowBtn} ${disableLeft ? styles.disabled : ""}`}
          disabled={disableLeft}
          onClick={() => scrollByCard("left")}
        >
          <IoArrowBackOutline size={22} />
        </button>

        <div className={styles.list} ref={scrollRef}>
          {signs.map((sign) => (
            <div key={sign.id} className={styles.card}>
              <Link
                to={`/daily-horoscope/${sign.name.toLowerCase()}`}
                className={styles.imgCircle}
              >
                <img src={zodiacSignImages[sign.name.toLowerCase()] || sign.img || DefaultImages?.AriesDefault} alt={sign.name} />
              </Link>
              <h3 className={styles.name}>{sign.name.toUpperCase()}</h3>
              <p className={styles.range}>{sign.range.toUpperCase()}</p>
            </div>
          ))}
        </div>

        <button
          className={`${styles.arrowBtn} ${
            disableRight ? styles.disabled : ""
          }`}
          disabled={disableRight}
          onClick={() => scrollByCard("right")}
        >
          <IoArrowForwardOutline size={22} />
        </button>
      </div>
    </div>
  );
};

export default ZodiacCarousel;
