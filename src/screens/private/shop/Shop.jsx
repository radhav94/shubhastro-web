import { useEffect, useState, useRef, useCallback } from "react";
import { SHOP_CATEGORIES } from "./data/shop";
import styles from "./Shop.module.scss";
import { useNavigate } from "react-router-dom";
import { useGetAllCategoriesQuery } from "../../../redux/api/astromall/epooja/epoojaApi";

const LIMIT = 10;

const Shop = () => {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState(SHOP_CATEGORIES);
  const [hasMore, setHasMore] = useState(true);

  const loadMoreRef = useRef(null);
  const observerRef = useRef(null);

  const { data, isFetching } = useGetAllCategoriesQuery({
    page,
    limit: LIMIT,
  });

  // ================= MERGE + DEDUPE =================
  useEffect(() => {
    if (!data?.data) return;

    const list = data.data;
    const meta = data.pagination;

    setCategories((prev) => {
      const ids = new Set(prev.map((c) => c._id));
      const unique = list.filter((c) => !ids.has(c._id));
      return page === 1 ? [...SHOP_CATEGORIES, ...unique] : [...prev, ...unique];
    });

    setHasMore(meta?.hasNextPage === true);
  }, [data, page]);

  // ================= OBSERVER =================
  const handleObserver = useCallback(
    ([entry]) => {
      if (entry.isIntersecting && hasMore && !isFetching) {
        setPage((prev) => prev + 1);
      }
    },
    [hasMore, isFetching]
  );

  useEffect(() => {
    if (!hasMore) return;

    observerRef.current = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
    });

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [handleObserver, hasMore]);

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.heading}>Shop Categories</h2>

      <div className={styles.grid}>
        {categories.map((cat) => (
          <div
            key={cat._id}
            className={styles.card}
            onClick={() => navigate(`/shop/${cat.slug}`, { state: cat })}
          >
            <img
              src={cat.imgUrl}
              className={styles.image}
              alt={cat.name}
            />

            <div className={styles.content}>
              {cat.tag && <span className={styles.tag}>{cat.tag}</span>}
              <h3>{cat.name}</h3>
              <p>{cat.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 👇 infinite scroll target */}
      {hasMore && <div ref={loadMoreRef} style={{ height: 40 }} />}
    </div>
  );
};

export default Shop;
