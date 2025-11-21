import React, { useRef } from "react";
import { motion } from "framer-motion";
import styles from "./ServiceCards.module.scss";

import { IoArrowForwardOutline } from "react-icons/io5";
import { PrimaryText } from "../../../../../component";
import { AppIcons } from "../../../../../utils/appImages";
import { PATH } from "../../../../../utils/routes/Paths";
import { useNavigate } from "react-router-dom";

const ServiceCards = ({ data }) => {
  const sections = data;

  // 🟦 Find banner section
  const bannerSection = sections?.find(
    (item) => item.display_type === "complementary-services"
  );

  // 🟩 Banner content (title, desc, icon)
  const services = bannerSection?.content;
  const numerology = { _id: 4, title: "Numerology", slug: "numerology" };
  const tarot = { _id: 4, title: "Tarot", slug: "tarot" };

  const newServices = [...services, numerology,tarot];

  const navigate = useNavigate();

  const scrollLeft = () => {
    scrollRef.current.scrollBy({ left: -300, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
  };
  const scrollRef = useRef(null);

  const slugRoutes = {
    "free-kundli": PATH.privateRoutes.KUNDLI.path,
    "kundli-matching": "/matchmaking",
    "numerology":PATH.privateRoutes.NUMEROLOGY.path,
    "tarot":PATH.privateRoutes.TAROT.path
  };


  return (
    <div className={styles.cardsGrid}>
      {newServices.map((service) => (
        <motion.div
          key={service._id}
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
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
                src={AppIcons.Chat} /// need to change this in future with the image icon from backend
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
