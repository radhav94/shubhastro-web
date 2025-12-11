import React, { useRef, useState, useEffect } from "react";
import styles from "./ZodiacCarousel.module.scss";
import { IoArrowBackOutline, IoArrowForwardOutline } from "react-icons/io5";
import { Link, useLocation } from "react-router-dom";
import { zodiac } from "../zodiac";
import { PrimaryText } from "../../../../component";

const ZodiacCarousel = () => {
  const [data] = zodiac();
  const scrollRef = useRef(null);
  const { pathname } = useLocation();
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
      <PrimaryText isBold isCenter size_24>
        Todays Horoscope
      </PrimaryText>
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
              <div
                to={`/horoscopes/todays-horoscope/${sign.name.toLowerCase()}`}
                className={styles.imgCircle}
              >
                <Link
                  to={`/horoscopes/todays-horoscope/${sign.name.toLowerCase()}`}
                >
                  <img src={sign.img} alt={sign.name} />
                </Link>
              </div>
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
