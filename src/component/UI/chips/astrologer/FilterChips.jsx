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
  const loadingMoreRef = useRef(false); // ✅ track loading state in scroll
  const pageRef = useRef(page); // ✅ track current page in scroll

  const [activeModalTab, setActiveModalTab] = useState("Skill");

  const openFilterModal = () => {
    setFilterModalOpen(true);
    setActiveModalTab("Skill");
  };

  const filterButtons = [
    { name: "All", icon: "📋" },
    { name: "Online", icon: "🟢" },
    { name: "Tarot", icon: "🔮" },
    { name: "Palmistry", icon: "🔮" },
    { name: "Numerology", icon: "🔢" },
    { name: "Face Reading", icon: "🔢" },
    { name: "Vedic Astrology", icon: "🧘" },
    { name: "Love", icon: "🧘" },
    { name: "Education", icon: "🧘" },
    { name: "Career", icon: "🧘" },
    { name: "Marriage", icon: "🧘" },
    { name: "Health", icon: "🧘" },
    { name: "Wealth", icon: "🧘" },
    { name: "Legal", icon: "🧘" },
    { name: "Finance", icon: "🔮" },
    { name: "Remedies", icon: "🔮" },
    { name: "Parents", icon: "🔮" },
    { name: "Palm reader", icon: "✋" },
    { name: "Tantra-magic", icon: "✨" },
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
  // SCROLL HANDLER
  // -------------------------
  useEffect(() => {
    const handleScroll = () => {
      if (loadingMoreRef.current || isLoading || !hasMore) return;

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
    if (!hasMore || loadingMoreRef.current) return;

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
      pageRef.current = pageNo; // ✅ update ref for scroll
      setHasMore(response?.data?.length >= 9);
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
    if (active !== "All") return; // user already clicked filter
    if (!isOnlineFromURL) return;

    setActive("Online");
    setPage(1);
    pageRef.current = 1;
    setHasMore(true);
    setEexperties("Online");
    setSelectedSkills([]);
    setSelectedGender("");
    setSelectedSort("");

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
    // Set active chip
    setActive(item);
    setPage(1);
    pageRef.current = 1;
    setHasMore(true);
  
    // Reset filters
    setEexperties("");
    setSelectedSkills([]);
    setSelectedGender("");
    setSelectedSort("");
  
    if (item === "All") {
      // Only trigger onSelect callback, do NOT send isActive
      onSelect?.(null);
  
      // Call API with minimal params for "All"
      applyFilters({
        pageNo: 1,
        experties: null,
        ignoreSearch: true,
        append: false,
      });
  
      return; // Stop here to prevent other triggers
    }
  
    // For other chips, set experties and call API
    setEexperties(item);
  
    applyFilters({
      pageNo: 1,
      experties: item,
      ignoreSearch: true,
      append: false,
      ...(item === "Online" ? { isActive: true } : {}), // Only send isActive for Online
    });
  };
  
  

  // -------------------------
  // RENDER
  // -------------------------
  return (
    <>
      {/* SEARCH + FILTER BUTTONS */}
      <div className={styles.filterWrapper}>
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
          Filter
        </button>

        {filterButtons.map((btn) => (
          <div
            key={btn.name}
            className={`${styles.chip} ${active === btn.name ? styles.activeChip : ""}`}
            onClick={() => handleClick(btn.name)}
          >
            <span className={styles.chipIcon}>{btn.icon}</span>
            <span>{btn.name}</span>
          </div>
        ))}
      </div>

      {/* FILTER MODAL */}
      {filterModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalSlide}>
            <div className={styles.modalHeader}>
              <span>Filters</span>
              <button onClick={() => setFilterModalOpen(false)}>✕</button>
            </div>

            <div className={styles.modalBody}>
              {/* LEFT SIDEBAR */}
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

              {/* RIGHT CONTENT */}
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
