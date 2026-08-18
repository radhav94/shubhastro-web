import { useNavigate } from "react-router-dom";
import { IoClose } from "react-icons/io5";
import { getAstrologerDefaultImage, getAstrologerImageUrl } from "../../../../../utils/appImages";
import { getAstrologerDisplayName } from "../../../../../utils/helper/string.utils";
import { useGetAstrologerByIdQuery } from "../../../../../redux/api/astrologer/astrologerApi";
import "./styles/liveListModal.scss";

// Avatar for one live astrologer. .llm-avatar is 64px, so the `small` 100x125
// derivative rather than the unresized original (896x902 and 1433x1433 have both
// been observed).
//
// The `users/live-users` response nests an astrologer object but its projection
// omits `profileImages`, and the derivative filenames are not derivable from the
// original (only the first path segment is shared; the second is random per
// size), so the variant has to be fetched. Cost is contained: LiveListModal
// early-returns on `!show`, so nothing here mounts until the user opens the
// sheet, RTK Query dedupes by astrologer, and the currently-watched host is
// already cached by LiveView's own query.
//
// `flatUrl` paints immediately so there is no blank circle while the query is in
// flight, and it keeps the previous precedence exactly: profileImgUrl only when
// it looks like a real URL, then the live entry's astrologerProfileIcon.
const LiveAstroAvatar = ({ astro, flatUrl, name, defaultImg }) => {
  const { data } = useGetAstrologerByIdQuery(
    { id: astro?._id },
    { skip: !astro?._id }
  );

  const src = getAstrologerImageUrl(
    {
      profileImages: data?.data?.profileImages || astro?.profileImages,
      profileImgUrl: data?.data?.profileImgUrl || flatUrl,
      gender: data?.data?.gender || astro?.gender || "male",
    },
    "small"
  );

  return (
    <img
      src={src}
      alt={name}
      className="llm-avatar"
      width={64}
      height={64}
      loading="lazy"
      decoding="async"
      onError={(e) => { e.currentTarget.src = defaultImg; }}
    />
  );
};

// Convert slug to readable title: "face-reading" → "Face Reading"
const slugToTitle = (slug) => {
  if (!slug) return "Other";
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
};

const LiveListModal = ({ show, onClose, lives = [] }) => {
  const navigate = useNavigate();

  if (!show) return null;

  // Step 1: Collect all unique slugs and their titles from all astrologers
  const slugMap = new Map(); // slug -> title
  lives.forEach((live) => {
    const expertise = live.astrologer?.expertise || [];
    expertise.forEach((exp) => {
      const slug = exp.slug || exp.title?.toLowerCase().replace(/\s+/g, "-") || null;
      if (slug && !slugMap.has(slug)) {
        slugMap.set(slug, exp.title || slugToTitle(slug));
      }
    });
  });

  // Astrologers with no expertise go under "Other"
  const hasNoExpertise = lives.some((l) => !l.astrologer?.expertise?.length);
  if (hasNoExpertise) slugMap.set("other", "Other");

  // Step 2: For each slug, find all astrologers that have that slug
  const grouped = {};
  slugMap.forEach((title, slug) => {
    grouped[title] = lives.filter((live) => {
      if (slug === "other") return !live.astrologer?.expertise?.length;
      return live.astrologer?.expertise?.some(
        (exp) => (exp.slug || exp.title?.toLowerCase().replace(/\s+/g, "-")) === slug
      );
    });
  });

  const handleSelect = (channel) => {
    onClose();
    navigate(`/live/${channel}`);
  };

  return (
    <div className="llm-overlay" onClick={onClose} onWheel={(e) => e.stopPropagation()}>
      <div className="llm-sheet" onClick={(e) => e.stopPropagation()} onWheel={(e) => e.stopPropagation()}>
        <div className="llm-header">
          <h3>Other Live Astrologers</h3>
          <button className="llm-close" onClick={onClose}><IoClose size={22} /></button>
        </div>
        <div className="llm-body">
          {lives.length === 0 ? (
            <p className="llm-empty">No other astrologers are live right now</p>
          ) : (
            Object.entries(grouped).map(([category, items]) => (
              <div key={category} className="llm-category">
                <div className="llm-title-wrap">
                  <h4 className="llm-category-title">{category.toUpperCase()}</h4>
                  <div className="llm-divider">
                    <div className="llm-divider-line" />
                    <span className="llm-divider-moon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="4" height="5" viewBox="0 0 4 5" fill="none">
                        <path d="M3.39392 4.18679C3.03602 4.50885 2.58016 4.7032 2.08582 4.7032C0.934798 4.7032 0 3.64991 0 2.35021C0 1.05329 0.934798 0 2.08582 0C2.18869 0 2.2891 0.00867403 2.38704 0.0232501C1.91056 0.452549 1.60687 1.11403 1.60687 1.85706C1.60687 3.04084 2.38458 4.02125 3.39392 4.18679Z" fill="rgba(255,255,255,0.6)" />
                      </svg>
                    </span>
                    <div className="llm-divider-line" />
                  </div>
                </div>
                <div className="llm-scroll-row">
                  {items.map((live) => {
                    const astro = live.astrologer || {};
                    const name = getAstrologerDisplayName(astro) || "Astrologer";
                    const defaultImg = getAstrologerDefaultImage(astro.gender || "male");
                    const flatUrl =
                      astro.profileImgUrl && astro.profileImgUrl.length > 5
                        ? astro.profileImgUrl
                        : live.astrologerProfileIcon;
                    return (
                      <div key={live.channel} className={`llm-card ${live.isOnPrivateCall ? "llm-busy" : ""}`} onClick={() => handleSelect(live.channel)}>
                        <div className="llm-avatar-wrap">
                          <LiveAstroAvatar astro={astro} flatUrl={flatUrl} name={name} defaultImg={defaultImg} />
                          {live.isOnPrivateCall && <span className="llm-busy-dot" />}
                        </div>
                        <span className="llm-name">{name.split(" ")[0]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveListModal;
