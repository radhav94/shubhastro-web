import { Home, Compass, Radio, UserRound, Store } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "../Home.module.scss";

const BottomNavigation = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleHomeClick = () => {
        navigate("/");
    };

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

    // Check active route
    const isHome = location.pathname === "/";
    const isExplore = location.pathname === "/explore";
    const isLive = location.pathname === "/live-landing";
    const isShop = location.pathname === "/shop";
    const isProfile = location.pathname === "/profile";

    return (
        <nav className={styles.bottomNav}>
            <button 
                className={`${styles.navItem} ${isHome ? styles.active : ''}`}
                onClick={handleHomeClick}
            >
                <div className={styles.iconCircle}>
                    <Home size={22} />
                </div>
                <span className={styles.label}>Home</span>
                {isHome && <span className={styles.activeLine} />}
            </button>

            <button 
                className={`${styles.navItem} ${isExplore ? styles.active : ''}`}
                onClick={handleExploreClick}
            >
                <div className={styles.iconCircle}>
                    <Compass size={22} />
                </div>
                <span className={styles.label}>Explore</span>
                {isExplore && <span className={styles.activeLine} />}
            </button>

            <button 
                className={`${styles.liveItem} ${isLive ? styles.active : ''}`}
                onClick={handleLiveClick}
            >
                <div className={styles.liveBtn}>
                    <Radio size={22} strokeWidth={2.5} />
                </div>
                <span className={styles.label}>Live</span>
            </button>

            <button 
                className={`${styles.navItem} ${isShop ? styles.active : ''}`}
                onClick={handleShopClick}
            >
                <div className={styles.iconCircle}>
                    <Store size={22} />
                </div>
                <span className={styles.label}>Shop</span>
                {isShop && <span className={styles.activeLine} />}
            </button>

            <button 
                className={`${styles.navItem} ${isProfile ? styles.active : ''}`}
                onClick={handleProfileClick}
            >
                <div className={styles.iconCircle}>
                    <UserRound size={22} />
                </div>
                <span className={styles.label}>Profile</span>
                {isProfile && <span className={styles.activeLine} />}
            </button>
        </nav>
    );
};

export default BottomNavigation;
