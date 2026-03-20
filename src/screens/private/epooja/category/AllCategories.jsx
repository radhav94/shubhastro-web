import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./AllCategories.module.scss";
import { FiChevronLeft } from "react-icons/fi";
import { useGetProductCategoriesQuery } from "../../../../redux/api/astromall/epooja/epoojaBookingApi";
import AstromallCartSidebar from "../components/AstromallCartSidebar";

const AllCategories = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data, isLoading } = useGetProductCategoriesQuery();
  const [parentStack, setParentStack] = useState([]);
  const [didAutoOpen, setDidAutoOpen] = useState(false);

  const allCategories = data?.data || [];
  const rootCategories = allCategories.filter((c) => c.parent_id === null);

  // parent_id is numeric (e.g. 24), so match against numeric ID field
  const getChildren = (numericId) =>
    allCategories.filter((c) => c.parent_id === numericId);

  const activeParent = parentStack.length > 0 ? parentStack[parentStack.length - 1] : null;

  // Auto-open category passed from homepage browse-by-category tray
  useEffect(() => {
    if (didAutoOpen || !allCategories.length) return;
    const restoreStack = location.state?.restoreStack;
    if (restoreStack?.length) {
      setParentStack(restoreStack);
      setDidAutoOpen(true);
      return;
    }
    const openCat = location.state?.openCategory;
    if (openCat) {
      const children = getChildren(openCat.ID);
      if (children.length > 0) {
        setParentStack([openCat]);
      } else {
        navigate(`/category/${openCat.slug || openCat.ID}`, {
          state: { categoryId: openCat.ID, name: openCat.name, imgUrl: openCat.imgUrl, breadcrumbTrail: [openCat] },
          replace: true,
        });
      }
      setDidAutoOpen(true);
    }
  }, [allCategories]);

  const handleCategoryClick = (cat) => {
    const children = getChildren(cat.ID);
    if (children.length > 0) {
      setParentStack((prev) => [...prev, cat]);
    } else {
      navigate(`/category/${cat.slug || cat.ID}`, {
        state: { categoryId: cat.ID, name: cat.name, imgUrl: cat.imgUrl, breadcrumbTrail: [...parentStack, cat] },
      });
    }
  };

  const handleBack = () => {
    if (parentStack.length > 0) {
      setParentStack((prev) => prev.slice(0, -1));
    } else {
      navigate(-1);
    }
  };

  const displayCategories = activeParent
    ? getChildren(activeParent.ID)
    : rootCategories;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backBtn} onClick={handleBack} aria-label="Go back">
            <FiChevronLeft />
          </button>
          <nav className={styles.breadcrumb}>
            <span className={parentStack.length > 0 ? styles.breadcrumbLink : styles.breadcrumbActive} onClick={() => parentStack.length > 0 && setParentStack([])}>
              All Categories
            </span>
            {parentStack.map((cat, i) => (
              <span key={cat.ID}>
                <span className={styles.breadcrumbSep}>›</span>
                <span
                  className={i < parentStack.length - 1 ? styles.breadcrumbLink : styles.breadcrumbActive}
                  onClick={() => i < parentStack.length - 1 && setParentStack(parentStack.slice(0, i + 1))}
                >
                  {cat.name}
                </span>
              </span>
            ))}
          </nav>
        </div>
        <div className={styles.headerRight}>
          <AstromallCartSidebar />
        </div>
      </div>

      {isLoading && <div className={styles.loading}>Loading...</div>}

      {!isLoading && displayCategories.length === 0 && (
        <div className={styles.empty}>
          <h2>No Categories Available</h2>
          <p>There are no categories available right now.</p>
          <button className={styles.browseBtn} onClick={() => navigate("/astromall")}>Browse AstroMall</button>
        </div>
      )}

      {!isLoading && displayCategories.length > 0 && (
        <div className={styles.grid}>
          {displayCategories.map((c) => (
            <div
              key={c._id || c.ID}
              className={styles.card}
              onClick={() => handleCategoryClick(c)}
            >
              <img src={c.imgUrl || c.image || "https://images.unsplash.com/photo-1604608672516-f1b9b1d37076?w=400&q=80"} alt={c.name || "Category"} />
              <div className={styles.overlay}>
                <h4>{c.name || "Category"}</h4>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllCategories;
