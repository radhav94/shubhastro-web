import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import styles from "./EPooja.module.scss";
import { FiChevronLeft, FiChevronRight, FiSearch, FiX, FiChevronDown } from "react-icons/fi";
import Toast from "../../../component/toast";
import { useGetAstromallPageDataQuery, useAddToCartMutation, useGetProductsQuery, useGetProductCategoriesQuery } from "../../../redux/api/astromall/epooja/epoojaBookingApi";
import AstromallCartSidebar from "./components/AstromallCartSidebar";
import { DefaultImages } from "../../../utils/appImages";
import ProductImage from "../../../component/UI/ProductImage";

// ─── FALLBACK TABS (used while categories load) ───
const ALL_TAB = { label: "All Products", slug: "all" };

const SORT_OPTIONS = [
  { label: "Relevance", value: "" },
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Popular", value: "popular" },
];

// ─── EXPERT CARDS (static) ───
const EXPERT_CARDS = [
  { title: "Consult our astrologers today.", sub: "Get advice from astrologers.", btn: "Consult Now" },
  { title: "Want to know what future holds for you?", sub: "Get advice from astrologers.", btn: "Consult Now" },
  { title: "Consult our astrologers today.", sub: "Get advice from astrologers.", btn: "Consult Now" },
];

// ─── Scroll Helper ───
const useHScroll = () => {
  const ref = useRef(null);
  const go = (dir) => ref.current?.scrollBy({ left: dir === "left" ? -300 : 300, behavior: "smooth" });
  return { ref, goLeft: () => go("left"), goRight: () => go("right") };
};

// ─── Debounce hook ───
const useDebounce = (value, delay = 500) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

const SectionHeader = ({ title, onViewAll }) => (
  <div className={styles.sectionHeader}>
    <h2>{title}</h2>
    {onViewAll && <button className={styles.viewAll} onClick={onViewAll}>View all →</button>}
  </div>
);

const HScrollRow = ({ children }) => {
  const { ref, goLeft, goRight } = useHScroll();
  return (
    <div className={styles.hScrollWrap}>
      <button className={`${styles.arrowBtn} ${styles.arrowLeft}`} onClick={goLeft} aria-label="Scroll left"><FiChevronLeft /></button>
      <div className={styles.hScrollRow} ref={ref}>{children}</div>
      <button className={`${styles.arrowBtn} ${styles.arrowRight}`} onClick={goRight} aria-label="Scroll right"><FiChevronRight /></button>
    </div>
  );
};

// ─── Helper: get image/price/title from API item ───
const PRODUCT_FALLBACK = DefaultImages.AstromallProductDefault;
const getFirstVariant = (item) => {
  const variants = item?.variants || [];
  // Prefer the first variant that is both active and in stock
  const inStock = variants.find((v) => v.isActive !== false && v.inStock !== false && v.stock !== 0);
  if (inStock) return inStock;
  // Fallback: first active variant, then first variant overall
  return variants.find((v) => v.isActive) || variants[0] || null;
};
const resolveImg = (img) => {
  if (!img) return null;
  if (typeof img === "string") return img;
  if (typeof img === "object") return img.original || img.small || img.url || img.src || null;
  return null;
};
const getImg = (item) => {
  // Step 1: Check product-level images first
  if (item?.images?.length) {
    for (const img of item.images) {
      const resolved = resolveImg(img);
      if (resolved) return resolved;
    }
  }
  const banner = resolveImg(item?.banner_image);
  if (banner) return banner;
  const imgUrl = resolveImg(item?.imgUrl);
  if (imgUrl) return imgUrl;
  const image = resolveImg(item?.image);
  if (image) return image;
  const thumbnail = resolveImg(item?.thumbnail);
  if (thumbnail) return thumbnail;

  // Step 2: If no product images, check variant images
  const variant = getFirstVariant(item);
  if (variant?.images?.length) {
    for (const img of variant.images) {
      const resolved = resolveImg(img);
      if (resolved) return resolved;
    }
  }

  // Step 3: Default
  return PRODUCT_FALLBACK;
};
const getPrice = (item) => {
  const variant = getFirstVariant(item);
  return variant?.price || item?.price || item?.actualPrice || item?.selling_price || 0;
};
const getOldPrice = (item) => {
  const variant = getFirstVariant(item);
  return variant?.mrp || item?.mrp || item?.originalPrice || item?.compare_price || 0;
};
const getTitle = (item) => item?.title || item?.name || "Product";
const getBrand = (item) => typeof item?.brand === "object" ? item?.brand?.name : item?.brand;

