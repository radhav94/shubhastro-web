import { memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { sortContentByOrder } from "../sectionRendererV2";
import SectionTitle from "./shared/SectionTitle";
import defaultSquareImg from "../../../../assets/images/default_image_square_500x500.png";

const AstrologersByCategorySection = memo(({ sectionData, styles }) => {
  const navigate = useNavigate();
  const categories = sortContentByOrder(sectionData?.content || []);

  const handleCategoryClick = useCallback((slug) => {
    navigate("/astrologers", { state: { selectedType: slug } });
  }, [navigate]);

  if (!categories.length) return null;

  return (
    <div className={styles.categoryBox}>
      <SectionTitle
        title={sectionData?.display_title || sectionData?.title || "EXPLORE BY CATEGORY"}
        styles={styles}
      />
      <div className={styles.catGrid}>
        {categories.map((c) => (
          <div
            key={c.ID || c.slug || c.title}
            className={styles.catItem}
            onClick={() => handleCategoryClick(c.slug)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && handleCategoryClick(c.slug)}
          >
            <div
              className={styles.catIconBox}
              style={{
                background: `url(${c.image_url || defaultSquareImg}) center/100% no-repeat`,
              }}
            />
            <span>{c.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

AstrologersByCategorySection.displayName = "AstrologersByCategorySection";

export default AstrologersByCategorySection;
