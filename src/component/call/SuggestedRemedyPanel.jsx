import { IoClose } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import styles from "./SuggestedRemedyPanel.module.scss";

const SuggestedRemedyPanel = ({ isOpen, onClose, remedyData, onProductClick }) => {
  const navigate = useNavigate();
  if (!isOpen) return null;

  const products = remedyData?.suggestedProducts || [];
  const messages = remedyData?.messages || [];

  const handleProductClick = (slug) => {
    if (!slug) return;
    onProductClick?.();
    navigate(`/product-details/${slug}`);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Suggested Remedy</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <IoClose size={22} />
          </button>
        </div>

        {messages.length > 0 && (
          <div className={styles.remedyMessage}>
            {messages.map((msg, i) => (
              <p key={i}>{msg}</p>
            ))}
          </div>
        )}

        {products.length > 0 ? (
          <div className={styles.productList}>
            {products.map((product) => (
              <div key={product.productId || product._id} className={styles.productCard} onClick={() => handleProductClick(product.slug)}>
                {(product.image || product.images?.[0]) && (
                  <div className={styles.productImageWrap}>
                    <img
                      src={product.image || product.images?.[0]}
                      alt={product.title}
                      className={styles.productImage}
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                  </div>
                )}
                <div className={styles.productInfo}>
                  <h4 className={styles.productTitle}>{product.title}</h4>
                  {product.brand && (
                    <span className={styles.productBrand}>
                      {typeof product.brand === "object" ? product.brand?.name : product.brand}
                    </span>
                  )}
                  {product.short_description && (
                    <p className={styles.productDesc}>{product.short_description}</p>
                  )}
                  {(product.price != null) && (
                    <div className={styles.priceRow}>
                      <span className={styles.price}>₹{product.price}</span>
                      {product.mrp && product.mrp > product.price && (
                        <span className={styles.mrp}>₹{product.mrp}</span>
                      )}
                      {product.mrp && product.mrp > product.price && (
                        <span className={styles.discount}>
                          {Math.round(((product.mrp - product.price) / product.mrp) * 100)}% off
                        </span>
                      )}
                    </div>
                  )}
                  {product.category?.length > 0 && (
                    <div className={styles.categories}>
                      {product.category.map((cat) => (
                        <span key={cat.ID} className={styles.categoryTag}>
                          {cat.name}
                        </span>
                      ))}
                    </div>
                  )}
                  {product.slug && (
                    <span className={styles.viewProduct}>View Product →</span>
                  )}
                </div>
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
