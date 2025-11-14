import React from "react";
import { motion } from "framer-motion";
import styles from "./ServiceCards.module.scss";

import { IoArrowForwardOutline } from "react-icons/io5";
import { PrimaryText } from "../../../../../component";
import { AppIcons } from "../../../../../utils/appImages";
import { PATH } from "../../../../../utils/routes/Paths";
import { useNavigate } from "react-router-dom";

const ServiceCards = () => {
  const services = [
    {
      id: 1,
      title: "Chat",
      icon: AppIcons.Chat,
      path: PATH.privateRoutes.TALK_TO_ASTROLOGER.path,
    },
    // {
    //   id: 2,
    //   title: "Call",
    //   icon: AppIcons.Call,
    //   path: PATH.privateRoutes.TALK_TO_ASTROLOGER.path,
    // },
    {
      id: 3,
      title: "Horoscope",
      icon: AppIcons.Astrology,
      path: PATH.privateRoutes.HOROSCOPE.DAILY.path,
    },
    {
      id: 4,
      title: "Kundali",
      icon: AppIcons.Kundali,
      path: PATH.privateRoutes.KUNDLI.path,
    },
  ];
  const navigate = useNavigate();
  return (
    <div className={styles.cardsGrid}>
      {services.map((service) => (
        <motion.div
          key={service.id}
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
          className={styles.card}
        >
          <div
            className={styles.cardContent}
            onClick={() => navigate(service.path)}
          >
            <div
              style={{
                flexDirection: "row",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <img
                src={service.icon}
                alt={service.title}
                className={styles.icon}
              />

              <PrimaryText className={styles.title}>
                {service.title}
              </PrimaryText>
            </div>

            <IoArrowForwardOutline />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default ServiceCards;
