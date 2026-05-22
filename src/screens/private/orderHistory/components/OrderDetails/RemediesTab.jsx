import { useNavigate } from "react-router-dom";
import { FileQuestion } from "lucide-react";
import dayjs from "dayjs";
import styles from "./RemediesTab.module.scss";
import { useGetSuggestedRemediesQuery } from "../../../../../redux/api/chatApi";
import PrimaryLoader from "../../../../../component/UI/PrimaryLoader";
import { isShubhMallEnabled } from "../../../../../utils/featureConfig";

const getBrand = (brand) =>
  typeof brand === "object" ? brand?.name : brand;

const getImage = (product) =>
  product?.variantImage || product?.image || product?.images?.[0] || null;

const RemediesTab = ({ astrologerId }) => {
  const navigate = useNavigate();
  const { data, isLoading, error } = useGetSuggestedRemediesQuery(
    { astrologerId },
    { skip: !astrologerId }
  );

  const handleProductClick = (product) => {
    if (!product.slug || !isShubhMallEnabled()) return;
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

  if (isLoading) return <PrimaryLoader isLoading />;

  if (error) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyStateIcon}>
          <FileQuestion size={48} />
        </div>
        <h3 className={styles.emptyStateTitle}>Unable to load remedies</h3>
        <p className={styles.emptyStateMessage}>
          Something went wrong. Please try again later.
        </p>
      </div>
    );
  }

  const messages = data?.data || [];
  // Flatten: each entry has suggestedProducts array + note + suggestedAt
  const remedyEntries = messages.filter(
    (msg) => msg?.suggestedProducts?.length > 0
  );

  if (remedyEntries.length === 0) {
    return (
      <div className={styles.remediesTab}>
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>
            <FileQuestion size={48} />
          </div>
          <h3 className={styles.emptyStateTitle}>No Remedies Available</h3>
          <p className={styles.emptyStateMessage}>
            Remedies suggested by your astrologer during consultations will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.remediesTab}>
      {remedyEntries.map((entry) => (
        <div key={entry._id || entry.messageId} className={styles.remedyCard}>
          {entry.note && (
            <p className={styles.remedyNote}>"{entry.note}"</p>
          )}
          <span className={styles.remedyDate}>
            {dayjs(entry.suggestedAt || entry.createdAt).format("DD MMM YYYY, hh:mm A")}
          </span>

          <div className={styles.productList}>
            {(entry.suggestedProducts || []).map((product, idx) => {
              const img = getImage(product);
              const brand = getBrand(product?.brand);
              const price = product.variantPrice ?? product.price;
              const mrp = product.variantMrp || product.mrp;
              const discount =
                mrp && price != null && mrp > price
                  ? Math.round(((mrp - price) / mrp) * 100)
                  : 0;

              return (
                <div
                  key={product.variantId || product.productId || product._id || idx}
                  className={styles.productCard}
                  onClick={() => handleProductClick(product)}
                >
                  {img && (
                    <div className={styles.productImageWrap}>
                      <img
                        src={img}
                        alt={product.title || "Product"}
                        className={styles.productImage}
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    </div>
                  )}
                  <div className={styles.productInfo}>
                    <h4 className={styles.productTitle}>{product.title || "Suggested Product"}</h4>
                    {product.variantTitle && (
                      <span className={styles.productVariant}>{product.variantTitle}</span>
                    )}
                    {brand && (
                      <span className={styles.productBrand}>{brand}</span>
                    )}
                    {product.short_description && (
                      <p className={styles.productDesc}>
                        {product.short_description}
                      </p>
                    )}
                    {price != null && (
                      <div className={styles.priceRow}>
                        <span className={styles.price}>₹{price}</span>
                        {mrp && mrp > price && (
                          <s className={styles.mrp}>₹{mrp}</s>
                        )}
                        {discount > 0 && (
                          <span className={styles.discount}>
                            {discount}% off
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
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RemediesTab;