import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, Download } from "lucide-react";
import styles from "./MallOrderDetail.module.scss";
import { DefaultImages } from "../../../utils/appImages";
import ProductImage from "../../../component/UI/ProductImage";
import { useGetMallOrderInvoiceMutation } from "../../../redux/api/mallOrder/mallOrderApi";
import Toast from "../../../component/toast";
import { openInvoice } from "../../../utils/helper/openInvoice";

const GST_RATE = 0.18;

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });
};

const MallOrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const order = location.state?.order || null;
  const [getMallOrderInvoice] = useGetMallOrderInvoiceMutation();
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  const handleBack = () => {
    navigate("/profile", { state: { activeTab: "ShubhMall History" } });
  };

  const items = order?.items || [];
  const subtotal = items.reduce((sum, item) => {
    const variants = item.variants || [];
    if (variants.length > 0) {
      return sum + variants.reduce((vSum, v) => vSum + (v.total_price || v.price * (v.quantity || 1)), 0);
    }
    return sum + (item.subtotal || item.price * (item.quantity || 1));
  }, 0);
  const totalVariantCount = items.reduce((c, itm) => c + (itm.variants?.length || 1), 0);
  const gst = order?.gst_amount ?? Math.round(subtotal * GST_RATE * 100) / 100;
  const total = order?.final_amount || order?.total_amount || Math.round((subtotal + gst) * 100) / 100;
  const shipping = order?.shipping_address || {};
  const orderNum = order?.order_number || order?.ID || orderId;
  const purchasedOn = order?.createdAt || order?.orderDate || order?.purchasedOn;
  const status = order?.order_status || "pending";

  if (!order) {
    return (
      <div className={styles.container}>
        <div className={styles.topSpacer} />
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={handleBack}><ChevronLeft size={22} /></button>
          <div><h2 className={styles.title}>Order Details</h2></div>
        </div>
        <div className={styles.loading}>Order not found</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.topSpacer} />
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={handleBack}><ChevronLeft size={22} /></button>
        <div>
          <h2 className={styles.title}>Order #{orderNum}</h2>
          <p className={styles.subtitle}>{totalVariantCount} item{totalVariantCount !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className={styles.body}>
        {/* Order Details */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>ORDER DETAILS</h3>
          <div className={styles.detailRow}>
            <span className={styles.label}>Order ID</span>
            <span className={styles.value}>#{orderNum}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.label}>Purchased on</span>
            <span className={styles.value}>{formatDate(purchasedOn)}</span>
          </div>

          {/* Delivery Address */}
          {shipping.name && (
            <>
              <div className={styles.addressBlock}>
                <span className={styles.label}>Delivery Address</span>
                <p className={styles.addressText}>
                  {[shipping.address, shipping.city, shipping.state].filter(Boolean).join(", ")}
                  {shipping.pincode ? ` ${shipping.pincode}` : ""}
                </p>
                <p className={styles.addressName}>{shipping.name}{shipping.phone ? ` · ${shipping.phone}` : ""}</p>
              </div>
            </>
          )}
        </section>

        {/* Product Details */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>PRODUCTS DETAILS</h3>
          <div className={styles.productList}>
            {items.flatMap((item, idx) => {
              const variants = item.variants || [];
              if (variants.length > 0) {
                return variants.map((variant, vIdx) => {
                  const img = variant.images?.[0] || "";
                  const name = item.product_name || "Product";
                  const qty = variant.quantity || 1;
                  const price = variant.price || 0;
                  const lineTotal = variant.total_price || price * qty;
                  const attrText = variant.attributes?.length
                    ? variant.attributes.map((a) => a.value).join(" / ")
                    : variant.title || "";
                  return (
                    <div key={`${item.product_id || idx}-${variant._id || vIdx}`} className={styles.productCard}>
                      <div className={styles.productImg}>
                        <ProductImage src={img} alt={name} />
                      </div>
                      <div className={styles.productInfo}>
                        <div className={styles.nameRow}>
                          <h4>{name}</h4>
                          <span className={styles.itemId}>#{variant.skuCode || item.product_id}</span>
                        </div>
                        <div className={styles.meta}>
                          <span className={styles.chip}>Qty: {qty}</span>
                          {attrText && <span className={styles.chip}>{attrText}</span>}
                        </div>
                        <p className={styles.price}>
                          ₹{lineTotal.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}{" "}
                          <span className={styles.taxNote}>Incl. of all taxes</span>
                        </p>
                      </div>
                    </div>
                  );
                });
              }
              // Fallback: no variants
              const img = item.product_image || "";
              const name = item.product_name || "Product";
              const qty = item.quantity || 1;
              const price = item.price || 0;
              const lineTotal = item.subtotal || price * qty;
              return [(
                <div key={item.product_id || idx} className={styles.productCard}>
                  <div className={styles.productImg}>
                    <ProductImage src={img} alt={name} />
                  </div>
                  <div className={styles.productInfo}>
                    <div className={styles.nameRow}>
                      <h4>{name}</h4>
                      <span className={styles.itemId}>#{item.product_id}</span>
                    </div>
                    <div className={styles.meta}>
                      <span className={styles.chip}>Qty: {qty}</span>
                    </div>
                    <p className={styles.price}>
                      ₹{lineTotal.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}{" "}
                      <span className={styles.taxNote}>Incl. of all taxes</span>
                    </p>
                  </div>
                </div>
              )];
            })}
          </div>
        </section>

        {/* Price Breakdown */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>PRICE BREAKDOWN</h3>
          {items.flatMap((item, idx) => {
            const variants = item.variants || [];
            if (variants.length > 0) {
              return variants.map((variant, vIdx) => (
                <div key={`${idx}-${vIdx}`} className={styles.priceRow}>
                  <span className={styles.priceLabel}>{item.product_name || "Product"}{variants.length > 1 ? ` (${variant.skuCode || vIdx + 1})` : ""} × {variant.quantity || 1}</span>
                  <span>₹{(variant.total_price || variant.price * (variant.quantity || 1)).toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}</span>
                </div>
              ));
            }
            return [(
              <div key={idx} className={styles.priceRow}>
                <span className={styles.priceLabel}>{item.product_name || "Product"}</span>
                <span>₹{(item.subtotal || item.price * (item.quantity || 1)).toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}</span>
              </div>
            )];
          })}
          <div className={styles.priceRow}>
            <span>GST</span>
            <span>₹{gst.toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}</span>
          </div>
          <div className={`${styles.priceRow} ${styles.totalRow}`}>
            <span>Total Amount</span>
            <span>₹{total.toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}</span>
          </div>

          {status.toLowerCase() === "delivered" && (
          <button className={styles.downloadBtn} disabled={invoiceLoading} onClick={async () => {
            setInvoiceLoading(true);
            try {
              const data = await getMallOrderInvoice(orderId).unwrap();
              const pdfUrl = data?.data || data?.pdfUrl || data?.url;
              if (pdfUrl) {
                openInvoice(pdfUrl);
              }
            } catch {
              Toast.error("Invoice not available for this order");
            } finally {
              setInvoiceLoading(false);
            }
          }}>
            <Download size={16} /> {invoiceLoading ? "Loading..." : "Download Invoice"}
          </button>
          )}
        </section>
      </div>

      {/* Bottom Bar */}
      {/* <div className={styles.bottomBar}>
        <button className={styles.orderAgainBtn}>Order Again</button>
      </div> */}
    </div>
  );
};

export default MallOrderDetail;
