import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import SectionHeader from "./SectionHeader";
import styles from "../Home.module.scss";
import { PATH } from "../../../../utils/routes/Paths";

const AstrologersByCategorySection = ({ data, title, showMore }) => {
  const navigate = useNavigate();

  if (!data || data.length === 0) return null;

  const handleCategoryClick = (category) => {
    // Navigate to astrologers filtered by category
    navigate(PATH.privateRoutes.Chat_With_ASTROLOGER.path, {
      state: { selectedType: category.title.split(" ")[0] || "All" },
    });
  };

  return (
    <section className={styles.lifeAreaSection}>
      <SectionHeader title={title || "EXPLORE ASTROLOGERS BY CATEGORY"} />

      <div className={styles.lifeAreaGrid}>
        {data.map((category, index) => (
          <div
            key={category._id || index}
            className={styles.lifeAreaCard}
            style={{ background: getCategoryColor(index) }}
            onClick={() => handleCategoryClick(category)}
          >
            <h3 className={styles.lifeAreaTitle}>{category.title}</h3>
          </div>
        ))}
      </div>

      {/* {showMore && (
        <button
          className={styles.viewAllLink}
          onClick={() => navigate("/astrologers")}
        >
          View All <ChevronRight size={20} />
        </button>
      )} */}
    </section>
  );
};

// Helper function to get category colors
const getCategoryColor = (index) => {
  const colors = [
    "linear-gradient(135deg, #FFE4BA 0%, #FFD89B 100%)",
    "linear-gradient(135deg, #FFE4E1 0%, #FFC0CB 100%)",
    "linear-gradient(135deg, #E0F7FA 0%, #B2EBF2 100%)",
    "linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%)",
    "linear-gradient(135deg, #FFF9C4 0%, #FFF59D 100%)",
    "linear-gradient(135deg, #FFCCBC 0%, #FFAB91 100%)",
    "linear-gradient(135deg, #C8E6C9 0%, #A5D6A7 100%)",
    "linear-gradient(135deg, #BBDEFB 0%, #90CAF9 100%)",
    "linear-gradient(135deg, #F8BBD0 0%, #F48FB1 100%)",
  ];
  return colors[index % colors.length];
};

export default AstrologersByCategorySection;
