import { memo } from "react";
import { Link } from "react-router-dom";
import { sortContentByOrder } from "../sectionRendererV2";
import defaultSquareImg from "../../../../assets/images/default_image_square_500x500.png"
const SLUG_PATHS = {
  "free-kundli": "/kundli",
  "generate-my-kundli": "/kundli",
  "kundli": "/kundli",
  "talk-to-astrologer": "/astrologers",
  "talk-to-an-astrologer": "/astrologers",
  "astrologers": "/astrologers",
  "daily-horoscope": "/daily-horoscope",
  "explore-horoscope": "/daily-horoscope",
  "explore-daily-horoscope": "/daily-horoscope",
  "horoscope": "/daily-horoscope",
};

const ComplementaryServicesSection = memo(({ sectionData, styles }) => {
  const content = sortContentByOrder(sectionData?.content || []);

  if (!content.length) return null;

  return (
    <>
      {content.map((card) => (
        <Link
          key={card.ID || card.slug || card.title}
          className={styles.qCard}
          to={SLUG_PATHS[card.slug] || `/${card.slug}` || "/"}
        >
          <div className={styles.qText}>
            <h3>{card.title}</h3>
            <p>{card.description}</p>
          </div>
          <div className={styles.qImgWrap}>
            <div className={styles.qImgGlow} />
            {/*
              alt="" on purpose. This artwork illustrates the card; it carries no
              information the text does not. It used to be alt={card.title},
              which is verbatim the <h3> two lines above, so a screen reader
              announced the link as "Generate My Kundli, Generate My Kundli" —
              the title once from the heading and again from the image. An empty
              alt takes the image out of the accessibility tree and leaves the
              link named by its heading and description, which is what a sighted
              user reads too.

              Empty, not missing: `alt` has to be present for the image to be
              treated as decorative. Omitting it entirely makes screen readers
              fall back to announcing the filename, which here is a CMS hash like
              "1777449235120-b5559185-8114-4158-a82a-a01….png".
            */}
            <img
              src={card.image_url || card.icon || defaultSquareImg}
              alt=""
              loading="eager"
              fetchPriority="high"
            />
          </div>
        </Link>
      ))}
    </>
  );
});

ComplementaryServicesSection.displayName = "ComplementaryServicesSection";

export default ComplementaryServicesSection;
