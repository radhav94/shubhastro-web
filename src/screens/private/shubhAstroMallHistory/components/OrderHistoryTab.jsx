import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Filter, ArrowUpDown, X } from "lucide-react";
import { useGetMallOrderHistoryQuery } from "../../../../redux/api/mallOrder/mallOrderApi";
import styles from "./OrderHistoryTab.module.scss";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "amount_high", label: "Price: High to Low" },
  { value: "amount_low", label: "Price: Low to High" },
];

const ORDER_STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "", label: "All Payments" },
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
  { value: "cod_pending", label: "COD Pending" },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: "", label: "All Methods" },
  { value: "online", label: "Online" },
  { value: "cod", label: "Cash on Delivery" },
];

const OrderHistoryTab = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filters, setFilters] = useState({
    order_status: "",
    payment_status: "",
    payment_method: "",
  });

  const sortRef = useRef(null);
  const filterRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setShowSortMenu(false);
      if (filterRef.current && !filterRef.current.contains(e.target)) setShowFilterMenu(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const queryParams = {
    page,
    limit: 10,
    sort,
    ...(filters.order_status && { order_status: filters.order_status }),
    ...(filters.payment_status && { payment_status: filters.payment_status }),
    ...(filters.payment_method && { payment_method: filters.payment_method }),
  };

  const { data: apiResponse, isLoading, isFetching, error } =
    useGetMallOrderHistoryQuery(queryParams);

  // API shape: { success, data: [...orders], pagination: { page, limit, total, pages } }
  const orders = apiResponse?.data || [];
  const pagination = apiResponse?.pagination;
  const totalOrders = pagination?.total || orders.length;

  // Group orders by year
  const ordersByYear = orders.reduce((acc, order) => {
    const date = order.createdAt || order.orderDate || order.purchasedOn;
    const year = date ? new Date(date).getFullYear() : new Date().getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push({ ...order, year });
    return acc;
  }, {});

  const sortedYears = Object.keys(ordersByYear).sort((a, b) =>
    sort === "oldest" ? a - b : b - a
  );

  const handleOrderClick = (orderId, order) => {
    navigate(`/mall-order/${orderId}`, { state: { order } });
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ order_status: "", payment_status: "", payment_method: "" });
    setPage(1);
  };

  if (isLoading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.loading}>Loading orders...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.empty}>Failed to load orders</div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.topBar}>
        <span className={styles.orderCount}>{totalOrders} Orders</span>
        <div className={styles.actions}>
          {/* Filter */}
          <div className={styles.dropdownWrap} ref={filterRef}>
            <button
              className={`${styles.actionBtn} ${activeFilterCount > 0 ? styles.activeFilter : ""}`}
              onClick={() => { setShowFilterMenu((v) => !v); setShowSortMenu(false); }}
            >
              <Filter size={14} />
              <span>Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}</span>
            </button>
            {showFilterMenu && (
              <div className={styles.dropdown}>
                <div className={styles.dropdownHeader}>
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <button className={styles.clearBtn} onClick={clearFilters}>
                      Clear all
                    </button>
                  )}
                </div>

                <label className={styles.filterLabel}>Order Status</label>
                <div className={styles.chipGroup}>
                  {ORDER_STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      className={`${styles.filterChip} ${filters.order_status === opt.value ? styles.selected : ""}`}
                      onClick={() => handleFilterChange("order_status", opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <label className={styles.filterLabel}>Payment Status</label>
                <div className={styles.chipGroup}>
                  {PAYMENT_STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      className={`${styles.filterChip} ${filters.payment_status === opt.value ? styles.selected : ""}`}
                      onClick={() => handleFilterChange("payment_status", opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <label className={styles.filterLabel}>Payment Method</label>
                <div className={styles.chipGroup}>
                  {PAYMENT_METHOD_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      className={`${styles.filterChip} ${filters.payment_method === opt.value ? styles.selected : ""}`}
                      onClick={() => handleFilterChange("payment_method", opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sort */}
          <div className={styles.dropdownWrap} ref={sortRef}>
            <button
              className={styles.actionBtn}
              onClick={() => { setShowSortMenu((v) => !v); setShowFilterMenu(false); }}
            >
              <ArrowUpDown size={14} />
              <span>Sort By</span>
            </button>
            {showSortMenu && (
              <div className={styles.dropdown}>
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className={`${styles.dropdownItem} ${sort === opt.value ? styles.selected : ""}`}
                    onClick={() => { setSort(opt.value); setPage(1); setShowSortMenu(false); }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className={styles.activeFilters}>
          {filters.order_status && (
            <span className={styles.activeChip}>
              {ORDER_STATUS_OPTIONS.find((o) => o.value === filters.order_status)?.label}
              <X size={12} onClick={() => handleFilterChange("order_status", "")} />
            </span>
          )}
          {filters.payment_status && (
            <span className={styles.activeChip}>
              {PAYMENT_STATUS_OPTIONS.find((o) => o.value === filters.payment_status)?.label}
              <X size={12} onClick={() => handleFilterChange("payment_status", "")} />
            </span>
          )}
          {filters.payment_method && (
            <span className={styles.activeChip}>
              {PAYMENT_METHOD_OPTIONS.find((o) => o.value === filters.payment_method)?.label}
              <X size={12} onClick={() => handleFilterChange("payment_method", "")} />
            </span>
          )}
        </div>
      )}

      {isFetching && !isLoading && (
        <div className={styles.fetchingBar}>Updating...</div>
      )}

      {sortedYears.map((year) => (
        <div key={year} className={styles.yearGroup}>
          <p className={styles.yearLabel}>{year}</p>
          {ordersByYear[year].map((order) => {
            const orderId = order._id;
            const items = order.items || [];
            const firstItem = items[0] || {};
            const productName = firstItem.product_name || "Product";
            const qty = firstItem.quantity || 1;
            const price = order.final_amount || order.total_amount || 0;
            const itemCount = items.length;

            const orderDate = order.createdAt || order.orderDate || order.purchasedOn;
            const formattedDate = orderDate
              ? new Date(orderDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })
              : "";

            // Collect first image from each item
            const itemImages = items.map((itm) => {
              const raw = itm.product_image || (itm.images?.length ? itm.images[0] : null) || itm.image || "";
              if (typeof raw === "string") return raw;
              if (raw && typeof raw === "object") return raw.original || raw.small || raw.url || raw.src || "";
              return "";
            }).filter(Boolean);

            return (
              <div
                key={orderId}
                className={styles.orderCard}
                onClick={() => handleOrderClick(orderId, order)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && handleOrderClick(orderId, order)}
              >
                {/* Top row: order number + price + arrow */}
                <div className={styles.cardTopRow}>
                  <span className={styles.orderNumber}>#{order.order_number || ""}</span>
                  <div className={styles.priceArrow}>
                    <span className={styles.price}>₹{price}</span>
                    <span className={styles.arrowCircle}>›</span>
                  </div>
                </div>

                <div className={styles.cardDivider} />

                {/* Status + date */}
                <div className={styles.statusSection}>
                  <p className={styles.statusLabel}>
                    {order.order_status || "Pending"}
                    {order.order_status === "completed" || order.order_status === "delivered" ? " ✅" : ""}
                  </p>
                  {formattedDate && (
                    <p className={styles.orderDate}>Placed at {formattedDate}</p>
                  )}
                </div>

                {/* Item images row */}
                {itemImages.length > 0 && (
                  <div className={styles.itemImagesRow}>
                    {itemImages.map((src, i) => (
                      <div key={i} className={styles.itemThumb}>
                        <img src={src} alt={`Item ${i + 1}`} />
                      </div>
                    ))}
                  </div>
                )}

                <div className={styles.cardFooter}>
                  <button
                    className={styles.reorderBtn}
                    onClick={(e) => e.stopPropagation()}
                  >
                    Order Again
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {orders.length === 0 && (
        <div className={styles.empty}>
          <p>No orders found</p>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className={styles.pagination}>
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className={styles.pageBtn}
          >
            Previous
          </button>
          <span className={styles.pageInfo}>
            Page {page} of {pagination.pages}
          </span>
          <button
            disabled={page >= pagination.pages}
            onClick={() => setPage((p) => p + 1)}
            className={styles.pageBtn}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderHistoryTab;
