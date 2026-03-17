
import { useNavigate, useLocation } from "react-router-dom";
import styles from "../Home.module.scss";
import { navItems } from "../../../../utils/menuList";

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 🔹 Single navigation handler
  const handleNavigation = (item) => {
    if (item.isProtected) {
      const token = localStorage.getItem("shubhtalk_customer_token");
      if (!token) {
        navigate("/login?skip=welcome");
        return;
      }
    }
    navigate(item.path);
  };

  // 🔹 Check active route
  const isActive = (path) => location.pathname === path;

  return (
    <nav className={styles.bottomNav}>
      {navItems.map((item, index) => {
        const Icon = item.icon;
        const active = isActive(item.path);

        return (
          <button
            key={index}
            className={`${
              item.isSpecial ? styles.liveItem : styles.navItem
            } ${active ? styles.active : ""}`}
            onClick={() => handleNavigation(item)}
          >
            {/* Special Live Button */}
            {item.isSpecial ? (
              <div className={styles.liveBtn}>
                <Icon size={22} strokeWidth={2.5} />
              </div>
            ) : (
              <div className={styles.iconCircle}>
                <Icon size={22} />
              </div>
            )}

            <span className={styles.label}>{item.label}</span>

            {/* Active Indicator (not for Live) */}
            {!item.isSpecial && active && (
              <span className={styles.activeLine} />
            )}
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNavigation;