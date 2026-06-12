import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import styles from "./ServiceCards.module.scss";
import { IoArrowBackOutline, IoArrowForwardOutline } from "react-icons/io5";
import { PrimaryText, Title } from "../../../../../component";
import { useNavigate, useLocation } from "react-router-dom";
import { PATH } from "../../../../../utils/routes/Paths";
import { AppIcons ,DefaultImages} from "../../../../../utils/appImages";
import { useGetNewHomeDetailsQuery } from "../../../../../services/appServices/homeServices";
import PrimaryLoader from "../../../../../component/UI/PrimaryLoader";

const iconMap = {
  "free-kundli": AppIcons.Kundali,
  "kundli-matching": AppIcons.Astrology,
  numerology: AppIcons.Star,
  tarot: AppIcons.Tarot,
};



const ServiceCards = () => {
  //  HOOK MUST RUN ALWAYS (Fixes your error)
  const { data, isLoading } = useGetNewHomeDetailsQuery('complimentary-service');
  const [disableLeft, setDisableLeft] = useState(true);
  const [disableRight, setDisableRight] = useState(false);

  const scrollRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const bannerSection = data?.data?.list?.find(
    (item) => item.display_type === "complementary-services",
  );
  const preferredOrder = ["free-kundli", "generate-my-kundli", "talk-to-astrologer", "explore-daily-horoscope", "daily-horoscope"];
  const rawServices = bannerSection?.content || [];
  const isKundliPage = location.pathname.startsWith("/kundli");
  const filteredServices = isKundliPage ? rawServices : [];
  const services = [...filteredServices].sort((a, b) => {
    const idxA = preferredOrder.indexOf(a.slug);
    const idxB = preferredOrder.indexOf(b.slug);
    return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
  });

  const slugRoutes = {
    "free-kundli": PATH.privateRoutes.KUNDLI.path,
    "kundli-matching": PATH.privateRoutes.MATCHMAKING.path,
    numerology: PATH.privateRoutes.NUMEROLOGY.path,
    "talk-to-astrologer": PATH.privateRoutes.Chat_With_ASTROLOGER.path,
    "daily-horoscope": "/daily-horoscope",
    "explore-daily-horoscope": "/daily-horoscope",
    // tarot: PATH.privateRoutes.TAROT.path,
  };

  const updateButtons = () => {
    const container = scrollRef.current;
    if (!container) return;
    setDisableLeft(container.scrollLeft <= 5);
    setDisableRight(
      container.scrollLeft + container.offsetWidth >= container.scrollWidth - 5,
    );
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

  //  Render loader BELOW hooks (correct pattern)
  if (isLoading) {
    return (
      <div className={styles.wrapper}>
        <PrimaryLoader isLoading={isLoading} />
      </div>
    );
  }
  const handleClick = (service) => {
    if (service.slug === "tarot") {
      return navigate("/tarot/yes-no-tarot");
    }
    const path = slugRoutes[service.slug] || `/horoscope/${service.slug}`;
    navigate(path);
  };

  if (!services.length) return null;

  return (
    <div className={styles.wrapper}>
      <Title title={bannerSection?.display_title} showDivider />

      {/* <div className={styles.carouselWrapper}> */}
        {/* <button
          className={`${styles.arrowBtn} ${disableLeft ? styles.disabled : ""}`}
          disabled={disableLeft}
          onClick={() => scrollByOneCard("left")}
        >
          <IoArrowBackOutline size={22} />
        </button> */}

        <div className={styles.horizontalScroll} ref={scrollRef}>
          {services.map((service) => (
            <motion.div key={service._id} className={styles.card}>
              <div
                className={styles.cardContent}
                onClick={() => handleClick(service)}
              >
                <img
                  src={service.icon || iconMap["numerology"] || DefaultImages?.AriesDefault}
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

        {/* <button
          className={`${styles.arrowBtn} ${
            disableRight ? styles.disabled : ""
          }`}
          disabled={disableRight}
          onClick={() => scrollByOneCard("right")}
        >
          <IoArrowForwardOutline size={22} />
        </button> */}
      </div>
    // </div>
  );
};

export default ServiceCards;
