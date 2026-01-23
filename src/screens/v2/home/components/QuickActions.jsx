import { useNavigate } from "react-router-dom";
import { PATH } from "../../../../utils/routes/Paths";
import quickActionOne from "../../../../assets/images/quick-action-1.svg";
import quickActionTwo from "../../../../assets/images/quick-action-2.svg";
import quickActionThree from "../../../../assets/images/quick-action-3.svg";
import styles from "../Home.module.scss";

const QuickActions = () => {
    const navigate = useNavigate();

    const quickActions = [
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
