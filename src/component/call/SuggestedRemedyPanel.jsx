import { IoClose } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import styles from "./SuggestedRemedyPanel.module.scss";

const SuggestedRemedyPanel = ({ isOpen, onClose, remedyData, onProductClick }) => {
  const navigate = useNavigate();
  if (!isOpen) return null;

  const entries = remedyData?.entries || [];
  // Fallback: if no grouped entries, build one from flat arrays (backward compat)
  const displayEntries = entries.length > 0
    ? entries
    : (remedyData?.suggestedProducts?.length || remedyData?.messages?.length)
      ? [{ message: remedyData.messages?.[0] || null, products: remedyData.suggestedProducts || [] }]
      : [];

  const handleProductClick = (product) => {
    if (!product.slug) return;
    onProductClick?.();
    navigate(`/product-details/${product.slug}`, {
      state: {
        _selectedVariant: product.variantId ? {
          _id: product.variantId,
          skuCode: product.variantSkuCode,
          sku: product.variantSkuCode,
        } : undefined,
      },
    });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Suggested Remedies</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <IoClose size={22} />
          </button>
        </div>

        {displayEntries.length > 0 ? (
          <div className={styles.entriesList}>
            {displayEntries.map((entry, entryIdx) => (
              <div key={entryIdx} className={styles.entryGroup}>
                {entry.message && (
                  <div className={styles.entryMessage}>
                    <span className={styles.entryMessageIcon}></span>
                    <p>{entry.message}</p>
                  </div>
                )}
                {entry.products?.length > 0 && (
                  <div className={styles.entryProducts}>
                    {entry.products.map((product, idx) => (
                      <div
                        key={product.variantId || product.productId || product._id || idx}
                        className={styles.productCard}
                        onClick={() => handleProductClick(product)}
                      >
                        {(product.variantImage || product.image || product.images?.[0]) && (
                          <div className={styles.productImageWrap}>
                            <img
                              src={product.variantImage || product.image || product.images?.[0]}
                              alt={product.title || "Product"}
                              className={styles.productImage}
                              onError={(e) => { e.target.style.display = "none"; }}
                            />
                          </div>
                        )}
                        <div className={styles.productInfo}>
                          <h4 className={styles.productTitle}>{product.title || "Suggested Product"}</h4>
                          {product.variantTitle && (
                            <span className={styles.productVariant}>{product.variantTitle}</span>
                          )}
                          {product.brand && (
                            <span className={styles.productBrand}>
                              {typeof product.brand === "object" ? product.brand?.name : product.brand}
                            </span>
                          )}
                          {product.short_description && (
                            <p className={styles.productDesc}>{product.short_description}</p>
                          )}
                          {(product.variantPrice != null || product.price != null) && (
                            <div className={styles.priceRow}>
                              <span className={styles.price}>₹{product.variantPrice ?? product.price}</span>
                              {(product.variantMrp || product.mrp) && (product.variantMrp || product.mrp) > (product.variantPrice ?? product.price) && (
                                <>
                                  <span className={styles.mrp}>₹{product.variantMrp || product.mrp}</span>
                                  <span className={styles.discount}>
                                    {Math.round((((product.variantMrp || product.mrp) - (product.variantPrice ?? product.price)) / (product.variantMrp || product.mrp)) * 100)}% off
                                  </span>
                                </>
                              )}
                            </div>
                          )}
                          {product.slug && (
                            <span className={styles.viewProduct}>View Product →</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>No remedies suggested yet.</p>
            <p className={styles.emptyHint}>
              Your astrologer will suggest remedies during the consultation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuggestedRemedyPanel;
