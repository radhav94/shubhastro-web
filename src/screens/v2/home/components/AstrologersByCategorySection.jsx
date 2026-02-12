import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import SectionHeader from "./SectionHeader";
import styles from "../Home.module.scss";
import { PATH } from "../../../../utils/routes/Paths";
import { DefaultImages } from "../../../../utils/appImages";

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
            key={category.ID || category._id || index}
            className={styles.lifeAreaCard}
            style={{
              background: category.secondary_colour || getCategoryColor(index)
            }}
            onClick={() => handleCategoryClick(category)}
          >
            <h3 className={styles.lifeAreaTitle}>{category.title}</h3>

            {category.image_url && (
              <img
                src={category.image_url || DefaultImages.MarriageDefault}
                alt={category.title}
                className={styles.lifeAreaIconImg}
              />
            )}
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

// Helper function to get category colors (fallback)
const getCategoryColor = (index) => {
  const colors = [
    "#FCE4EC",
    "#E3F2FD",
    "#E8F5E9",
    "#FCE4EC",
    "#E3F2FD",
    "#E8F5E9",
    "#FCE4EC",
    "#E3F2FD",
    "#E8F5E9",
  ];
  return colors[index % colors.length];
};

export default AstrologersByCategorySection;
