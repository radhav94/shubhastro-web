import { useNavigate } from "react-router-dom";
import { PATH } from "../../../../utils/routes/Paths";
import quickActionOne from "../../../../assets/images/quick-action-1.svg";
import quickActionTwo from "../../../../assets/images/quick-action-2.svg";
import quickActionThree from "../../../../assets/images/quick-action-3.svg";
import styles from "../Home.module.scss";

const QuickActions = ({ data = [], title }) => {
    const navigate = useNavigate();

    // Map API data to quick actions format
    const quickActions = data.length > 0 ? data.map((item, index) => {
        // Determine path based on slug
        let path = PATH.privateRoutes.Chat_With_ASTROLOGER.path;
        if (item.slug === "talk-to-astrologer") {
            path = PATH.privateRoutes.Chat_With_ASTROLOGER.path;
        } else if (item.slug === "daily-horoscope") {
            path = "/horoscopes/daily-horoscope";
        } else if (item.slug === "free-kundli") {
            path = "/kundli";
        } else if (item.redirect_url) {
            path = item.redirect_url;
        }

        return {
            id: item._id || item.ID || index,
            title: item.title,
            image: item.image_url || item.icon || quickActionOne,
            path: path,
        };
    }) : [
        {
            id: 1,
            title: "Chat with Astrologer",
            image: quickActionOne,
            path: PATH.privateRoutes.Chat_With_ASTROLOGER.path,
        },
        {
            id: 2,
            title: "Talk to Astrologer",
            image: quickActionOne,
            path: PATH.privateRoutes.Chat_With_ASTROLOGER.path,
        },
        {
            id: 3,
            title: "Astromall Shop",
            image: quickActionTwo,
            path: PATH.privateRoutes.SHOP.path,
        },
        {
            id: 4,
            title: "Book A Pooja",
            image: quickActionThree,
            path: "shop/vip-e-pooja",
        },
    ];

    return (
        <section className={styles.quickActions}>
            {quickActions.map((action) => (
                <div
                    key={action.id}
                    className={styles.actionCard}
                    onClick={() => navigate(action.path)}
                    style={{ cursor: "pointer" }}
                >
                    <h3 className={styles.actionTitle}>{action.title}</h3>

                    <div className={styles.actionMedia}>
                        <div className={styles.actionCircle} />
                        <img
                            src={action.image}
                            alt={action.title}
                            className={styles.actionImg}
                        />
                    </div>
                </div>
            ))}
        </section>
    );
};

export default QuickActions;
