import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import styles from "./ServiceCards.module.scss";
import { IoArrowBackOutline, IoArrowForwardOutline } from "react-icons/io5";
import { PrimaryText, Title } from "../../../../../component";
import { useNavigate } from "react-router-dom";
import { PATH } from "../../../../../utils/routes/Paths";
import { AppIcons } from "../../../../../utils/appImages";
import { useGetHomeDetailsQuery } from "../../../../../services/appServices/homeServices";
import PrimaryLoader from "../../../../../component/UI/PrimaryLoader";

const iconMap = {
  "free-kundli": AppIcons.Kundali,
  "kundli-matching": AppIcons.Astrology,
  numerology: AppIcons.Star,
  tarot: AppIcons.Tarot,
};

const ServiceCards = () => {
  // ⛔ HOOK MUST RUN ALWAYS (Fixes your error)
  const { data, isLoading } = useGetHomeDetailsQuery();

  const scrollRef = useRef(null);
  const navigate = useNavigate();

  const bannerSection = data?.data?.list?.find(
    (item) => item.display_type === "complementary-services"
  );
  const services = bannerSection?.content || [];

  const slugRoutes = {
    "free-kundli": PATH.privateRoutes.KUNDLI.path,
    "kundli-matching": PATH.privateRoutes.MATCHMAKING.path,
    numerology: PATH.privateRoutes.NUMEROLOGY.path,
    tarot: PATH.privateRoutes.TAROT.path,
  };

  const updateButtons = () => {
    const container = scrollRef.current;
    if (!container) return;
  };

  useEffect(() => {
    updateButtons();
  }, []);

  const scrollByOneCard = (direction) => {
    const container = scrollRef.current;
    if (!container) return;

    const cardWidth = container.firstChild.getBoundingClientRect().width + 18;

    const scrollAmount = direction === "right" ? cardWidth : -cardWidth;

    container.scrollBy({ left: scrollAmount, behavior: "smooth" });

    setTimeout(updateButtons, 300);
  };

  // ⬇️ Render loader BELOW hooks (correct pattern)
  if (isLoading) {
    return (
      <div className={styles.wrapper}>
        <PrimaryLoader isLoading={isLoading} />
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <Title title="Complementary Astrology Services" showDivider />

      <div className={styles.carouselWrapper}>
        <button
          className={styles.arrowBtn}
          onClick={() => scrollByOneCard("left")}
        >
          <IoArrowBackOutline size={22} />
        </button>

        <div className={styles.horizontalScroll} ref={scrollRef}>
          {services.map((service) => (
            <motion.div key={service._id} className={styles.card}>
              <div
                className={styles.cardContent}
                onClick={() => {
                  const path =
                    slugRoutes[service.slug] || `/horoscopes/${service.slug}`;
                  navigate(path);
                }}
              >
                <img
                  src={iconMap[service.slug] || iconMap["numerology"]}
                  alt={service.title}
                  className={styles.icon}
                />

                <PrimaryText className={styles.title}>
                  {service.title}
                </PrimaryText>

                <PrimaryText className={styles.description}>
                  {service.description?.length > 130
                    ? service.description.slice(0, 130) + "..."
                    : service.description}
                </PrimaryText>
              </div>
            </motion.div>
          ))}
        </div>

        <button
          className={styles.arrowBtn}
          onClick={() => scrollByOneCard("right")}
        >
          <IoArrowForwardOutline size={22} />
        </button>
      </div>
    </div>
  );
};

export default ServiceCards;
