import React, { useRef } from "react";
import { motion } from "framer-motion";
import styles from "./ServiceCards.module.scss";
import { IoArrowForwardOutline } from "react-icons/io5";
import { PrimaryText } from "../../../../../component";
import { useNavigate } from "react-router-dom";
import { PATH } from "../../../../../utils/routes/Paths";
import kunadliIcon from "../../../../../assets/icons/kundali.png"
import astrologyIcon from "../../../../../assets/icons/astrology.png"
import starIcon from "../../../../../assets/icons/star.png"
const iconMap = {
  "free-kundli": kunadliIcon,
  "kundli-matching": astrologyIcon, 
  numerology: starIcon,
};


const ServiceCards = ({ data }) => {
  const sections = data;

  const bannerSection = sections?.find(
    (item) => item.display_type === "complementary-services"
  );

  const services = bannerSection?.content || [];

  const numerology = { _id: 4, title: "Numerology", slug: "numerology" };
  const newServices = [...services, numerology];

  const navigate = useNavigate();

  const slugRoutes = {
    "free-kundli": PATH.privateRoutes.KUNDLI.path,
    "kundli-matching": "/matchmaking",
    numerology: PATH.privateRoutes.NUMEROLOGY.path,
  };

  return (
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

            <PrimaryText className={styles.title}>{service.title}</PrimaryText>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default ServiceCards;
