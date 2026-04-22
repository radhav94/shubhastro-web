import React, { useState, useEffect, useRef } from "react";
import styles from "./FilterChips.module.scss";
import { useLazyFilterAstrologersQuery } from "../../../../redux/api/astrologer/astrologerApi";
import { FaCheck } from "react-icons/fa";
// NEW: Formik and Yup imports for search field validation
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { AppIcons, AppImages } from "../../../../utils/appImages";

// NEW: Yup validation schema for search input — only alphabetic characters and spaces allowed
const searchValidationSchema = Yup.object({
  searchText: Yup.string().matches(/^[A-Za-z\s]*$/, "Only letters and spaces allowed"),
});

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
  const [active, setActive] = useState(
    selectedType === "All" ? "all" : selectedType
  );
  const [activeChips, setActiveChips] = useState([]);
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
  // Refs to hold latest filter state for pagination (avoids stale closures)
  const searchTextRef = useRef("");
  const selectedSkillsRef = useRef([]);
  const expertiesRef = useRef("");
  const selectedGenderRef = useRef("");
  const selectedSortRef = useRef("");
  // NEW: Debounce timer ref for search input
  const debounceTimerRef = useRef(null);
  const [activeModalTab, setActiveModalTab] = useState("Skill");
  // Refs for auto-scroll functionality
  const filterTabsRef = useRef(null);
  const chipRefs = useRef({});

  // NEW: Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Keep refs in sync with state for pagination
  useEffect(() => { searchTextRef.current = searchText; }, [searchText]);
  useEffect(() => { selectedSkillsRef.current = selectedSkills; }, [selectedSkills]);
  useEffect(() => { expertiesRef.current = experties; }, [experties]);
  useEffect(() => { selectedGenderRef.current = selectedGender; }, [selectedGender]);
  useEffect(() => { selectedSortRef.current = selectedSort; }, [selectedSort]);

  // Auto-scroll to active chip when selectedType changes from parent
  useEffect(() => {
    if (selectedType && selectedType !== "All") {
      // Delay to ensure chips are rendered from API data
      setTimeout(() => {
        const chipElement = chipRefs.current[selectedType];
        if (chipElement) {
          chipElement.scrollIntoView({
            behavior: "smooth",
            inline: "center",
            block: "nearest",
          });
        }
      }, 200);
    }
  }, [selectedType, astroFilterTab]);

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
    { name: "All",slug:"all" },
    { name: "Online",slug:"online" },
    ...(skillFilterData?.list || []).map((skill) => ({ name: skill.title,slug:skill.slug })),
  ];

  

  // ✅ DYNAMIC DATA - Extract modal filter sections from API response
  const skillsData = filterTabData?.find((item) => item.title === "Skill");
  const genderData = filterTabData?.find((item) => item.title === "Gender");
  const sortingData = filterTabData?.find((item) => item.title === "Sorting");

  const skills = skillsData?.list?.map((item) => item) || [];
  const genders = genderData?.list?.map((item) => item) || [];
  const sorting = sortingData?.list?.map((item) => item) || [];

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

      if (scrollTop + windowHeight >= fullHeight - 800) {
        loadMore();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore, isLoading]);


  // console.log("category::",selectedType+"/"+active)

  const loadMore = () => {
    if (!hasMore || loadingMoreRef.current || !isFilterActiveRef.current)
      return;

    const nextPage = pageRef.current + 1;
    // Use refs for latest filter values to avoid stale closures
    applyFilters({
      pageNo: nextPage,
      append: true,
      searchValue: searchTextRef.current,
      skills: selectedSkillsRef.current,
      experties: expertiesRef.current,
    });
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

    const isOnline = finalExperties === "online";
    // Also treat as online when user navigated to /online URL route
    const shouldFilterOnline = isOnline || isOnlineFromURL;

    try {
      loadingMoreRef.current = true;
      isFilterActiveRef.current = true;

      const response = await triggerFilter({
        searchText: finalSearchText,
        selectedSkills: finalSkills,
        experties: isOnline ? "" : finalExperties,
        selectedSort,
        selectedGender,
        page: pageNo,
        limit: 9,
        ...(shouldFilterOnline && { isActive: true }),
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

  // OLD: Original search handler
  // const handleSearchClick = (e) => {
  //   const value = e.target.value;
  //   setSearchText(value);
  //
  //   if (value.length > 2) {
  //     setActive("search");
  //     clearAll();
  //     isFilterActiveRef.current = true;
  //     applyFilters({ searchValue: value, category: "search", pageNo: 1 });
  //   } else if (value.length === 0) {
  //     handleClick("all");
  //   }
  // };



  // NEW (v2): Refined debounced search handler with strict input validation
  const handleDebouncedSearch = (e, setFieldValue) => {
    const rawValue = e.target.value;

    // STRICT VALIDATION: If rawValue contains any non-alphabetic or non-space character,
    // reject the entire input immediately — do not call API or proceed further
    if (/[^A-Za-z\s]/.test(rawValue)) {
      return;
    }

    // At this point rawValue is already clean (only A-Za-z and spaces)
    const sanitizedValue = rawValue;

    // Sync sanitized value to Formik field state and component state
    setFieldValue("searchText", sanitizedValue);
    setSearchText(sanitizedValue);

    // Clear any pending debounce timer before setting a new one
    clearTimeout(debounceTimerRef.current);

    // If input is cleared to empty, check if skills are still active
    if (sanitizedValue.length === 0) {
      if (activeChips.length > 0) {
        // Skills still selected — just re-apply with skills only
        isFilterActiveRef.current = true;
        applyFilters({
          pageNo: 1,
          skills: selectedSkills,
          ignoreSearch: true,
          append: false,
        });
      } else {
        handleClick("all");
      }
      return;
    }

    // Only trigger debounced API call when input exceeds 2 characters (search-first policy)
   
      debounceTimerRef.current = setTimeout(() => {
        setActive(activeChips.length > 0 ? "" : "search");
        isFilterActiveRef.current = true;
        applyFilters({
          searchValue: sanitizedValue,
          skills: selectedSkills,
          category: "search",
          pageNo: 1,
        });
      }, 500);
    
    // If 1-2 chars: update the input display but do NOT trigger any API call
  };

  const applyFiltersClick = () => {
    // Sync activeChips with modal's selectedSkills
    setActiveChips(selectedSkills);

    if (selectedSkills.length > 0 || selectedGender || selectedSort) {
      setActive(selectedSkills.length > 0 ? "" : "filter");
    }
    setPage(1);
    pageRef.current = 1;
    setHasMore(true);
    isFilterActiveRef.current = true;

    applyFilters({
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

  const selectAll = () => setSelectedSkills(skills.map(skill => skill.slug));

  const clearAll = () => {
    setSelectedSkills([]);
    setSelectedGender("");
    setSelectedSort("");
    setActiveChips([]);
  };

  const handleClick = (itemSlug) => {
    const clickedButton = filterButtons.find(btn => btn.slug === itemSlug);
    const itemName = clickedButton?.slug || itemSlug;

    setPage(1);
    pageRef.current = 1;
    setHasMore(true);

    // "All" resets everything
    if (itemSlug === "all") {
      setActive("all");
      setActiveChips([]);
      setEexperties("");
      setSelectedSkills([]);
      setSelectedGender("");
      setSelectedSort("");
      setSearchText("");
      isFilterActiveRef.current = false;
      setShowFilterAstrologer(false);
      onSelect?.(null);
      return;
    }

    // "Online" is exclusive — clears skill chips
    if (itemSlug === "online") {
      setActive("online");
      setActiveChips([]);
      setEexperties("online");
      setSelectedSkills([]);
      setSelectedGender("");
      setSelectedSort("");
      setSearchText("");
      isFilterActiveRef.current = true;

      applyFilters({
        pageNo: 1,
        experties: "online",
        ignoreSearch: true,
        append: false,
      });
      return;
    }

    // Skill chips — multi-select toggle (preserve searchText)
    let newChips;
    if (activeChips.includes(itemSlug)) {
      newChips = activeChips.filter((c) => c !== itemSlug);
    } else {
      newChips = [...activeChips, itemSlug];
    }

    // If all chips deselected and no search, revert to "All"
    if (newChips.length === 0 && !searchText) {
      setActive("all");
      setActiveChips([]);
      setEexperties("");
      setSelectedSkills([]);
      isFilterActiveRef.current = false;
      setShowFilterAstrologer(false);
      onSelect?.(null);
      return;
    }

    // If all chips deselected but search is active, keep search mode
    if (newChips.length === 0 && searchText) {
      setActiveChips([]);
      setSelectedSkills([]);
      setEexperties("");
      isFilterActiveRef.current = true;
      applyFilters({
        pageNo: 1,
        searchValue: searchText,
        skills: [],
        category: "search",
        append: false,
      });
      return;
    }

    setActive("");
    setActiveChips(newChips);
    setSelectedSkills(newChips);
    setEexperties("");
    isFilterActiveRef.current = true;

    applyFilters({
      pageNo: 1,
      skills: newChips,
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
          {/* OLD: Original search input
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
          */}

          {/* NEW: Formik-wrapped search input with validation */}
          <Formik
            initialValues={{ searchText: "" }}
            validationSchema={searchValidationSchema}
            onSubmit={() => {}}
          >
            {({ setFieldValue }) => (
              <Form>
                <div>
                  <i className="fa fa-search" />
                  <Field
                    name="searchText"
                    className={`${styles.chip} ${active === "search" ? styles.activeChip : ""}`}
                    type="text"
                    placeholder="Search Name"
                    value={searchText}
                    onInput={(e) => handleDebouncedSearch(e, setFieldValue)}
                  />
                </div>
              </Form>
            )}
          </Formik>

          <button
            key={"filter"}
            className={styles.chip}
            onClick={() => setFilterModalOpen(true)}
          >
            <img src={AppImages.FilterIcon} alt="filter-icon" />
            Filter
          </button>
        </div>
        <div className={styles.filterTabs} ref={filterTabsRef}>
          {isFetchingFilterTab ? (
            <div className={styles.chip}>Loading filters...</div>
          ) : (
            [...filterButtons]
              .sort((a, b) => {
                const pinned = ['all', 'online'];
                const aPinned = pinned.includes(a.slug);
                const bPinned = pinned.includes(b.slug);
                // Pinned chips always stay first in original order
                if (aPinned && bPinned) return pinned.indexOf(a.slug) - pinned.indexOf(b.slug);
                if (aPinned) return -1;
                if (bPinned) return 1;
                // Among non-pinned: active chips come before inactive
                const aActive = activeChips.includes(a.slug);
                const bActive = activeChips.includes(b.slug);
                if (aActive === bActive) return 0;
                return aActive ? -1 : 1;
              })
              .map((btn) => {
              const isActive = active === btn.slug || activeChips.includes(btn.slug);
            
              return (
                <div
                  key={btn.name}
                  ref={(el) => (chipRefs.current[btn.slug] = el)}
                  className={`${styles.chip} ${isActive ? styles.activeChip : ""}`}
                  onClick={() => handleClick(btn.slug)}
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
                        const isSelected = selectedSkills.includes(skill.slug);
                        return (
                          <div
                            key={skill.title}
                            className={styles.option}
                            onClick={() => toggleSkill(skill.slug)}
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
                              {skill.title}
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
                      // console.log("Gender:",g)
                      const isSelected = selectedGender === g.slug;

                      return (
                        <div
                          key={g.slug}
                          className={styles.option}
                          onClick={() =>
                            toggleValue(g.slug, setSelectedGender, selectedGender)
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
                            {g.title}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {activeModalTab === "Sorting" && (
                  <div className={styles.optionsList}>
                    {sorting.map((s) => {
                      const isSelected = selectedSort === s.slug;
                      return (
                        <div
                          key={s.slug}
                          className={styles.option}
                          onClick={() =>
                            toggleValue(s.slug, setSelectedSort, selectedSort)
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
                            {s.title}
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
                  handleClick("all");
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
