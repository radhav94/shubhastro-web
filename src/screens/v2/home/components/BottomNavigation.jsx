import { Home, Compass, Radio, UserRound, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import styles from "../Home.module.scss";

const BottomNavigation = () => {
    const navigate = useNavigate();

    const handleLiveClick = () => {
        navigate("/live-landing");
    };

    const handleExploreClick = () => {
        navigate("/explore");
    };

    const handleShopClick = () => {
        navigate("/shop");
    };

    const handleProfileClick = () => {
    const token = localStorage.getItem("shubhtalk_customer_token");
    token ? navigate("/profile") : navigate("/login?skip=welcome");
  };

    return (
        <nav className={styles.bottomNav}>
            <button className={`${styles.navItem} ${styles.active}`}>
                <div className={styles.iconCircle}>
                    <Home size={22} />
                </div>
                <span className={styles.label}>Home</span>
                <span className={styles.activeLine} />
            </button>

            <button className={styles.navItem} onClick={handleExploreClick}>
                <div className={styles.iconCircle}>
                    <Compass size={22} />
                </div>
                <span className={styles.label}>Explore</span>
            </button>

            <button className={styles.liveItem} onClick={handleLiveClick}>
                <div className={styles.liveBtn}>
                    <Radio size={28} strokeWidth={2.5} />
                </div>
                <span className={styles.label}>Live</span>
            </button>

            <button className={styles.navItem} onClick={handleShopClick}>
                <div className={styles.iconCircle}>
                    <Store size={22} />
                </div>
                <span className={styles.label}>Shop</span>
            </button>

            <button className={styles.navItem} onClick={handleProfileClick}>
                <div className={styles.iconCircle}>
                    <UserRound size={22} />
                </div>
                <span className={styles.label}>Profile</span>
            </button>
        </nav>
    );
};

export default BottomNavigation;
