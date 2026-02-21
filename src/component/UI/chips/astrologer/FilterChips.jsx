import React, { useState, useEffect, useRef } from "react";
import styles from "./FilterChips.module.scss";
import { useLazyFilterAstrologersQuery } from "../../../../redux/api/astrologer/astrologerApi";
import { FaCheck } from "react-icons/fa";

const FilterChips = ({
  onSelect,
  onApplyFilters,
  isActiveType,
  isOnlineFromURL,
  setShowFilterAstrologer,
  selectedType = "All",
  astroFilterTab = [],
  isFetchingFilterTab = false,
}) => {
  const [triggerFilter, { isLoading }] = useLazyFilterAstrologersQuery();

  const [active, setActive] = useState(selectedType);
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

  // Refs for auto-scroll functionality
  const filterTabsRef = useRef(null);
  const chipRefs = useRef({});

  // Auto-scroll to active chip when selectedType changes from parent
  useEffect(() => {
    if (
      selectedType &&
      selectedType !== "All" &&
      chipRefs.current[selectedType]
    ) {
      const chipElement = chipRefs.current[selectedType];
      const container = filterTabsRef.current;

      if (chipElement && container) {
        // Calculate scroll position to center the chip
        const chipLeft = chipElement.offsetLeft;
        const chipWidth = chipElement.offsetWidth;
        const containerWidth = container.offsetWidth;
        const scrollLeft = chipLeft - containerWidth / 2 + chipWidth / 2;

        // Smooth scroll to the chip
        container.scrollTo({
          left: scrollLeft,
          behavior: "smooth",
        });
      }
    }
  }, [selectedType]);

  // Update active state when selectedType prop changes from parent (but not on every render)
  useEffect(() => {
    if (selectedType && selectedType !== "All") {
      setActive(selectedType);
      setEexperties(selectedType);
      setPage(1);
      pageRef.current = 1;
      setHasMore(true);
      isFilterActiveRef.current = true;

      // Trigger the filter API call
      applyFilters({
        pageNo: 1,
        experties: selectedType,
        ignoreSearch: true,
        append: false,
      });
    }
  }, [selectedType]);

  const openFilterModal = () => {
    setFilterModalOpen(true);
    setActiveModalTab("Skill");
  };

  // ✅ STATIC DATA (COMMENTED OUT - Replaced with dynamic API data)
  // const filterButtons = [
  //   { name: "All" },
  //   { name: "Online" },
  //   { name: "Tarot" },
  //   { name: "Palmistry" },
  //   { name: "Numerology" },
  //   { name: "Face Reading" },
  //   { name: "Vedic Astrology" },
  //   { name: "Love" },
  //   { name: "Education" },
  //   { name: "Career" },
  //   { name: "Marriage" },
  //   { name: "Health" },
  //   { name: "Wealth" },
  //   { name: "Legal" },
  //   { name: "Finance" },
  //   { name: "Remedies" },
  //   { name: "Parents" },
  //   { name: "Palm reader" },
  //   { name: "Tantra-magic" },
  // ];

  // ✅ DYNAMIC DATA - Extract Skill list from API response
  // Handle both array and nested object response structures
  const filterTabData = React.useMemo(() => {
    // If astroFilterTab is already an array, use it
    if (Array.isArray(astroFilterTab)) {
      return astroFilterTab;
    }
    // If it's an object with a data property that's an array, use that
    if (astroFilterTab?.data && Array.isArray(astroFilterTab.data)) {
      return astroFilterTab.data;
    }
    // If it's an object with a data.data property that's an array, use that
    if (astroFilterTab?.data?.data && Array.isArray(astroFilterTab.data.data)) {
      return astroFilterTab.data.data;
    }
    // Default to empty array
    return [];
  }, [astroFilterTab]);
  
  const skillFilterData = filterTabData?.find((item) => item.title === "Skill");
  const filterButtons = [
    { name: "All" },
    { name: "Online" },
    ...(skillFilterData?.list || []).map((skill) => ({ name: skill.title })),
  ];

  // ✅ STATIC DATA (COMMENTED OUT - Replaced with dynamic API data)
  // const skills = [
  //   "Face Reading",
  //   "Kp",
  //   "Life Coach",
  //   "Nadi",
  //   "Numerology",
  //   "Palmistry",
  //   "Prashana",
  //   "Psychic",
  //   "Signature Reading",
  //   "Tarot",
  //   "Vastu",
  //   "Vedic",
  // ];

  // ✅ DYNAMIC DATA - Extract modal filter sections from API response
  const skillsData = filterTabData?.find((item) => item.title === "Skill");
  const genderData = filterTabData?.find((item) => item.title === "Gender");
  const sortingData = filterTabData?.find((item) => item.title === "Sorting");

  const skills = skillsData?.list?.map((item) => item.title) || [];
  const genders = genderData?.list?.map((item) => item.title) || [];
  const sorting = sortingData?.list?.map((item) => item.title) || [];

  // ✅ STATIC DATA (COMMENTED OUT - Replaced with dynamic API data above)
  // const genders = ["Male", "Female"];
  // const sorting = ["Sort By Price", "Sort By Rating"];

  // -------------------------
  // SCROLL HANDLER - only when filter is active
  // -------------------------
  useEffect(() => {
    const handleScroll = () => {
      if (
        !isFilterActiveRef.current ||
        loadingMoreRef.current ||
        isLoading ||
        !hasMore
      )
        return;

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
    if (!hasMore || loadingMoreRef.current || !isFilterActiveRef.current)
      return;

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
      
      // Set showFilterAstrologer to true when filters are applied (not "All")
      setShowFilterAstrologer(true);
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

  const toggleValue = (value, setter, state) =>
    setter(state === value ? "" : value);

  const toggleSkill = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
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
      setShowFilterAstrologer(false); // Show TOP ASTROLOGERS when "All" is selected
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M3.6 1.39999H12.4C13.1333 1.39999 13.7333 1.99999 13.7333 2.73333V4.19999C13.7333 4.73333 13.4 5.39999 13.0667 5.73333L10.2 8.26666C9.8 8.59999 9.53333 9.26666 9.53333 9.79999V12.6667C9.53333 13.0667 9.26666 13.6 8.93333 13.8L8 14.4C7.13333 14.9333 5.93333 14.3333 5.93333 13.2667V9.73333C5.93333 9.26666 5.66666 8.66666 5.4 8.33333L2.86666 5.66666C2.53333 5.33333 2.26666 4.73333 2.26666 4.33333V2.79999C2.26666 1.99999 2.86666 1.39999 3.6 1.39999Z"
                stroke="white"
                strokeWidth="1.2"
                strokeMiterlimit="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7.28667 1.39999L4 6.66666"
                stroke="white"
                strokeWidth="1.2"
                strokeMiterlimit="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Filter
          </button>
        </div>
        <div className={styles.filterTabs} ref={filterTabsRef}>
          {isFetchingFilterTab ? (
            <div className={styles.chip}>Loading filters...</div>
          ) : (
            filterButtons.map((btn) => {
              const isActive = active === btn.name;
              return (
                <div
                  key={btn.name}
                  ref={(el) => (chipRefs.current[btn.name] = el)}
                  className={`${styles.chip} ${isActive ? styles.activeChip : ""}`}
                  onClick={() => handleClick(btn.name)}
                >
                  <span>{btn.name}</span>
                </div>
              );
            })
          )}
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
                {/* ✅ DYNAMIC RENDERING - Render sidebar items based on API response */}
                {filterTabData?.map((filterSection) => (
                  <div
                    key={filterSection.title}
                    className={`${styles.sidebarItem} ${activeModalTab === filterSection.title ? styles.activeSidebarItem : ""}`}
                    onClick={() => setActiveModalTab(filterSection.title)}
                  >
                    {filterSection.title}
                  </div>
                ))}

                {/* ✅ STATIC RENDERING (COMMENTED OUT - Replaced with dynamic rendering above)
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
                */}
              </div>

              <div className={styles.rightContent}>
                {/* ✅ DYNAMIC RENDERING - Render content based on active modal tab */}
                {activeModalTab === "Skill" && (
                  <>
                    <div className={styles.contentHeader}>
                      <span onClick={selectAll} className={styles.selectAll}>
                        Select all
                      </span>
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
                            <FaCheck
                              className={
                                isSelected
                                  ? styles.checkIcon
                                  : styles.checkIconInactive
                              }
                              size={14}
                            />
                            <span
                              className={isSelected ? styles.selectedText : ""}
                            >
                              {skill}
                            </span>
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
                          onClick={() =>
                            toggleValue(g, setSelectedGender, selectedGender)
                          }
                        >
                          <FaCheck
                            className={
                              isSelected
                                ? styles.checkIcon
                                : styles.checkIconInactive
                            }
                            size={14}
                          />
                          <span
                            className={isSelected ? styles.selectedText : ""}
                          >
                            {g}
                          </span>
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
                          onClick={() =>
                            toggleValue(s, setSelectedSort, selectedSort)
                          }
                        >
                          <FaCheck
                            className={
                              isSelected
                                ? styles.checkIcon
                                : styles.checkIconInactive
                            }
                            size={14}
                          />
                          <span
                            className={isSelected ? styles.selectedText : ""}
                          >
                            {s}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ✅ STATIC RENDERING (COMMENTED OUT - Replaced with dynamic rendering above)
                {activeModalTab === "Skill" && (
                  <>
                    <div className={styles.contentHeader}>
                      <span onClick={selectAll} className={styles.selectAll}>
                        Select all
                      </span>
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
                            <FaCheck
                              className={
                                isSelected
                                  ? styles.checkIcon
                                  : styles.checkIconInactive
                              }
                              size={14}
                            />
                            <span
                              className={isSelected ? styles.selectedText : ""}
                            >
                              {skill}
                            </span>
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
                          onClick={() =>
                            toggleValue(g, setSelectedGender, selectedGender)
                          }
                        >
                          <FaCheck
                            className={
                              isSelected
                                ? styles.checkIcon
                                : styles.checkIconInactive
                            }
                            size={14}
                          />
                          <span
                            className={isSelected ? styles.selectedText : ""}
                          >
                            {g}
                          </span>
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
                          onClick={() =>
                            toggleValue(s, setSelectedSort, selectedSort)
                          }
                        >
                          <FaCheck
                            className={
                              isSelected
                                ? styles.checkIcon
                                : styles.checkIconInactive
                            }
                            size={14}
                          />
                          <span
                            className={isSelected ? styles.selectedText : ""}
                          >
                            {s}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
                */}
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
