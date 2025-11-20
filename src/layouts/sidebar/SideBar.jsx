import React, { useState } from "react";
import styles from "./SideBar.module.scss";
import { useNavigate } from "react-router-dom";
import { FiX, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { MENU_LIST } from "../../utils/menulist";

const SideBar = ({ open, onClose }) => {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState(null); // for accordion

  const handleClick = (path) => {
    navigate(path);
    onClose();
  };

  const toggleDropdown = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <>
      <div
        className={`${styles.overlay} ${open ? styles.show : ""}`}
        onClick={onClose}
      ></div>

      <div className={`${styles.sidebar} ${open ? styles.open : ""}`}>
        <div className={styles.header}>
          <FiX className={styles.closeIcon} onClick={onClose} />
          <span className={styles.title}>Menu</span>
        </div>

        <ul className={styles.menuList}>
          {MENU_LIST.map((item, i) => (
            <li key={i} className={styles.menuItem}>
              {!item.children ? (
                <span
                  className={styles.menuLink}
                  onClick={() => handleClick(item.path)}
                >
                  {item.title}
                </span>
              ) : (
                <>
                  <div
                    className={styles.parentRow}
                    onClick={() => toggleDropdown(i)}
                  >
                    <span>{item.title}</span>
                    {openIndex === i ? (
                      <FiChevronUp className={styles.chevron} />
                    ) : (
                      <FiChevronDown className={styles.chevron} />
                    )}
                  </div>

                  {/* Accordion Submenu */}
                  <ul
                    className={`${styles.submenu} ${
                      openIndex === i ? styles.submenuOpen : ""
                    }`}
                  >
                    {item.children.map((child, idx) => (
                      <li
                        key={idx}
                        className={styles.submenuItem}
                        onClick={() => handleClick(child.path)}
                      >
                        {child.title}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default SideBar;
