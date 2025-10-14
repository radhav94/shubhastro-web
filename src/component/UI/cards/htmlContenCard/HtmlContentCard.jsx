import React from "react";
import { motion } from "framer-motion";
import styles from "./HtmlContentCard.module.scss";
import PrimaryText from "../../../PrimaryText";

// Animation variants for the container and its children
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // Each child will animate 0.1s after the previous one
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

const HtmlContentCard = ({ sections = [] }) => {
  const renderSection = (section, index) => {
    switch (section.type) {
      case "heading":
        const HeadingTag = `h${section.level || 3}`;
        return (
          <motion.div key={index} variants={itemVariants}>
            <PrimaryText
              as={HeadingTag}
              isBold
              size_24
              className={styles.heading}
            >
              {section.content}
            </PrimaryText>
          </motion.div>
        );
      case "paragraph":
        return (
          <motion.div key={index} variants={itemVariants}>
            <PrimaryText
              size_16
              className={styles.paragraph}
              dangerouslySetInnerHTML={{ __html: section.content }}
            />
          </motion.div>
        );
      case "list":
        return (
          <motion.ul key={index} className={styles.list}>
            {section.items.map((item, itemIndex) => (
              <motion.li key={itemIndex} variants={itemVariants}>
                <PrimaryText
                  size_16
                  dangerouslySetInnerHTML={{ __html: item }}
                />
              </motion.li>
            ))}
          </motion.ul>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      className={styles.contentCard}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {sections.map(renderSection)}
    </motion.div>
  );
};

export default HtmlContentCard;
