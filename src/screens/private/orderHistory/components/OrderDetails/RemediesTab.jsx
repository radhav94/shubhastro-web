import { useNavigate } from "react-router-dom";
import { FileQuestion } from "lucide-react";
import dayjs from "dayjs";
import styles from "./RemediesTab.module.scss";
import { useGetSuggestedRemediesQuery } from "../../../../../redux/api/chatApi";
import PrimaryLoader from "../../../../../component/UI/PrimaryLoader";

const getBrand = (brand) =>
  typeof brand === "object" ? brand?.name : brand;

const getImage = (product) =>
  product?.image || product?.images?.[0] || null;

const RemediesTab = ({ astrologerId }) => {
  const navigate = useNavigate();
  const { data, isLoading, error } = useGetSuggestedRemediesQuery(
    { astrologerId },
    { skip: !astrologerId }
  );

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
            {entry.suggestedProducts.map((product) => {
              const img = getImage(product);
              const brand = getBrand(product.brand);
              const discount =
                product.mrp && product.mrp > product.price
                  ? Math.round(
                      ((product.mrp - product.price) / product.mrp) * 100
                    )
                  : 0;

              return (
                <div
                  key={product.productId || product._id}
                  className={styles.productCard}
                  onClick={() =>
                    product.slug &&
                    navigate(`/product-details/${product.slug}`)
                  }
                >
                  {img && (
                    <div className={styles.productImageWrap}>
                      <img
                        src={img}
                        alt={product.title}
                        className={styles.productImage}
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    </div>
                  )}
                  <div className={styles.productInfo}>
                    <h4 className={styles.productTitle}>{product.title}</h4>
                    {brand && (
                      <span className={styles.productBrand}>{brand}</span>
                    )}
                    {product.short_description && (
                      <p className={styles.productDesc}>
                        {product.short_description}
                      </p>
                    )}
                    <div className={styles.priceRow}>
                      <span className={styles.price}>₹{product.price}</span>
                      {product.mrp && product.mrp > product.price && (
                        <s className={styles.mrp}>₹{product.mrp}</s>
                      )}
                      {discount > 0 && (
                        <span className={styles.discount}>
                          {discount}% off
                        </span>
                      )}
                    </div>
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