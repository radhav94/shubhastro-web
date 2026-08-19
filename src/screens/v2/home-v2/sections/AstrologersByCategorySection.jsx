import { memo } from "react";
import { Link } from "react-router-dom";
import { sortContentByOrder } from "../sectionRendererV2";
import SectionTitle from "./shared/SectionTitle";
import defaultSquareImg from "../../../../assets/images/default_image_square_500x500.png";

/*
 * Destination for a category tile.
 *
 * This used to be `navigate("/astrologers", { state: { selectedType: slug } })`.
 * TalkToAstrologer resolves the active filter from three places —
 * `location.state.selectedType`, `?category=`, then the `/astrologers/:category`
 * path param — and navigation state is the only one of those that does not
 * survive a reload. So a visitor who landed on the filtered list and refreshed
 * silently lost the filter and got the unfiltered list back, with no indication
 * why. The URL form fixes that, and also makes the filtered view shareable and
 * linkable.
 *
 * The path form is used rather than `?category=` because TalkToAstrologer's
 * `astrologer_list_viewed` event derives `filter_applied` from the path param
 * only, so `?category=` would report every category landing as unfiltered.
 *
 * CMS slugs for this section are already the ones the route expects
 * (love-relationships, career-business, marriage-relationships,
 * health-wellness, money-finance, child-guidance).
 */
const categoryPath = (slug) =>
  slug ? `/astrologers/${encodeURIComponent(slug)}` : "/astrologers";

const AstrologersByCategorySection = memo(({ sectionData, styles }) => {
  const categories = sortContentByOrder(sectionData?.content || []);

  if (!categories.length) return null;

  return (
    <div className={styles.categoryBox}>
      <SectionTitle
        title={sectionData?.display_title || sectionData?.title || "EXPLORE BY CATEGORY"}
        styles={styles}
      />
      <div className={styles.catGrid}>
        {/*
          A real <Link>, not a div with role="button". Beyond matching the house
          pattern, it restores what a link gives for free: long-press and
          open-in-new-tab on mobile, middle click, native Enter handling, and a
          crawlable internal link to each category page.
        */}
        {categories.map((c) => (
          <Link
            key={c.ID || c.slug || c.title}
            to={categoryPath(c.slug)}
            className={styles.catItem}
          >
            <div
              className={styles.catIconBox}
              style={{
                background: `url(${c.image_url || defaultSquareImg}) center/100% no-repeat`,
              }}
            />
            <span>{c.title}</span>
          </Link>
        ))}
      </div>
    </div>
  );
});

AstrologersByCategorySection.displayName = "AstrologersByCategorySection";

export default AstrologersByCategorySection;
