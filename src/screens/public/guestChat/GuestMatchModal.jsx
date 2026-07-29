import { createPortal } from "react-dom";
import { IoClose } from "react-icons/io5";
import { useGetRecommendedAstrologersQuery } from "../../../redux/api/astrologer/astrologerApi";
import NewAstrologerCard from "../../../component/UI/cards/newAstrologerCard/NewAstrologerCard";
import PrimaryLoader from "../../../component/UI/PrimaryLoader";
import styles from "./GuestMatchModal.module.scss";

/**
 * "NOT SURE? LET US MATCH YOU." popup.
 *
 * Shown while the selected astrologer is busy / has a waiting time. Lists
 * recommended astrologers so the guest can switch to one who can chat sooner.
 *
 * @param {boolean} open
 * @param {() => void} onClose
 * @param {string} currentAstrologerId - excluded from the suggestions
 * @param {(astrologer: object) => void} onSelect - chat with a chosen astrologer
 */
const GuestMatchModal = ({ open, onClose, currentAstrologerId, onSelect }) => {
  const { data, isLoading } = useGetRecommendedAstrologersQuery(undefined, { skip: !open });

  if (!open) return null;

  const astrologers = (data?.data || []).filter((a) => a._id !== currentAstrologerId);

  // The card fires onConnect(astrologer, type) — we only switch to chat here.
  const handleConnect = (astrologer, type) => {
    if (type === "chat") onSelect?.(astrologer);
  };

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose} aria-label="Close">
          <IoClose size={20} />
        </button>

        <div className={styles.headingWrap}>
          <h2 className={styles.heading}>
            NOT SURE?
            <br />
            LET US MATCH YOU.
          </h2>
          <p className={styles.subheading}>
            Your astrologer is a little busy. Chat with an available expert now.
          </p>
        </div>

        <div className={styles.body}>
          {isLoading ? (
            <div className={styles.loaderWrap}>
              <PrimaryLoader isLoading fullscreen={false} />
            </div>
          ) : astrologers.length === 0 ? (
            <p className={styles.empty}>No astrologers available right now. Please hold on.</p>
          ) : (
            <div className={styles.row}>
              {astrologers.map((astro) => (
                <div key={astro._id} className={styles.cardCell}>
                  <NewAstrologerCard astrologer={astro} onConnect={handleConnect} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default GuestMatchModal;
