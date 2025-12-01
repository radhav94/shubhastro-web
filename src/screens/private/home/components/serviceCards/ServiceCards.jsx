import React, { useRef } from "react";
import { motion } from "framer-motion";
import styles from "./ServiceCards.module.scss";
import { IoArrowForwardOutline } from "react-icons/io5";
import { PrimaryText, Title } from "../../../../../component";
import { useNavigate } from "react-router-dom";
import { PATH } from "../../../../../utils/routes/Paths";
import { AppIcons } from "../../../../../utils/appImages";

const iconMap = {
  "free-kundli": AppIcons.Kundali,
  "kundli-matching": AppIcons.Astrology,
  numerology: AppIcons.Star,
  tarot: AppIcons.Tarot,
};

const ServiceCards = ({ data }) => {
  const sections = data;

  const bannerSection = sections?.find(
    (item) => item.display_type === "complementary-services"
  );

  const services = bannerSection?.content || [];

  // const numerology = { _id: 4, title: "Numerology", slug: "numerology" };
  // const tarot = { _id: 5, title: "Tarot", slug: "tarot" };
  const newServices = [...services];

  const navigate = useNavigate();

  const slugRoutes = {
    "free-kundli": PATH.privateRoutes.KUNDLI.path,
    "kundli-matching": "/matchmaking",
    "numerology":PATH.privateRoutes.NUMEROLOGY.path,
    "tarot":PATH.privateRoutes.TAROT.path,
    // numerology: PATH.privateRoutes.NUMEROLOGY.path,
    // tarot: PATH.privateRoutes.TAROT.path,
  };

  return (
    <div className={styles.container}>
      {/* New Title Added */}
      <Title
                title="Complementary Astrologer Services"
                showDivider
              
              />

      <div className={styles.cardsGrid}>
        {newServices.map((service) => (
          <motion.div
            key={service._id}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 200 }}
            className={styles.card}
          >
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
                {service.description}
              </PrimaryText>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ServiceCards;
