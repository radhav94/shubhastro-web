import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Filter, ArrowUpDown, X, ShoppingBag, CreditCard, Clock, CheckCircle, Hash, FileText } from "lucide-react";
import { useGetMallOrderHistoryQuery, useGetMallOrderInvoiceMutation } from "../../../../redux/api/mallOrder/mallOrderApi";
import Toast from "../../../../component/toast";
import { openInvoice } from "../../../../utils/helper/openInvoice";
import styles from "./OrderHistoryTab.module.scss";
import ProductImage from "../../../../component/UI/ProductImage";

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

  const [getMallOrderInvoice] = useGetMallOrderInvoiceMutation();
  const [invoiceLoadingId, setInvoiceLoadingId] = useState(null);

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

            // First item image
            const getFirstImage = () => {
              const variants = firstItem.variants || [];
              if (variants.length > 0) {
                const img = variants[0]?.images?.[0] || "";
                if (typeof img === "string") return img;
                if (img && typeof img === "object") return img.original || img.small || img.url || img.src || "";
              }
              const raw = firstItem.product_image || (firstItem.images?.length ? firstItem.images[0] : null) || firstItem.image || "";
              if (typeof raw === "string") return raw;
              if (raw && typeof raw === "object") return raw.original || raw.small || raw.url || raw.src || "";
              return "";
            };

            const firstImage = getFirstImage();
            const sku = firstItem.sku || firstItem.product_sku || "";
            const mrp = firstItem.mrp || firstItem.original_price || 0;
            const itemPrice = firstItem.price || firstItem.selling_price || price;
            const discount = mrp > itemPrice ? Math.round(((mrp - itemPrice) / mrp) * 100) : 0;

            const orderStatus = order.order_status || "pending";
            const paymentStatus = order.payment_status || "pending";
            const paymentMethod = order.payment_method || "";
            const orderNumber = order.order_number || "";
            const displayOrderId = order.order_id || order.orderId || "";

            return (
              <div
                key={orderId}
                className={styles.orderCard}
                onClick={() => handleOrderClick(orderId, order)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && handleOrderClick(orderId, order)}
              >
                {/* ── Card Header ── */}
                <div className={styles.cardHeader}>
                  <div className={styles.headerLeft}>
                    <span className={styles.orderBagIcon}><ShoppingBag size={16} /></span>
                    <div>
                      <span className={styles.orderNumber}>ORD-{orderNumber}</span>
                      {formattedDate && <p className={styles.orderDate}>Placed on {formattedDate}</p>}
                    </div>
                  </div>
                  {orderStatus.toLowerCase() === "delivered" && (
                  <button
                    className={`${styles.downloadInvoiceBtn} ${invoiceLoadingId === orderId ? styles.downloadLoading : ""}`}
                    disabled={invoiceLoadingId === orderId}
                    onClick={async (e) => {
                      e.stopPropagation();
                      setInvoiceLoadingId(orderId);
                      try {
                        const data = await getMallOrderInvoice(orderId).unwrap();
                        const pdfUrl = data?.data || data?.pdfUrl || data?.url;
                        if (pdfUrl) {
                          openInvoice(pdfUrl);
                        } else {
                          Toast.error("Invoice not available");
                        }
                      } catch (err) {
                        Toast.error("Invoice not available for this order");
                      } finally {
                        setInvoiceLoadingId(null);
                      }
                    }}
                  >
                    <FileText size={16} />
                    {invoiceLoadingId === orderId ? "Loading..." : "Download Invoice"}
                  </button>
                  )}
                  <div className={styles.headerRight}>
                    <span className={`${styles.statusChip} ${styles[`status_${orderStatus}`]}`}>
                      {orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1)} {(orderStatus === "confirmed" || orderStatus === "completed") && <CheckCircle size={11} />}
                    </span>
                    <span className={`${styles.statusChip} ${styles[`pay_${paymentStatus}`]}`}>
                      {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)} {paymentStatus === "paid" && <CheckCircle size={11} />}
                    </span>
                    <span className={styles.headerPrice}>₹{price}</span>
                    <span className={styles.arrowCircle}>›</span>
                  </div>
                </div>

                {/* ── Card Body ── */}
                <div className={styles.cardBody}>
                  <div className={styles.productImg}>
                    <ProductImage src={firstImage} alt={productName} />
                  </div>
                  <div className={styles.productInfo}>
                    <h4 className={styles.productName}>{productName}{itemCount > 1 ? ` +${itemCount - 1} more` : ""}</h4>
                    {sku && <p className={styles.skuText}>SKU: {sku}</p>}
                    <p className={styles.qtyText}>Qty: {qty}</p>
                    <div className={styles.priceRow}>
                      <span className={styles.sellingPrice}>₹{itemPrice}</span>
                      {mrp > itemPrice && <span className={styles.mrpPrice}>₹{mrp}</span>}
                      {discount > 0 && <span className={styles.discountBadge}>{discount}% OFF</span>}
                    </div>
                  </div>
                  <div className={styles.detailsCol}>
                    {paymentMethod && (
                      <div className={styles.detailRow}>
                        <span className={styles.detailIcon}><CreditCard size={13} /></span>
                        <span className={styles.detailLabel}>Payment Method</span>
                        <span className={styles.detailValue}>{paymentMethod.toUpperCase()}</span>
                      </div>
                    )}
                    <div className={styles.detailRow}>
                      <span className={styles.detailIcon}><Clock size={13} /></span>
                      <span className={styles.detailLabel}>Payment Status</span>
                      <span className={`${styles.detailValue} ${styles[`payVal_${paymentStatus}`]}`}>{paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailIcon}><CheckCircle size={13} /></span>
                      <span className={styles.detailLabel}>Order Status</span>
                      <span className={`${styles.detailValue} ${styles[`statusVal_${orderStatus}`]}`}>{orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1)}</span>
                    </div>
                    {displayOrderId && (
                      <div className={styles.detailRow}>
                        <span className={styles.detailIcon}><Hash size={13} /></span>
                        <span className={styles.detailLabel}>Order ID</span>
                        <span className={styles.detailValue}>{displayOrderId}</span>
                      </div>
                    )}
                  </div>
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