// ═══════════════════════════════════════
// MAIN
// ═══════════════════════════════════════
const EPooja = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize state from URL params for back-navigation persistence
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "all");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [showSearch, setShowSearch] = useState(!!searchParams.get("search"));
  const [sort, setSort] = useState(searchParams.get("sort") || "");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [traySlug, setTraySlug] = useState(searchParams.get("slug") || "");
  const [page, setPage] = useState(1);
  const [accumulated, setAccumulated] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const prevFilterKey = useRef("");
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);
  const LIMIT = 10;

  // Homepage pagination state
  const [homePage, setHomePage] = useState(1);
  const [accumulatedTrays, setAccumulatedTrays] = useState([]);
  const [homeHasMore, setHomeHasMore] = useState(true);
  const homeObserverRef = useRef(null);
  const homeLoadMoreRef = useRef(null);
  const homeProcessedRef = useRef(null);
  const HOME_LIMIT = 10;

  const debouncedSearch = useDebounce(search, 500);

  // Sync filter state to URL params for back-navigation
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeTab !== "all") params.set("tab", activeTab);
    if (sort) params.set("sort", sort);
    if (search) params.set("search", search);
    if (traySlug) params.set("slug", traySlug);
    setSearchParams(params, { replace: true });
  }, [activeTab, sort, search, traySlug]);

  // Determine if filters are active (search or non-"all" tab or sort)
  const isFiltering = debouncedSearch || activeTab !== "all" || sort;

  // A key that changes whenever the filter criteria (not page) change
  const filterKey = `${debouncedSearch}|${activeTab}|${sort}`;

  // ── API Calls ──
  const { data: apiData, isLoading: homepageLoading, isFetching: homepageFetching } = useGetAstromallPageDataQuery({ page: homePage, limit: HOME_LIMIT });
  const { data: categoriesData } = useGetProductCategoriesQuery();
  const [addToCart] = useAddToCartMutation();

  // ── Build category tabs from API ──
  const categoryTabs = (() => {
    const raw = categoriesData?.data?.categories || categoriesData?.data || [];
    const list = Array.isArray(raw) ? raw : [];
    const mapped = list.map((c) => ({
      label: c.name || c.title || "",
      slug: c.slug || c._id || c.ID || "",
      id: c.ID || c._id || "",
    })).filter((t) => t.label && t.slug);
    return [ALL_TAB, ...mapped];
  })();

  // ── Build filter params ──
  const activeCategoryId = categoryTabs.find((t) => t.slug === activeTab)?.id;
  const filterParams = {
    page,
    limit: LIMIT,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(activeTab !== "all" && activeCategoryId && { category: activeCategoryId }),
    ...(traySlug && !activeCategoryId && { category: traySlug }),
    sort: sort || "relevant",
  };

  const { data: productsData, isLoading: productsLoading, isFetching: productsFetching } = useGetProductsQuery(
    filterParams,
    { skip: !isFiltering, refetchOnMountOrArgChange: true }
  );

  const trays = accumulatedTrays;

  // ── Accumulate homepage trays for scroll pagination ──
  useEffect(() => {
    if (!apiData?.data) return;
    if (homeProcessedRef.current === apiData.data) return;
    homeProcessedRef.current = apiData.data;

    const raw = apiData.data;
    const items = Array.isArray(raw.list) ? raw.list
      : Array.isArray(raw) ? raw
      : [];

    if (!items.length) {
      setHomeHasMore(false);
      return;
    }

    if (homePage === 1) {
      setAccumulatedTrays(items);
    } else {
      // Deduplicate by ID to avoid showing same trays again
      setAccumulatedTrays((prev) => {
        const existingIds = new Set(prev.map((t) => t.ID || t._id || t.slug || t.display_title));
        const newItems = items.filter((t) => {
          const id = t.ID || t._id || t.slug || t.display_title;
          return !existingIds.has(id);
        });
        // If no new unique items, stop pagination
        if (!newItems.length) {
          setHomeHasMore(false);
          return prev;
        }
        return [...prev, ...newItems];
      });
    }

    // Check if more pages available
    const totalPages = raw?.pages || raw?.totalPages || 0;
    if (totalPages > 0) {
      setHomeHasMore(homePage < totalPages);
    } else {
      setHomeHasMore(items.length >= HOME_LIMIT);
    }
  }, [apiData, homePage]);

  // ── Homepage Infinite Scroll Observer ──
  useEffect(() => {
    if (homeObserverRef.current) homeObserverRef.current.disconnect();

    if (!homeHasMore || homepageFetching || isFiltering) return;

    homeObserverRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && homeHasMore && !homepageFetching) {
          setHomePage((p) => p + 1);
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    if (homeLoadMoreRef.current) {
      homeObserverRef.current.observe(homeLoadMoreRef.current);
    }

    return () => {
      if (homeObserverRef.current) homeObserverRef.current.disconnect();
    };
  }, [homeHasMore, homepageFetching, isFiltering, accumulatedTrays]);

  // ── Accumulate products for load-more pagination ──
  const processedRef = useRef(null);

  // ── Reset page when filter criteria change ──
  useEffect(() => {
    if (prevFilterKey.current !== filterKey) {
      setPage(1);
      setAccumulated([]);
      setHasMore(true);
      processedRef.current = null;
      prevFilterKey.current = filterKey;
    }
  }, [filterKey]);

  useEffect(() => {
    if (!productsData?.data) return;
    // Avoid reprocessing the same data
    if (processedRef.current === productsData.data) return;
    processedRef.current = productsData.data;

    const raw = productsData.data;
    const items = Array.isArray(raw.data) ? raw.data
      : Array.isArray(raw.products) ? raw.products
      : Array.isArray(raw.list) ? raw.list
      : Array.isArray(raw) ? raw
      : [];

    // If API returns empty or null results, stop pagination
    if (!items.length) {
      setHasMore(false);
      return;
    }

    if (page === 1) {
      setAccumulated(items);
    } else {
      setAccumulated((prev) => [...prev, ...items]);
    }

    // Check if there are more pages
    const totalProducts = raw?.total || raw?.totalCount || 0;
    const totalPages = raw?.pages || 0;
    if (totalPages > 0) {
      setHasMore(page < totalPages);
    } else if (totalProducts > 0) {
      setHasMore((page === 1 ? items.length : accumulated.length + items.length) < totalProducts);
    } else {
      // If no total info, check if we got fewer items than limit
      setHasMore(items.length >= LIMIT);
    }
  }, [productsData, page]);

  // ── Infinite Scroll Observer ──
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    // Only observe when we have data loaded, more pages available, and not currently fetching
    if (!hasMore || productsFetching || !isFiltering) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !productsFetching) {
          setPage((p) => p + 1);
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [hasMore, productsFetching, isFiltering, accumulated]);

  const isLoggedIn = () => {
    const role = localStorage.getItem("shubhtalk_role");
    const token = role === "ASTROLOGER"
      ? localStorage.getItem("shubhtalk_astro_token")
      : localStorage.getItem("shubhtalk_customer_token");
    return !!token;
  };

  const handleAddToCart = async (e, item) => {
    e.stopPropagation();
    if (!isLoggedIn()) {
      localStorage.setItem("shubhtalk_redirect_after_login", window.location.pathname);
      navigate("/login?skip=welcome");
      return;
    }
    const productId = item?._id || item?.ID;
    if (!productId) { Toast.error("Unable to add — product ID missing"); return; }
    const firstVariant = getFirstVariant(item);
    const fvId = firstVariant?._id || firstVariant?.id || firstVariant?.skuCode || firstVariant?.sku;
    if (!fvId) { Toast.error("No variant available for this product"); return; }
    if (firstVariant?.stock === 0 || firstVariant?.inStock === false) { Toast.error("This variant is out of stock"); return; }
    try {
      await addToCart({ productId, variantId: fvId, skuCode: firstVariant?.skuCode || firstVariant?.sku || "", quantity: 1 }).unwrap();
      Toast.success(`${getTitle(item)} added to cart`);
    } catch (err) {
      Toast.error(err?.data?.message || "Failed to add to cart");
    }
  };

  const handleTabChange = (slug) => {
    setActiveTab(slug);
    setTraySlug("");
  };

  const handleSortChange = (val) => {
    setSort(val);
    setShowSortDropdown(false);
  };

  const clearFilters = () => {
    setSearch("");
    setActiveTab("all");
    setSort("");
    setTraySlug("");
    setShowSearch(false);
  };

  const handleViewAll = (tray) => {
    const slug = tray?.slug || tray?.display_title || tray?.title || "";
    if (slug) {
      setActiveTab(slug);
      setTraySlug(slug);
      setShowSearch(false);
      setSearch("");
      setSort("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // ── Render a tray section based on display_type ──
  const renderTray = (tray, index) => {
    const items = tray?.content || [];
    const title = tray?.display_title || tray?.title || "";
    const displayType = tray?.display_type || "";
    const showMore = tray?.show_more;

    if (!items.length) return null;

    // ── astromall-banner ──
    if (displayType === "astromall-banner") {
      return (
        <section key={index} className={styles.section}>
          <SectionHeader title={title || "TOP DEALS FOR YOU"} onViewAll={showMore ? () => handleViewAll(tray) : undefined} />
          <HScrollRow>
            {items.map((d, i) => (
              <div key={`${index}-${d.ID || i}`} className={styles.dealCard} onClick={() => navigate(`/product-details/${d.slug || d.ID}`, { state: d })}>
                <ProductImage src={getImg(d)} alt={getTitle(d)} />
                <div className={styles.dealBadges}>
                  {d.is_featured && <span className={styles.dealPopular}>Popular</span>}
                </div>
                <div className={styles.dealInfo}>
                  <h3>{getTitle(d)}</h3>
                  <p>{d.short_description || ""}</p>
                  <span>Starting at ₹{getPrice(d)} →</span>
                </div>
              </div>
            ))}
          </HScrollRow>
        </section>
      );
    }

    // ── browse-by-category ──
    if (displayType === "browse-by-category") {
      const showArrows = items.length > 7;
      return (
        <section key={index} className={styles.section}>
          <SectionHeader title={title || "BROWSE BY CATEGORY"} onViewAll={showMore ? () => navigate("/categories", { state: { categories: items } }) : undefined} />
          {showArrows ? (
            <HScrollRow>
              {items.map((c, i) => (
                <div key={`${index}-${c.ID || i}`} className={styles.catSlideCard} onClick={() => navigate(`/category/${c.slug || c.ID}`, { state: { categoryId: c.ID, name: c.name, imgUrl: c.imgUrl } })} style={{ cursor: "pointer" }}>
                  <ProductImage src={c.imgUrl || getImg(c)} alt={c.name || "Category"} />
                  <div className={styles.catOverlay}>
                    <h4>{c.name || "Category"}</h4>
                  </div>
                </div>
              ))}
            </HScrollRow>
          ) : (
            <div className={styles.hScrollRow}>
              {items.map((c, i) => (
                <div key={`${index}-${c.ID || i}`} className={styles.catSlideCard} onClick={() => navigate(`/category/${c.slug || c.ID}`, { state: { categoryId: c.ID, name: c.name, imgUrl: c.imgUrl } })} style={{ cursor: "pointer" }}>
                  <ProductImage src={c.imgUrl || getImg(c)} alt={c.name || "Category"} />
                  <div className={styles.catOverlay}>
                    <h4>{c.name || "Category"}</h4>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      );
    }

    // ── shop-by-purpose ──
    if (displayType === "shop-by-purpose") {
      const showArrows = items.length >= 7;
      return (
        <section key={index} className={styles.section}>
          <SectionHeader title={title || "SHOP BY PURPOSE"} onViewAll={showMore ? () => handleViewAll(tray) : undefined} />
          {showArrows ? (
            <HScrollRow>
              {items.map((item, i) => (
                <div key={`${index}-${item.ID || i}`} className={styles.purposeCard} onClick={() => navigate(`/purpose/${item.slug || item.title?.toLowerCase() || ""}`)}>
                  <ProductImage src={item.image_url || getImg(item)} alt={item.title || "Purpose"} />
                  <div className={styles.purposeOverlay}>
                    <h4>{item.title || ""}</h4>
                  </div>
                </div>
              ))}
            </HScrollRow>
          ) : (
            <div className={styles.hScrollRow}>
              {items.map((item, i) => (
                <div key={`${index}-${item.ID || i}`} className={styles.purposeCard} onClick={() => navigate(`/purpose/${item.slug || item.title?.toLowerCase() || ""}`)}>
                  <ProductImage src={item.image_url || getImg(item)} alt={item.title || "Purpose"} />
                  <div className={styles.purposeOverlay}>
                    <h4>{item.title || ""}</h4>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      );
    }

    // ── consult-to-expert-astrologer (static expert cards) ──
    if (displayType === "consult-to-expert-astrologer") {
      return (
        <section key={index} className={styles.section}>
          <SectionHeader title={title || "CONSULT NOW"} />
          <div className={styles.expertGrid}>
            {EXPERT_CARDS.map((e, i) => (
              <div key={i} className={styles.expertCard}>
                <h4>{e.title}</h4>
                <p>{e.sub}</p>
                <button className={styles.expertBtn}>{e.btn}</button>
              </div>
            ))}
          </div>
        </section>
      );
    }

    // ── product-slider (suggested, special combo, new arrivals, etc.) ──
    return (
      <section key={index} className={styles.section}>
        <SectionHeader title={title} onViewAll={showMore ? () => handleViewAll(tray) : undefined} />
        <HScrollRow>
          {items.map((s, i) => (
            <div key={`${index}-${s.ID || i}`} className={styles.prodCard} onClick={() => navigate(`/product-details/${s.slug || s.ID}`, { state: s })} style={{ cursor: "pointer" }}>
              {s.is_featured && <span className={styles.sugBadge}>Featured</span>}
              {!s.is_featured && <span className={styles.sugBadge}>Suggested</span>}
              <div className={styles.prodImg}><ProductImage src={getImg(s)} alt={getTitle(s)} /></div>
              <div className={styles.prodBody}>
                {s.brand && <p className={styles.prodConsultant}>🏷 {getBrand(s)}</p>}
                <h4>{getTitle(s)}</h4>
                <p className={styles.prodDesc}>{s.short_description || ""}</p>
                <p className={styles.prodPrice}>₹{getPrice(s)} {getOldPrice(s) > getPrice(s) ? <s>₹{getOldPrice(s)}</s> : null}</p>
                <button className={styles.addCartBtn} onClick={(e) => handleAddToCart(e, s)}>+ Add to cart</button>
              </div>
            </div>
          ))}
        </HScrollRow>
      </section>
    );
  };

  const isLoading = isFiltering ? (productsLoading && page === 1) : (homepageLoading && homePage === 1);

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.headerIconBtn} onClick={() => { if (isFiltering) { clearFilters(); } else { navigate("/"); } }} aria-label="Go back">
            <FiChevronLeft />
          </button>
          <span className={styles.headerTitle}>ShubhMall</span>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.headerIconBtn} onClick={() => setShowSearch((v) => !v)} aria-label="Search">
            <FiSearch />
          </button>
          <AstromallCartSidebar />
        </div>
      </div>

      {/* ── Search Bar (toggle) ── */}
      {showSearch && (
        <div className={styles.searchBar}>
          <input
            autoFocus
            placeholder="Search poojas, products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className={styles.searchClear} onClick={() => setSearch("")} aria-label="Clear search">
              <FiX />
            </button>
          )}
        </div>
      )}

      {/* ── Category Tabs ── */}
      <div className={styles.tabs}>
        {categoryTabs.map((t) => (
          <button key={t.slug} className={`${styles.tab} ${activeTab === t.slug ? styles.tabActive : ""}`} onClick={() => handleTabChange(t.slug)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Sort & Filter Bar ── */}
      {isFiltering && (
        <div className={styles.filterBar}>
          <div className={styles.filterInfo}>
            <button className={styles.clearFilterBtn} onClick={clearFilters}>Clear filters</button>
          </div>
          <div className={styles.sortWrap}>
            <button className={styles.sortBtn} onClick={() => setShowSortDropdown((v) => !v)}>
              Sort: {SORT_OPTIONS.find((o) => o.value === sort)?.label || "Relevance"} <FiChevronDown />
            </button>
            {showSortDropdown && (
              <div className={styles.sortDropdown}>
                {SORT_OPTIONS.map((o) => (
                  <button key={o.value} className={`${styles.sortOption} ${sort === o.value ? styles.sortOptionActive : ""}`} onClick={() => handleSortChange(o.value)}>
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Loading State ── */}
      {isLoading && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#999" }}>Loading...</div>
      )}

      {/* ── Products Grid ── */}
      {isFiltering && !productsLoading && (
        <>
          {accumulated.length > 0 ? (
            <div className={styles.filteredGrid}>
              {accumulated.map((item, i) => (
                <div key={`${item._id || item.ID}-${i}`} className={styles.filteredCard} onClick={() => navigate(`/product-details/${item.slug || item.ID}`, { state: item })}>
                  {item.is_featured && <span className={styles.sugBadge}>Featured</span>}
                  <div className={styles.filteredImg}>
                    <ProductImage src={getImg(item)} alt={getTitle(item)} />
                  </div>
                  <div className={styles.prodBody}>
                    {item.brand && <p className={styles.prodConsultant}>🏷 {getBrand(item)}</p>}
                    <h4>{getTitle(item)}</h4>
                    <p className={styles.prodDesc}>{item.short_description || ""}</p>
                    <p className={styles.prodPrice}>₹{getPrice(item)} {getOldPrice(item) > getPrice(item) ? <s>₹{getOldPrice(item)}</s> : null}</p>
                    <button className={styles.addCartBtn} onClick={(e) => handleAddToCart(e, item)}>+ Add to cart</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !productsFetching && page === 1 && (
              <div className={styles.emptyState}>
                <p>No products found.</p>
                {isFiltering && <button className={styles.clearFilterBtn} onClick={clearFilters}>Clear filters</button>}
              </div>
            )
          )}

          {/* ── Infinite Scroll Sentinel ── */}
          {hasMore && (
            <div ref={loadMoreRef} className={styles.loadMoreWrap}>
              {productsFetching && <p style={{ textAlign: "center", color: "#999" }}>Loading more...</p>}
            </div>
          )}
        </>
      )}

      {/* ── Homepage Trays (default view — no filters active) ── */}
      {!isFiltering && !homepageLoading && Array.isArray(trays) && trays.length > 0 && (
        <>
          {trays.map((tray, i) => renderTray(tray, `${tray.ID || tray._id || ''}_${i}`))}

          {/* Homepage Infinite Scroll Sentinel */}
          {homeHasMore && (
            <div ref={homeLoadMoreRef} className={styles.loadMoreWrap}>
              {homepageFetching && <p style={{ textAlign: "center", color: "#999" }}>Loading more...</p>}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EPooja;
