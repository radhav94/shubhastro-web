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

const slugify = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/*
 * Resolve a card's destination, or null when it has none.
 *
 * This used to be `to={SLUG_PATHS[card.slug] || `/${card.slug}` || "/"}`. A
 * template literal is always truthy, so the `"/"` arm was unreachable and the
 * expression could only ever produce a path built from whatever `card.slug`
 * held:
 *
 *   slug missing        -> "/undefined"       (CMS not-found page)
 *   slug ""             -> "/"                (the homepage)
 *   slug " Free-Kundli" -> "/ Free-Kundli"    (a path containing spaces)
 *
 * The empty-string case is the dangerous one. This section renders ON the
 * homepage, so such a card linked to the page already on screen: the click
 * navigated nowhere visible and nothing happened, which is a dead click on the
 * biggest CTA in the section.
 *
 * The map is keyed on both the API slugs and the title-derived forms
 * ("generate-my-kundli", "talk-to-an-astrologer", "explore-horoscope"), so when
 * the slug is unusable we can still recover a destination from the visible
 * title. A title is only ever looked up in the map — never turned into a bare
 * `/${title}` path — since a display string is not a route.
 */
const resolveCardPath = (card) => {
  const slug = slugify(card?.slug);
  if (slug) return SLUG_PATHS[slug] || `/${slug}`;
  const fromTitle = slugify(card?.title);
  return (fromTitle && SLUG_PATHS[fromTitle]) || null;
};

const ComplementaryServicesSection = memo(({ sectionData, styles }) => {
  const content = sortContentByOrder(sectionData?.content || []);

  // A card that cannot resolve a destination is dropped rather than rendered as
  // a link to nowhere — an absent card beats one that eats the tap.
  const cards = content
    .map((card) => ({ card, to: resolveCardPath(card) }))
    .filter(({ to }) => !!to);

  if (!cards.length) return null;

  return (
    <>
      {cards.map(({ card, to }) => (
        <Link
          key={card.ID || card.slug || card.title}
          className={styles.qCard}
          to={to}
        >
          <div className={styles.qText}>
            <h3>{card.title}</h3>
            <p>{card.description}</p>
          </div>
          {/* <div className={styles.qImgWrap}> */}
            {/* <div className={styles.qImgGlow} /> */}
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
            <img className={styles.qImgWrap}
              src={card.image_url || card.icon || defaultSquareImg}
              alt=""
              loading="eager"
              fetchPriority="high"
            />
          {/* </div> */}
        </Link>
      ))}
    </>
  );
});

ComplementaryServicesSection.displayName = "ComplementaryServicesSection";

export default ComplementaryServicesSection;
