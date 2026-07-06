import { Share2 } from "lucide-react";
import toast from "react-hot-toast";
import styles from "./KundliHeader.module.scss";
import { trackEvent } from "../../../../utils/analytics";

const KundliHeader = () => {
    const handleShare = async () => {
        const url = window.location.href;
        let shareChannel = "copy_link";
        try {
            if (navigator.share) {
                await navigator.share({
                    title: "My Kundli - ShubhAstro",
                    text: "Check out my Kundli on ShubhAstro",
                    url,
                });
                shareChannel = "native";
            } else if (navigator.clipboard) {
                await navigator.clipboard.writeText(url);
                toast.success("Link copied to clipboard");
            }
        } catch {
            // User cancelled the share sheet — don't record a share.
            return;
        }
        trackEvent("kundli_shared", { share_channel: shareChannel });
    };

    return (
        <div className={styles.headerSection}>
            <div className={styles.headerTop}>
                <div>
                    <h1 className={styles.headerTitle}>Free Kundli Online</h1>
                    <p className={styles.headerSubtitle}>
                        A Kundli, or birth chart, is an astrological map of your life's journey.
                    </p>
                </div>
                <button
                    type="button"
                    className={styles.shareBtn}
                    onClick={handleShare}
                    aria-label="Share Kundli"
                >
                    <Share2 size={18} />
                    <span>Share</span>
                </button>
            </div>
        </div>
    );
};

export default KundliHeader;
