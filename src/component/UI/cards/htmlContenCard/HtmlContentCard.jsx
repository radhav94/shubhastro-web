import React from "react";
import { motion } from "framer-motion";
import styles from "./HtmlContentCard.module.scss";
import PrimaryText from "../../../PrimaryText";
import TTSButton from "../../TTSButton";

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
  // Build plain text from all sections for TTS
  const ttsText = sections.map((s) => {
    if (s.type === 'heading') return s.content;
    if (s.type === 'paragraph') return s.content?.replace(/<[^>]*>/g, '') || '';
    if (s.type === 'list') return s.items?.map((i) => i.replace(/<[^>]*>/g, '')).join('. ') || '';
    return '';
  }).filter(Boolean).join('. ');

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
      {ttsText && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4px' }}>
          <TTSButton text={ttsText} />
        </div>
      )}
      {sections.map(renderSection)}
    </motion.div>
  );
};

export default HtmlContentCard;
