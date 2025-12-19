import { useState } from "react";
import axios from "axios";
import styles from "./FilterChips.module.scss";

const FilterChips = ({ onSelect, onApplyFilters }) => {
  const filterButtons = [
    { name: "All", icon: "📋" },
    { name: "Tarot", icon: "🔮" },
    { name: "Vedic Astrology", icon: "🧘" },
    { name: "Palm reader", icon: "✋" },
    { name: "tantra-magic", icon: "✨" },
    { name: "numerology", icon: "🔢" },
  ];

  const skills = [
    "Face Reading",
    "Kp",
    "Life Coach",
    "Nadi",
    "Numerology",
    "Palmistry",
    "Prashana",
  ];
  const languages = ["Hindi", "English", "Tamil"];
  const genders = ["Male", "Female"];
  const sorting = ["Popularity", "Experience", "Price Low to High"];

  const [active, setActive] = useState("All");
  const [searchText, setSearchText] = useState("");
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Skill");

  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [selectedSort, setSelectedSort] = useState("");

  const handleClick = (item) => {
    setActive(item);
    onSelect?.(item === "All" ? null : item);
  };
  
  const handleSearchClick = (e) => {
    const value = e.target.value;
    setSearchText(value);
  
    if (value.length > 2) {
      setActive("search");
      clearAll();
      applyFilters({ searchValue: value, category: "search" });
    }else if (value.length === 0) {
      handleClick("All");
    }
  };
  const applyFiltersClick = () => {
    setActive("filter");
  
    // ✅ clear old data immediately
    onApplyFilters?.({
      category: "filter",
      result: [],
      loading: true,
    });
  
    applyFilters({ ignoreSearch: true, category: "filter" });
  };
  
  
  
  const toggleValue = (value, setter, state) => setter(state === value ? "" : value);

  const toggleSkill = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const selectAll = () => {
    if (activeTab === "Skill") setSelectedSkills([...skills]);
  };

  const clearAll = () => {
    if (activeTab === "Skill") setSelectedSkills([]);
    if (activeTab === "Language") setSelectedLanguage("");
    if (activeTab === "Gender") setSelectedGender("");
    if (activeTab === "Sorting") setSelectedSort("");
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    clearAll();
  };

  const applyFilters = async ({
    ignoreSearch = false,
    searchValue,
    category = "filter",
  } = {}) => {
    const finalSearchText =
      ignoreSearch ? "" : searchValue ?? searchText;
  
    try {
      const response = await axios.get(
        `https://devapi-shubhtalk.epicon.in/api/astrologers/filterAstrologers?${new URLSearchParams({
          astroName: finalSearchText,
          specialities: selectedSkills.join(","),
          limit: 10,
          page: 1,
          Eexperties: "",
          sorting: !!selectedSort,
          sortByPrice: selectedSort === "Price Low to High" ? 1 : 0,
          sortByRating: selectedSort === "Popularity" ? 1 : 0,
          gender: selectedGender.toLowerCase() || "",
        })}`,
        { headers: { Authorization: "Bearer YOUR_TOKEN" } }
      );
  
      // ✅ ALWAYS replace data
      onApplyFilters?.({
        category,
        search: finalSearchText,
        result: response.data?.data || [],
      });
  
      setFilterModalOpen(false);
    } catch (err) {
      // ✅ clear old data even on error
      onApplyFilters?.({
        category,
        search: finalSearchText,
        result: [],
      });
      console.error(err);
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


        <button  key={'filter'}  className={`${styles.chip} ${active === 'filter' ? styles.activeChip : ""}`} onClick={() => setFilterModalOpen(true)}>
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
                {["Skill", "Language", "Gender", "Sorting"].map((tab) => (
                  <div
                    key={tab}
                    className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ""}`}
                    onClick={() => handleTabChange(tab)}
                  >
                    {tab}
                  </div>
                ))}
              </div>
             
              <div className={styles.rightContent}>
              {activeTab === "Skill" &&(
                <div className={styles.topActions}>
                  <span onClick={selectAll}>Select all</span>
                  <span onClick={clearAll}>Clear</span>
                </div>
                )}
                {activeTab === "Skill" &&
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
                {activeTab === "Language" &&
                  languages.map((lang) => {
                    const isSelected = selectedLanguage === lang;
                    return (
                      <div
                        key={lang}
                        className={`${styles.option} ${isSelected ? styles.selectedOption : ""}`}
                        onClick={() => toggleValue(lang, setSelectedLanguage, selectedLanguage)}
                      >
                        <span className={`${styles.check} ${isSelected ? styles.checked : ""}`}>
                          ✓
                        </span>
                        {lang}
                      </div>
                    );
                  })}

                {activeTab === "Gender" &&
                  genders.map((g) => {
                    const isSelected = selectedGender === g;
                    return (
                      <div
                        key={g}
                        className={`${styles.option} ${isSelected ? styles.selectedOption : ""}`}
                        onClick={() => toggleValue(g, setSelectedGender, selectedGender)}
                      >
                        <span className={`${styles.check} ${isSelected ? styles.checked : ""}`}>
                          ✓
                        </span>
                        {g}
                      </div>
                    );
                  })}

                {activeTab === "Sorting" &&
                  sorting.map((s) => {
                    const isSelected = selectedSort === s;
                    return (
                      <div
                        key={s}
                        className={`${styles.option} ${isSelected ? styles.selectedOption : ""}`}
                        onClick={() => toggleValue(s, setSelectedSort, selectedSort)}
                      >
                        <span className={`${styles.check} ${isSelected ? styles.checked : ""}`}>
                          ✓
                        </span>
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
                  setSelectedLanguage("");
                  setSelectedGender("");
                  setSelectedSort("");
                  handleClick('All');
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
