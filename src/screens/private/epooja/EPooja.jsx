import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./EPooja.module.scss";
import { FiChevronLeft, FiChevronRight, FiSearch, FiX, FiChevronDown } from "react-icons/fi";
import Toast from "../../../component/toast";
import { useGetAstromallPageDataQuery, useAddToCartMutation, useGetProductsQuery, useGetProductCategoriesQuery } from "../../../redux/api/astromall/epooja/epoojaBookingApi";
import AstromallCartSidebar from "./components/AstromallCartSidebar";

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
const getImg = (item) =>
  item?.banner_image?.original ||
  item?.banner_image?.small ||
  (item?.images?.length ? item.images[0] : null) ||
  item?.imgUrl ||
  item?.image ||
  item?.thumbnail ||
  "https://images.unsplash.com/photo-1604608672516-f1b9b1d37076?w=400&q=80";
const getPrice = (item) => item?.price || item?.actualPrice || item?.selling_price || 0;
const getOldPrice = (item) => item?.mrp || item?.originalPrice || item?.compare_price || 0;
const getTitle = (item) => item?.title || item?.name || "Product";
const getBrand = (item) => {
  const b = item?.brand;
  if (!b) return "";
  return typeof b === "string" ? b : b.name || "";
};

// ═══════════════════════════════════════
// MAIN
// ═══════════════════════════════════════
const EPooja = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [sort, setSort] = useState("");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [page, setPage] = useState(1);
  const [accumulated, setAccumulated] = useState([]);
  const prevFilterKey = useRef("");
  const LIMIT = 10;

  const debouncedSearch = useDebounce(search, 500);

  // Determine if filters are active (search or non-"all" tab or sort)
  const isFiltering = debouncedSearch || activeTab !== "all" || sort;

  // A key that changes whenever the filter criteria (not page) change
  const filterKey = `${debouncedSearch}|${activeTab}|${sort}`;

  // ── Build filter params ──
  const filterParams = {
    page,
    limit: LIMIT,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(activeTab !== "all" && { category: activeTab }),
    ...(sort && { sort }),
  };

  // ── API Calls ──
  const { data: apiData, isLoading: homepageLoading } = useGetAstromallPageDataQuery({ page: 1, limit: 20 });
  const { data: productsData, isLoading: productsLoading, isFetching: productsFetching } = useGetProductsQuery(
    filterParams,
    { skip: !isFiltering, refetchOnMountOrArgChange: true }
  );
  const { data: categoriesData } = useGetProductCategoriesQuery();
  const [addToCart] = useAddToCartMutation();

  // ── Build category tabs from API ──
  const categoryTabs = (() => {
    const raw = categoriesData?.data?.categories || categoriesData?.data || [];
    const list = Array.isArray(raw) ? raw : [];
    const mapped = list.map((c) => ({
      label: c.name || c.title || "",
      slug: c.slug || c._id || c.ID || "",
    })).filter((t) => t.label && t.slug);
    return [ALL_TAB, ...mapped];
  })();

  const trays = apiData?.data?.list || apiData?.data || [];

  // ── Accumulate products for load-more pagination ──
  const processedRef = useRef(null);

  // ── Reset page when filter criteria change ──
  useEffect(() => {
    if (prevFilterKey.current !== filterKey) {
      setPage(1);
      setAccumulated([]);
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
    if (page === 1) {
      setAccumulated(items);
    } else {
      setAccumulated((prev) => [...prev, ...items]);
    }
  }, [productsData, page]);

  const totalProducts = productsData?.data?.total || productsData?.data?.totalCount || 0;
  const totalPages = productsData?.data?.pages || 0;
  const hasMore = totalPages > 1 ? page < totalPages : accumulated.length < totalProducts;

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
    const productId = item?._id;
    if (!productId) { Toast.error("Unable to add — product ID missing"); return; }
    try {
      await addToCart({ productId, quantity: 1 }).unwrap();
      Toast.success(`${getTitle(item)} added to cart`);
    } catch (err) {
      Toast.error(err?.data?.message || "Failed to add to cart");
    }
  };

  const handleTabChange = (slug) => {
    setActiveTab(slug);
  };

  const handleSortChange = (val) => {
    setSort(val);
    setShowSortDropdown(false);
  };

  const clearFilters = () => {
    setSearch("");
    setActiveTab("all");
    setSort("");
    setShowSearch(false);
  };

  const handleViewAll = (tray) => {
    const slug = tray?.slug || tray?.display_title || tray?.title || "";
    if (slug) {
      setActiveTab(slug);
      setShowSearch(false);
      setSearch("");
      setSort("");
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
        <section key={tray.ID || index} className={styles.section}>
          <SectionHeader title={title || "TOP DEALS FOR YOU"} onViewAll={showMore ? () => handleViewAll(tray) : undefined} />
          <HScrollRow>
            {items.map((d, i) => (
              <div key={d.ID || i} className={styles.dealCard} onClick={() => navigate(`/product-details/${d.slug || d.ID}`, { state: d })}>
                <img src={getImg(d)} alt={getTitle(d)} />
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
      return (
        <section key={tray.ID || index} className={styles.section}>
          <SectionHeader title={title || "BROWSE BY CATEGORY"} onViewAll={showMore ? () => navigate("/categories") : undefined} />
          <HScrollRow>
            {items.map((c, i) => (
              <div key={c.ID || i} className={styles.catSlideCard} onClick={() => navigate(`/category/${c.slug || c.ID}`, { state: { categoryId: c.ID, name: c.name, imgUrl: c.imgUrl } })} style={{ cursor: "pointer" }}>
                <img src={c.imgUrl || getImg(c)} alt={c.name || "Category"} />
                <div className={styles.catOverlay}>
                  <h4>{c.name || "Category"}</h4>
                </div>
              </div>
            ))}
          </HScrollRow>
        </section>
      );
    }

    // ── shop-by-purpose ──
    if (displayType === "shop-by-purpose") {
      const showArrows = items.length >= 7;
      return (
        <section key={tray.ID || index} className={styles.section}>
          <SectionHeader title={title || "SHOP BY PURPOSE"} onViewAll={showMore ? () => handleViewAll(tray) : undefined} />
          {showArrows ? (
            <HScrollRow>
              {items.map((item, i) => (
                <div key={item.ID || i} className={styles.purposeCard} onClick={() => navigate(`/purpose/${item.slug || item.title?.toLowerCase() || ""}`)}>
                  <img src={item.image_url || getImg(item)} alt={item.title || "Purpose"} />
                  <div className={styles.purposeOverlay}>
                    <h4>{item.title || ""}</h4>
                  </div>
                </div>
              ))}
            </HScrollRow>
          ) : (
            <div className={styles.hScrollRow}>
              {items.map((item, i) => (
                <div key={item.ID || i} className={styles.purposeCard} onClick={() => navigate(`/purpose/${item.slug || item.title?.toLowerCase() || ""}`)}>
                  <img src={item.image_url || getImg(item)} alt={item.title || "Purpose"} />
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
        <section key={tray.ID || index} className={styles.section}>
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
      <section key={tray.ID || index} className={styles.section}>
        <SectionHeader title={title} onViewAll={showMore ? () => handleViewAll(tray) : undefined} />
        <HScrollRow>
          {items.map((s, i) => (
            <div key={s.ID || i} className={styles.prodCard} onClick={() => navigate(`/product-details/${s.slug || s.ID}`, { state: s })} style={{ cursor: "pointer" }}>
              {s.is_featured && <span className={styles.sugBadge}>Featured</span>}
              {!s.is_featured && <span className={styles.sugBadge}>Suggested</span>}
              <div className={styles.prodImg}><img src={getImg(s)} alt={getTitle(s)} /></div>
              <div className={styles.prodBody}>
                {getBrand(s) && <p className={styles.prodConsultant}>🏷 {getBrand(s)}</p>}
                <h4>{getTitle(s)}</h4>
                <p className={styles.prodDesc}>{s.short_description || ""}</p>
                <p className={styles.prodPrice}>₹{getPrice(s)} {getOldPrice(s) ? <s>₹{getOldPrice(s)}</s> : null}</p>
                <button className={styles.addCartBtn} onClick={(e) => handleAddToCart(e, s)}>+ Add to cart</button>
              </div>
            </div>
          ))}
        </HScrollRow>
      </section>
    );
  };

  const isLoading = isFiltering ? productsLoading : homepageLoading;

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.headerIconBtn} onClick={() => { if (isFiltering) { clearFilters(); } else { navigate("/"); } }} aria-label="Go back">
            <FiChevronLeft />
          </button>
          <span className={styles.headerTitle}>AstroMall</span>
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

      {/* ── Sort & Filter Bar (visible when filtering) ── */}
      {isFiltering && (
        <div className={styles.filterBar}>
          <div className={styles.filterInfo}>
            {totalProducts > 0 && <span className={styles.resultCount}>{totalProducts} product{totalProducts !== 1 ? "s" : ""} found</span>}
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

      {/* ── Filtered Products Grid ── */}
      {isFiltering && !productsLoading && (
        <>
          {accumulated.length > 0 ? (
            <div className={styles.filteredGrid}>
              {accumulated.map((item, i) => (
                <div key={item._id || item.ID || i} className={styles.filteredCard} onClick={() => navigate(`/product-details/${item.slug || item.ID}`, { state: item })}>
                  {item.is_featured && <span className={styles.sugBadge}>Featured</span>}
                  <div className={styles.filteredImg}>
                    <img src={getImg(item)} alt={getTitle(item)} />
                  </div>
                  <div className={styles.prodBody}>
                    {getBrand(item) && <p className={styles.prodConsultant}>🏷 {getBrand(item)}</p>}
                    <h4>{getTitle(item)}</h4>
                    <p className={styles.prodDesc}>{item.short_description || ""}</p>
                    <p className={styles.prodPrice}>
                      ₹{getPrice(item)} {getOldPrice(item) ? <s>₹{getOldPrice(item)}</s> : null}
                    </p>
                    <button className={styles.addCartBtn} onClick={(e) => handleAddToCart(e, item)}>+ Add to cart</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>No products found for your search.</p>
              <button className={styles.clearFilterBtn} onClick={clearFilters}>Clear filters</button>
            </div>
          )}

          {/* ── Load More ── */}
          {hasMore && (
            <div className={styles.loadMoreWrap}>
              <button className={styles.loadMoreBtn} onClick={() => setPage((p) => p + 1)} disabled={productsFetching}>
                {productsFetching ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Homepage Trays (default view) ── */}
      {!isFiltering && !homepageLoading && Array.isArray(trays) && trays.length > 0 && trays.map((tray, i) => renderTray(tray, i))}
    </div>
  );
};

export default EPooja;
