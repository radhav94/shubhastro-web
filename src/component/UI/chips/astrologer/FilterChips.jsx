import { useState, useEffect, useRef } from "react";
import styles from "./FilterChips.module.scss";
import { useLazyFilterAstrologersQuery } from "../../../../redux/api/astrologer/astrologerApi";
import { FaCheck } from "react-icons/fa";

const FilterChips = ({ onSelect, onApplyFilters, isActiveType, isOnlineFromURL }) => {
  const [triggerFilter, { isLoading }] = useLazyFilterAstrologersQuery();

  const [active, setActive] = useState("All");
  const [searchText, setSearchText] = useState("");
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [experties, setEexperties] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [selectedSort, setSelectedSort] = useState("");

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loadingMoreRef = useRef(false);
  const pageRef = useRef(1);
  const isFilterActiveRef = useRef(false);

  const [activeModalTab, setActiveModalTab] = useState("Skill");

  const openFilterModal = () => {
    setFilterModalOpen(true);
    setActiveModalTab("Skill");
  };

  const filterButtons = [
    { name: "All" },
    { name: "Online" },
    { name: "Tarot" },
    { name: "Palmistry" },
    { name: "Numerology" },
    { name: "Face Reading" },
    { name: "Vedic Astrology" },
    { name: "Love" },
    { name: "Education" },
    { name: "Career" },
    { name: "Marriage" },
    { name: "Health" },
    { name: "Wealth" },
    { name: "Legal" },
    { name: "Finance" },
    { name: "Remedies" },
    { name: "Parents" },
    { name: "Palm reader" },
    { name: "Tantra-magic" },
  ];

  const skills = [
    "Face Reading",
    "Kp",
    "Life Coach",
    "Nadi",
    "Numerology",
    "Palmistry",
    "Prashana",
    "Psychic",
    "Signature Reading",
    "Tarot",
    "Vastu",
    "Vedic",
  ];

  const genders = ["Male", "Female"];
  const sorting = ["Sort By Price", "Sort By Rating"];

  // -------------------------
  // SCROLL HANDLER - only when filter is active
  // -------------------------
  useEffect(() => {
    const handleScroll = () => {
      if (!isFilterActiveRef.current || loadingMoreRef.current || isLoading || !hasMore) return;

      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const fullHeight = document.documentElement.scrollHeight;

      if (scrollTop + windowHeight >= fullHeight - 200) {
        loadMore();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore, isLoading]);

  const loadMore = () => {
    if (!hasMore || loadingMoreRef.current || !isFilterActiveRef.current) return;

    const nextPage = pageRef.current + 1;
    applyFilters({ pageNo: nextPage, append: true });
  };

  // -------------------------
  // APPLY FILTERS
  // -------------------------
  const applyFilters = async ({
    ignoreSearch = false,
    searchValue,
    category = "filter",
    experties: expertiesValue,
    pageNo = 1,
    append = false,
    skills,
  } = {}) => {
    const finalSearchText = ignoreSearch ? "" : (searchValue ?? searchText);
    const finalExperties = expertiesValue ?? experties;
    const finalSkills = skills ?? selectedSkills;

    const isOnline = finalExperties === "Online";

    try {
      loadingMoreRef.current = true;
      isFilterActiveRef.current = true;

      const response = await triggerFilter({
        searchText: finalSearchText,
        selectedSkills: finalSkills,
        experties: isOnline ? null : finalExperties,
        selectedSort,
        selectedGender,
        page: pageNo,
        limit: 9,
        ...(isOnline && { isActive: true }),
        isActiveType,
      }).unwrap();

      onApplyFilters?.({
        category,
        search: finalSearchText,
        result: response?.data || [],
        append,
      });

      setPage(pageNo);
      pageRef.current = pageNo;
      setHasMore((response?.data?.result || []).length >= 9);
      setFilterModalOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      loadingMoreRef.current = false;
    }
  };

  // -------------------------
  // URL-based Online default
  // -------------------------
  useEffect(() => {
    if (active !== "All") return;
    if (!isOnlineFromURL) return;

    setActive("Online");
    setPage(1);
    pageRef.current = 1;
    setHasMore(true);
    setEexperties("Online");
    setSelectedSkills([]);
    setSelectedGender("");
    setSelectedSort("");
    isFilterActiveRef.current = true;

    applyFilters({
      pageNo: 1,
      experties: "Online",
      ignoreSearch: true,
      append: false,
    });
  }, [isOnlineFromURL]);

  // -------------------------
  // SEARCH HANDLER
  // -------------------------
  const handleSearchClick = (e) => {
    const value = e.target.value;
    setSearchText(value);

    if (value.length > 2) {
      setActive("search");
      clearAll();
      isFilterActiveRef.current = true;
      applyFilters({ searchValue: value, category: "search", pageNo: 1 });
    } else if (value.length === 0) {
      handleClick("All");
    }
  };

  const applyFiltersClick = () => {
    setActive("filter");
    setPage(1);
    pageRef.current = 1;
    setHasMore(true);
    isFilterActiveRef.current = true;

    applyFilters({
      ignoreSearch: true,
      category: "filter",
      pageNo: 1,
      append: false,
    });
  };

  const toggleValue = (value, setter, state) => setter(state === value ? "" : value);

  const toggleSkill = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const selectAll = () => setSelectedSkills([...skills]);

  const clearAll = () => {
    setSelectedSkills([]);
    setSelectedGender("");
    setSelectedSort("");
  };

  const handleClick = (item) => {
    setActive(item);
    setPage(1);
    pageRef.current = 1;
    setHasMore(true);

    setEexperties("");
    setSelectedSkills([]);
    setSelectedGender("");
    setSelectedSort("");
    setSearchText("");

    if (item === "All") {
      isFilterActiveRef.current = false;
      onSelect?.(null);
      return;
    }

    setEexperties(item);
    isFilterActiveRef.current = true;

    applyFilters({
      pageNo: 1,
      experties: item,
      ignoreSearch: true,
      append: false,
    });
  };

  // -------------------------
  // RENDER
  // -------------------------
  return (
    <>
      <div className={styles.filterWrapper}>
        <div className={styles.inputFilter}>
          <div>
            <i className="fa fa-search" />
            <input
              className={`${styles.chip} ${active === "search" ? styles.activeChip : ""}`}
              type="text"
              placeholder="Search Name"
              value={searchText}
              onInput={handleSearchClick}
            />
          </div>

          <button
            key={"filter"}
            className={`${styles.chip} ${active === "filter" ? styles.activeChip : ""}`}
            onClick={() => setFilterModalOpen(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3.6 1.39999H12.4C13.1333 1.39999 13.7333 1.99999 13.7333 2.73333V4.19999C13.7333 4.73333 13.4 5.39999 13.0667 5.73333L10.2 8.26666C9.8 8.59999 9.53333 9.26666 9.53333 9.79999V12.6667C9.53333 13.0667 9.26666 13.6 8.93333 13.8L8 14.4C7.13333 14.9333 5.93333 14.3333 5.93333 13.2667V9.73333C5.93333 9.26666 5.66666 8.66666 5.4 8.33333L2.86666 5.66666C2.53333 5.33333 2.26666 4.73333 2.26666 4.33333V2.79999C2.26666 1.99999 2.86666 1.39999 3.6 1.39999Z" stroke="white" strokeWidth="1.2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M7.28667 1.39999L4 6.66666" stroke="white" strokeWidth="1.2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
            </svg> Filter
          </button>
        </div>
        <div className={styles.filterTabs}>
          {filterButtons.map((btn) => (
            <div
              key={btn.name}
              className={`${styles.chip} ${active === btn.name ? styles.activeChip : ""}`}
              onClick={() => handleClick(btn.name)}
            >
              <span>{btn.name}</span>
            </div>
          ))}
        </div>
      </div>

      {filterModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalSlide}>
            <div className={styles.modalHeader}>
              <span>Filters</span>
              <button onClick={() => setFilterModalOpen(false)}>✕</button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.leftSidebar}>
                <div
                  className={`${styles.sidebarItem} ${activeModalTab === "Skill" ? styles.activeSidebarItem : ""}`}
                  onClick={() => setActiveModalTab("Skill")}
                >
                  Skill
                </div>
                <div
                  className={`${styles.sidebarItem} ${activeModalTab === "Gender" ? styles.activeSidebarItem : ""}`}
                  onClick={() => setActiveModalTab("Gender")}
                >
                  Gender
                </div>
                <div
                  className={`${styles.sidebarItem} ${activeModalTab === "Sorting" ? styles.activeSidebarItem : ""}`}
                  onClick={() => setActiveModalTab("Sorting")}
                >
                  Sorting
                </div>
              </div>

              <div className={styles.rightContent}>
                {activeModalTab === "Skill" && (
                  <>
                    <div className={styles.contentHeader}>
                      <span onClick={selectAll} className={styles.selectAll}>Select all</span>
                    </div>
                    <div className={styles.optionsList}>
                      {skills.map((skill) => {
                        const isSelected = selectedSkills.includes(skill);
                        return (
                          <div
                            key={skill}
                            className={styles.option}
                            onClick={() => toggleSkill(skill)}
                          >
                            <FaCheck className={isSelected ? styles.checkIcon : styles.checkIconInactive} size={14} />
                            <span className={isSelected ? styles.selectedText : ""}>{skill}</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {activeModalTab === "Gender" && (
                  <div className={styles.optionsList}>
                    {genders.map((g) => {
                      const isSelected = selectedGender === g;
                      return (
                        <div
                          key={g}
                          className={styles.option}
                          onClick={() => toggleValue(g, setSelectedGender, selectedGender)}
                        >
                          <FaCheck className={isSelected ? styles.checkIcon : styles.checkIconInactive} size={14} />
                          <span className={isSelected ? styles.selectedText : ""}>{g}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {activeModalTab === "Sorting" && (
                  <div className={styles.optionsList}>
                    {sorting.map((s) => {
                      const isSelected = selectedSort === s;
                      return (
                        <div
                          key={s}
                          className={styles.option}
                          onClick={() => toggleValue(s, setSelectedSort, selectedSort)}
                        >
                          <FaCheck className={isSelected ? styles.checkIcon : styles.checkIconInactive} size={14} />
                          <span className={isSelected ? styles.selectedText : ""}>{s}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.resetBtn}
                onClick={() => {
                  clearAll();
                  handleClick("All");
                }}
              >
                Reset
              </button>
              <button className={styles.applyBtn} onClick={applyFiltersClick}>
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FilterChips;
