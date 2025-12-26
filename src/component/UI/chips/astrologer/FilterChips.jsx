import { useState, useEffect } from "react";
import styles from "./FilterChips.module.scss";
import { useLazyFilterAstrologersQuery } from "../../../../redux/api/astrologer/astrologerApi";

const FilterChips = ({ onSelect, onApplyFilters,isActiveType }) => {
  const [triggerFilter, { isLoading }] = useLazyFilterAstrologersQuery();

  const filterButtons = [
    { name: "All", icon: "📋" },
    { name: "Tarot", icon: "🔮" },
    { name: "Palmistry", icon: "🔮" },
    { name: "numerology", icon: "🔢" },
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
    { name: "tantra-magic", icon: "✨" },
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

  const [active, setActive] = useState("All"); // Global active filter/search
  const [searchText, setSearchText] = useState("");
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const [selectedSkills, setSelectedSkills] = useState([]);
  const [experties, setEexperties] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [selectedSort, setSelectedSort] = useState("");

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // ✅ Modal tab state
  const [activeModalTab, setActiveModalTab] = useState("Skill");

  // Open modal with default Skill tab
  const openFilterModal = () => {
    setFilterModalOpen(true);
    setActiveModalTab("Skill");
  };

  const handleClick = (item) => {
    setActive(item);
    setPage(1);
    setHasMore(true);
  
    // 🔹 RESET previous filters
    setEexperties("");          
    setSelectedSkills([]);
    setSelectedGender("");
    setSelectedSort("");
  
    if (item === "All") {
      // ❌ unset speciality completely
      onSelect?.(null);
      return;
    }
  
    // ✅ set new speciality
    setEexperties(item);
    applyFilters({
      pageNo: 1,
      experties: item,
      ignoreSearch: true,
      append: false,
    });
  };
  

  useEffect(() => {
    if (active === "All") return;

    const handleScroll = () => {
      if (loadingMore || isLoading || !hasMore) return;

      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const fullHeight = document.documentElement.scrollHeight;

      if (scrollTop + windowHeight >= fullHeight - 200) {
        applyFilters({ pageNo: page + 1, append: true });
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [active, page, hasMore, loadingMore, isLoading]);

  const handleSearchClick = (e) => {
    const value = e.target.value;
    setSearchText(value);

    if (value.length > 2) {
      setActive("search");
      clearAll();
      applyFilters({ searchValue: value, category: "search" });
    } else if (value.length === 0) {
      handleClick("All");
    }
  };

  const applyFiltersClick = () => {
    setActive("filter");
    setPage(1);
    setHasMore(true);
  
    // ❗ do NOT call onApplyFilters here
    // applyFilters will handle API + append logic
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

  const applyFilters = async ({
    ignoreSearch = false,
    searchValue,
    category = "filter",
    experties: expertiesValue,
    pageNo = 1,
    append = false,
    skills, // ✅ accept skills explicitly
  } = {}) => {
    const finalSearchText = ignoreSearch ? "" : (searchValue ?? searchText);
    const finalExperties = expertiesValue ?? experties;
    const finalSkills = skills ?? selectedSkills; // ✅ ARRAY
  
    try {
      setLoadingMore(true);
  
      const response = await triggerFilter({
        searchText: finalSearchText,
        selectedSkills: finalSkills, // ✅ ARRAY (RTK will join)
        experties: finalExperties,
        selectedSort,
        selectedGender,
        page: pageNo,
        limit: 9,
        isActiveType
      }).unwrap();
  
      onApplyFilters?.({
        category,
        search: finalSearchText,
        result: response?.data || [],
        append,
      });
  
      setPage(pageNo);
      setHasMore(response?.data?.length >= 9);
      setFilterModalOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMore(false);
    }
  };
  

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
          onClick={openFilterModal}
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
              <span>FILTERS</span>
              <button onClick={() => setFilterModalOpen(false)}>✕</button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.leftTabs}>
                {["Skill", "Gender", "Sorting"].map((tab) => (
                  <div
                    key={tab}
                    className={`${styles.tab} ${activeModalTab === tab ? styles.activeTab : ""}`}
                    onClick={() => setActiveModalTab(tab)}
                  >
                    {tab}
                  </div>
                ))}
              </div>

              <div className={styles.rightContent}>
                {activeModalTab === "Skill" && (
                  <div className={styles.topActions}>
                    <span onClick={selectAll}>Select all</span>
                    <span onClick={clearAll}>Clear</span>
                  </div>
                )}

                {activeModalTab === "Skill" &&
                  skills.map((skill) => {
                    const isSelected = selectedSkills.includes(skill);
                    return (
                      <div
                        key={skill}
                        className={`${styles.option} ${isSelected ? styles.selectedOption : ""}`}
                        onClick={() => toggleSkill(skill)}
                      >
                        <span className={`${styles.check} ${isSelected ? styles.checked : ""}`}>
                          ✓
                        </span>
                        {skill}
                      </div>
                    );
                  })}

                {activeModalTab === "Gender" &&
                  genders.map((g) => {
                    const isSelected = selectedGender === g;
                    return (
                      <div
                        key={g}
                        className={`${styles.option} ${isSelected ? styles.selectedOption : ""}`}
                        onClick={() => toggleValue(g, setSelectedGender, selectedGender)}
                      >
                        <span className={`${styles.check} ${isSelected ? styles.checked : ""}`}>✓</span>
                        {g}
                      </div>
                    );
                  })}

                {activeModalTab === "Sorting" &&
                  sorting.map((s) => {
                    const isSelected = selectedSort === s;
                    return (
                      <div
                        key={s}
                        className={`${styles.option} ${isSelected ? styles.selectedOption : ""}`}
                        onClick={() => toggleValue(s, setSelectedSort, selectedSort)}
                      >
                        <span className={`${styles.check} ${isSelected ? styles.checked : ""}`}>✓</span>
                        {s}
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.resetBtn}
                onClick={() => {
                  setSelectedSkills([]);
                  setSelectedGender("");
                  setSelectedSort("");
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
