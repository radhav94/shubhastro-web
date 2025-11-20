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

  
  const navigate = useNavigate();

   const scrollLeft = () => {
    scrollRef.current.scrollBy({ left: -300, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
  };
    const scrollRef = useRef(null);
  
  return (
    <div className={styles.cardsGrid}>
      {services.map((service) => (
        <motion.div
          key={service._id}
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
          className={styles.card}
        >
          <div
            className={styles.cardContent}
            onClick={() => {
              if (service.slug === "free-kundli") {
                navigate(PATH.privateRoutes.KUNDLI.path);
              } 
              else if (service.slug==="kundli-matching")
              {
                navigate(`/matchmaking`);
              }
              else {
                navigate(`/horoscopes/${service.slug}`);
              }
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
