import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./FilterChips.module.scss";
import { useLazyFilterAstrologersQuery } from "../../../../redux/api/astrologer/astrologerApi";
import Toast from "../../../toast";
import { FaCheck } from "react-icons/fa";
// NEW: Formik and Yup imports for search field validation
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { AppIcons, AppImages } from "../../../../utils/appImages";
import { nonNameCharsGlobal } from "../../../../utils/regex";

// Kept in step with the characters handleDebouncedSearch actually permits.
// Note this schema is inert in practice: the Formik onSubmit is a no-op and no
// ErrorMessage is rendered anywhere, so the input handler is the real gate.
const searchValidationSchema = Yup.object({
  searchText: Yup.string().matches(/^[\p{L}\p{M}\s'’.-]*$/u, "Enter a name"),
});

const FilterChips = ({
  onSelect,
  onApplyFilters,
  onFilterLoading,
  onFilterError,
  isActiveType,
  isOnlineFromURL,
  setShowFilterAstrologer,
  selectedType = "All",
  astroFilterTab = [],
  isFetchingFilterTab = false,
}) => {

  const navigate = useNavigate();
  const location = useLocation();
  const [triggerFilter, { isLoading }] = useLazyFilterAstrologersQuery();
  const [active, setActive] = useState(
    selectedType === "All" ? "all" : selectedType
  );
  const [activeChips, setActiveChips] = useState([]);
  const [searchText, setSearchText] = useState("");
  // Explains a stripped character in the search box (see handleDebouncedSearch).
  const [searchHint, setSearchHint] = useState("");
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [experties, setEexperties] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [selectedSort, setSelectedSort] = useState("");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [minRating, setMinRating] = useState(0);
  const [minExperience, setMinExperience] = useState(0);
  const [selectedLanguages, setSelectedLanguages] = useState([]);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loadingMoreRef = useRef(false);
  const pageRef = useRef(1);
  const isFilterActiveRef = useRef(false);
  // Last user-initiated (non-append) applyFilters args, so the parent's
  // "Try again" card can re-run the exact same filter after a failure.
  const lastApplyArgsRef = useRef(null);
  // Refs to hold latest filter state for pagination (avoids stale closures)
  const searchTextRef = useRef("");
  const selectedSkillsRef = useRef([]);
  const expertiesRef = useRef("");
  const selectedGenderRef = useRef("");
  const selectedSortRef = useRef("");
  const minPriceRef = useRef(0);
  const maxPriceRef = useRef(1000);
  const minRatingRef = useRef(0);
  const minExperienceRef = useRef(0);
  const selectedLanguagesRef = useRef([]);
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

  // // Poll every 15s when filters are active to keep astrologer status updated
  // useEffect(() => {
  //   if (!isFilterActiveRef.current) return;

  //   const intervalId = setInterval(() => {
  //     if (!isFilterActiveRef.current) return;
  //     applyFilters({
  //       pageNo: 1,
  //       searchValue: searchTextRef.current,
  //       skills: selectedSkillsRef.current,
  //       experties: expertiesRef.current,
  //       append: false,
  //     });
  //   }, 15000);

  //   return () => clearInterval(intervalId);
  // }, [active, activeChips, selectedGender, selectedSort]);

  // Keep refs in sync with state for pagination
  useEffect(() => { searchTextRef.current = searchText; }, [searchText]);
  useEffect(() => { selectedSkillsRef.current = selectedSkills; }, [selectedSkills]);
  useEffect(() => { expertiesRef.current = experties; }, [experties]);
  useEffect(() => { selectedGenderRef.current = selectedGender; }, [selectedGender]);
  useEffect(() => { selectedSortRef.current = selectedSort; }, [selectedSort]);
  useEffect(() => { minPriceRef.current = minPrice; }, [minPrice]);
  useEffect(() => { maxPriceRef.current = maxPrice; }, [maxPrice]);
  useEffect(() => { minRatingRef.current = minRating; }, [minRating]);
  useEffect(() => { minExperienceRef.current = minExperience; }, [minExperience]);
  useEffect(() => { selectedLanguagesRef.current = selectedLanguages; }, [selectedLanguages]);

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
      setActiveChips([selectedType]); // IMPORTANT: Also update activeChips so deselect logic works correctly
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
    } else if (!selectedType || selectedType === "All") {
      // When selectedType becomes undefined/empty (user clicked to unselect)
      // Immediately clear the active state instead of waiting for parent re-render
      setActive("all");
      setActiveChips([]);
      setEexperties("");
      setSelectedSkills([]);
      setSelectedGender("");
      setSelectedSort("");
      setSearchText("");
      setPage(1);
      pageRef.current = 1;
      setHasMore(true);
      isFilterActiveRef.current = false;
    }
  }, [selectedType, astroFilterTab]);

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
    // { name: "Online",slug:"online" },
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
    // Every filter comes from a ref here, not from this closure — see the note on
    // applyFilters. The scroll effect that calls this is not re-created when the
    // filter sheet changes, so anything read from the closure would be whatever
    // was set the last time `[hasMore, isLoading]` changed.
    applyFilters({
      pageNo: nextPage,
      append: true,
      searchValue: searchTextRef.current,
      skills: selectedSkillsRef.current,
      experties: expertiesRef.current,
      modalFilters: {
        languages: selectedLanguagesRef.current,
        sort: selectedSortRef.current,
        gender: selectedGenderRef.current,
        minPrice: minPriceRef.current,
        maxPrice: maxPriceRef.current,
        minRating: minRatingRef.current,
        minExperience: minExperienceRef.current,
      },
    });
  };

  // -------------------------
  // APPLY FILTERS
  // -------------------------
  /*
    `modalFilters` carries the values set in the filter sheet (language, price,
    rating, experience, gender, sort).

    They used to be read straight from this closure, which is correct for the
    direct calls but wrong for `loadMore`. That one runs from the scroll effect,
    whose closure is only refreshed when `[hasMore, isLoading]` changes — so a
    filter chosen after the effect last ran was invisible to it, and page 2
    onwards was requested WITHOUT it. Scrolling a language-filtered list appended
    astrologers who do not speak that language, silently widening the result set
    the user had just narrowed.

    The refs to prevent this were already declared at the top of the component
    and kept in sync ("Refs to hold latest filter state for pagination"), but only
    searchText / selectedSkills / experties were ever actually read. This closes
    the gap for the rest, using the same explicit-parameter pattern those three
    already use rather than reading refs in here — direct callers keep passing
    nothing and keep getting live state.
  */
  const applyFilters = async (applyArgs = {}) => {
    const {
      ignoreSearch = false,
      searchValue,
      category = "filter",
      experties: expertiesValue,
      pageNo = 1,
      append = false,
      skills,
      modalFilters,
    } = applyArgs;
    // Remember the last user-initiated filter so a retry can replay it.
    if (!append) lastApplyArgsRef.current = applyArgs;
    const finalSearchText = ignoreSearch ? "" : (searchValue ?? searchText);
    const finalExperties = expertiesValue ?? experties;
    const finalSkills = skills ?? selectedSkills;

    const finalLanguages = modalFilters?.languages ?? selectedLanguages;
    const finalSort = modalFilters?.sort ?? selectedSort;
    const finalGender = modalFilters?.gender ?? selectedGender;
    const finalMinPrice = modalFilters?.minPrice ?? minPrice;
    const finalMaxPrice = modalFilters?.maxPrice ?? maxPrice;
    const finalMinRating = modalFilters?.minRating ?? minRating;
    const finalMinExperience = modalFilters?.minExperience ?? minExperience;

    const isOnline = finalExperties === "online";
    // Also treat as online when user navigated to /online URL route
    const shouldFilterOnline = isOnline || isOnlineFromURL;

    try {
      loadingMoreRef.current = true;
      isFilterActiveRef.current = true;
      if (!append) onFilterLoading?.(true);
      const response = await triggerFilter({
        searchText: finalSearchText,
        selectedSkills: finalSkills,
        experties: isOnline ? "" : finalExperties,
        selectedSort: finalSort,
        selectedGender: finalGender,
        page: pageNo,
        limit: 9,
        ...(shouldFilterOnline && { isActive: true }),
        ...(finalMinPrice > 0 && { minPrice: finalMinPrice }),
        ...(finalMaxPrice < 1000 && { maxPrice: finalMaxPrice }),
        ...(finalMinRating > 0 && { minRating: finalMinRating }),
        ...(finalMinExperience > 0 && { minExperience: finalMinExperience }),
        ...(finalLanguages.length > 0 && { language: finalLanguages.join(",") }),
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

      // Request succeeded — clear any error card the parent was showing.
      onFilterError?.(null);

      // Set showFilterAstrologer to true when filters are applied (not "All")
      setShowFilterAstrologer(true);
    } catch (error) {
      console.error(error);
      // A swallowed failure left the previous list on screen unchanged, so the
      // chip tap looked like it did nothing. Say so, and only for the tap the
      // user actually made (not background scroll-loading).
      if (!append) {
        Toast.error("Couldn't load astrologers for that filter. Please try again.");
        // Hand the parent a recoverable error so it can render the same
        // "Couldn't load astrologers / Try again" card as the base list. The
        // retry replays the exact filter that just failed.
        onFilterError?.({
          retry: () => applyFilters(lastApplyArgsRef.current || {}),
        });
      }
    } finally {
      loadingMoreRef.current = false;
      onFilterLoading?.(false);
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

    /*
      This used to be:

        if (/[^A-Za-z\s]/.test(rawValue)) return;

      i.e. one disallowed character anywhere in the value discarded the *entire*
      input. The Field is controlled by `value={searchText}`, so nothing appeared
      on screen and nothing was said — typing into the box did visibly nothing.
      Anyone searching "R. Sharma", a hyphenated or apostrophed name, or a name in
      a non-Latin script hit a wall, and once an invalid character was in the
      value every subsequent keystroke was blocked too. The Yup schema below
      cannot help: onSubmit is a no-op and no ErrorMessage is rendered.

      Now the unusable characters are stripped and everything else is kept, so a
      keystroke always produces a visible result. `nonNameCharsGlobal` allows
      letters in any script plus spaces and . ' - — the punctuation real names use.
    */
    const sanitizedValue = rawValue.replace(nonNameCharsGlobal, "");

    // Say why a character vanished, rather than letting it look like a glitch.
    setSearchHint(
      sanitizedValue === rawValue
        ? ""
        : "Search by name — numbers and symbols are ignored."
    );

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

    if (selectedSkills.length > 0 || selectedGender || selectedSort || minPrice > 0 || maxPrice < 1000 || minRating > 0 || minExperience > 0 || selectedLanguages.length > 0) {
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
    setMinPrice(0);
    setMaxPrice(1000);
    setMinRating(0);
    setMinExperience(0);
    setSelectedLanguages([]);
  };

  const handleClick = (itemSlug) => {
    const clickedButton = filterButtons.find(btn => btn.slug === itemSlug);
    const itemName = clickedButton?.slug || itemSlug;

    // Determine the base path from current URL (supports /astrologers, /talk-to-astrologer, /chat-to-astrologer)
    const basePath = location.pathname.split("/").filter(Boolean)[0] || "astrologers";

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
      setSearchHint("");
      isFilterActiveRef.current = false;
      setShowFilterAstrologer(false);
      onSelect?.(null);
      navigate(`/${basePath}`, { replace: true });
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

      navigate(`/${basePath}/online`, { replace: true });
      applyFilters({
        pageNo: 1,
        experties: "online",
        ignoreSearch: true,
        append: false,
      });
      return;
    }

    // Skill chips — single select only (clicking same chip deselects it)
    if (activeChips.includes(itemSlug)) {
      // Deselecting the active chip
      if (!searchText) {
        setActive("all");
        setActiveChips([]);
        setEexperties("");
        setSelectedSkills([]);
        isFilterActiveRef.current = false;
        setShowFilterAstrologer(false);
        onSelect?.(null);
        navigate(`/${basePath}`, { replace: true });
      } else {
        // Search is active, keep search mode
        setActiveChips([]);
        setSelectedSkills([]);
        setEexperties("");
        isFilterActiveRef.current = true;
        navigate(`/${basePath}`, { replace: true });
        applyFilters({
          pageNo: 1,
          searchValue: searchText,
          skills: [],
          category: "search",
          append: false,
        });
      }
      return;
    }

    // Selecting a new chip — replace any previous selection (single select)
    const newChips = [itemSlug];

    navigate(`/${basePath}/${itemSlug}`, { replace: true });

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
            /*
              Was `onSubmit={() => {}}`. The Field sits inside a <Form>, so
              Enter submits it — and submitting did nothing. The only path to a
              search was the 500 ms debounce in handleDebouncedSearch, so
              pressing Enter (the first thing anyone does in a search box, and
              the only affordance on a phone keyboard) produced no response at
              all: no request, no spinner, no message. Clarity logs that as a
              dead interaction on the last screen of the session.

              Now Enter runs the same search immediately and cancels the pending
              debounce, so the query cannot fire twice.
            */
            onSubmit={({ searchText: submitted }) => {
              clearTimeout(debounceTimerRef.current);
              const value = (submitted || searchText || "").trim();

              if (!value) {
                // Empty box: mirror the clear button rather than firing a
                // no-op request.
                if (activeChips.length > 0) {
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

              setActive(activeChips.length > 0 ? "" : "search");
              isFilterActiveRef.current = true;
              applyFilters({
                searchValue: value,
                skills: selectedSkills,
                category: "search",
                pageNo: 1,
              });
            }}
          >
            {({ setFieldValue }) => (
              <Form role="search">
                <div>
                  {/*
                    Was `<i className="fa fa-search" />`. FontAwesome is not
                    loaded anywhere in this app — no stylesheet link in
                    index.html, no package in package.json — so that element
                    rendered as an empty 0x0 box and the search field had no
                    icon at all, only a placeholder. Inline SVG so the
                    affordance actually paints; aria-hidden because the input's
                    label carries the meaning.
                  */}
                  <svg
                    className={styles.searchIcon}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                    <path d="M20 20L16.5 16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <Field
                    aria-label="Search astrologers by name"
                    name="searchText"
                    className={`${styles.chip} ${active === "search" ? styles.activeChip : ""}`}
                    type="text"
                    // Labels the phone keyboard's action key "Search" instead of
                    // the generic "Go"/newline, now that pressing it does something.
                    enterKeyHint="search"
                    placeholder="Search Name"
                    value={searchText}
                    onInput={(e) => handleDebouncedSearch(e, setFieldValue)}
                  />
                  {searchText && (
                    <button
                      type="button"
                      className={styles.clearSearchBtn}
                      aria-label="Clear search"
                      onClick={() => {
                        clearTimeout(debounceTimerRef.current);
                        setFieldValue("searchText", "");
                        setSearchText("");
                        setSearchHint("");
                        if (activeChips.length > 0) {
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
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
                {searchHint && (
                  <p className={styles.searchHint} role="status">
                    {searchHint}
                  </p>
                )}
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
                <button
                  key={btn.name}
                  type="button"
                  ref={(el) => (chipRefs.current[btn.slug] = el)}
                  className={`${styles.chip} ${isActive ? styles.activeChip : ""}`}
                  onClick={() => handleClick(btn.slug)}
                  aria-pressed={isActive}
                >
                  {btn.name}
                </button>
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
                {filterTabData?.filter((filterSection) => filterSection.title !== "Sorting").map((filterSection) => (
                  <div
                    key={filterSection.title}
                    className={`${styles.sidebarItem} ${activeModalTab === filterSection.title ? styles.activeSidebarItem : ""}`}
                    onClick={() => setActiveModalTab(filterSection.title)}
                  >
                    {filterSection.title}
                  </div>
                ))}
                <div
                  className={`${styles.sidebarItem} ${activeModalTab === "Price" ? styles.activeSidebarItem : ""}`}
                  onClick={() => setActiveModalTab("Price")}
                >
                  Price
                </div>
                <div
                  className={`${styles.sidebarItem} ${activeModalTab === "Rating" ? styles.activeSidebarItem : ""}`}
                  onClick={() => setActiveModalTab("Rating")}
                >
                  Rating
                </div>
                <div
                  className={`${styles.sidebarItem} ${activeModalTab === "Experience" ? styles.activeSidebarItem : ""}`}
                  onClick={() => setActiveModalTab("Experience")}
                >
                  Experience
                </div>
                <div
                  className={`${styles.sidebarItem} ${activeModalTab === "Language" ? styles.activeSidebarItem : ""}`}
                  onClick={() => setActiveModalTab("Language")}
                >
                  Language
                </div>

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

                {/* Sorting tab hidden */}

                {activeModalTab === "Price" && (
                  <div className={styles.priceRangeContainer}>
                    <div className={styles.priceHeader}>
                      <span> Minimum Price to Maximum Price</span>
                    </div>
                    <div className={styles.priceValues}>
                      <span>₹{minPrice}</span>
                      <span>₹{maxPrice}</span>
                    </div>
                    <div className={styles.rangeSliderWrapper}>
                      <input
                        type="range"
                        min={0}
                        max={1000}
                        step={5}
                        value={minPrice}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (val < maxPrice) setMinPrice(val);
                        }}
                        className={styles.rangeSlider}
                      />
                      <input
                        type="range"
                        min={0}
                        max={1000}
                        step={5}
                        value={maxPrice}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (val > minPrice) setMaxPrice(val);
                        }}
                        className={styles.rangeSlider}
                      />
                    </div>
                    <div className={styles.priceLabels}>
                      <span>₹0</span>
                      <span>₹1000</span>
                    </div>
                  </div>
                )}

                {activeModalTab === "Rating" && (
                  <div className={styles.priceRangeContainer}>
                    <div className={styles.priceHeader}>
                      <span>Minimum Rating (0–5)</span>
                    </div>
                    <div className={styles.priceValues}>
                      <span>⭐ {minRating}</span>
                    </div>
                    <div className={styles.rangeSliderWrapper}>
                      <input
                        type="range"
                        min={0}
                        max={5}
                        step={0.5}
                        value={minRating}
                        onChange={(e) => setMinRating(Number(e.target.value))}
                        aria-label="Minimum rating"
                        className={`${styles.rangeSlider} ${styles.singleRange}`}
                      />
                    </div>
                    <div className={styles.priceLabels}>
                      <span>0</span>
                      <span>5</span>
                    </div>
                  </div>
                )}

                {activeModalTab === "Experience" && (
                  <div className={styles.priceRangeContainer}>
                    <div className={styles.priceHeader}>
                      <span>Minimum Experience (years)</span>
                    </div>
                    <div className={styles.priceValues}>
                      <span>{minExperience} yrs</span>
                    </div>
                    <div className={styles.rangeSliderWrapper}>
                      <input
                        type="range"
                        min={0}
                        max={30}
                        step={1}
                        value={minExperience}
                        onChange={(e) => setMinExperience(Number(e.target.value))}
                        aria-label="Minimum experience in years"
                        className={`${styles.rangeSlider} ${styles.singleRange}`}
                      />
                    </div>
                    <div className={styles.priceLabels}>
                      <span>0 yrs</span>
                      <span>30 yrs</span>
                    </div>
                  </div>
                )}

                {activeModalTab === "Language" && (
                  <div className={styles.optionsList}>
                    {["Hindi", "English", "Marathi", "Gujarati", "Bengali", "Tamil", "Telugu", "Kannada", "Malayalam", "Punjabi"].map((lang) => {
                      const isSelected = selectedLanguages.includes(lang);
                      return (
                        <div
                          key={lang}
                          className={styles.option}
                          onClick={() =>
                            setSelectedLanguages((prev) =>
                              prev.includes(lang)
                                ? prev.filter((l) => l !== lang)
                                : [...prev, lang]
                            )
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
                          <span className={isSelected ? styles.selectedText : ""}>
                            {lang}
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
