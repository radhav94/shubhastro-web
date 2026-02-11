import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import styles from "./ProductList.module.scss";
import { FaEye, FaCircle } from "react-icons/fa";

import {
  useGetAllEPoojaQuery,
  useGetAllOldEPoojaQuery,
} from "../../../../redux/api/astromall/epooja/epoojaApi";
import { skipToken } from "@reduxjs/toolkit/query";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";
import { SHOP_PRODUCTS } from "../data/productData";

const LIMIT = 20;

const SkeletonCard = () => (
  <div className={`${styles.card} ${styles.skeleton}`}>
    <div className={styles.imageWrapper} />
    <div className={styles.content}>
      <div className={styles.skeletonLine} />
      <div className={styles.skeletonLineSmall} />
      <div className={styles.skeletonLineSmall} />
    </div>
  </div>
);

const ProductList = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isLiveDarshan = slug === "live-darshan";

  const [page, setPage] = useState(1);
  const [products, setProducts] = useState([]);
  const [hasMore, setHasMore] = useState(true);

  const loadMoreRef = useRef(null);
  const observerRef = useRef(null);

  const {
    data: liveData,
    isLoading,
    isFetching,
  } = useGetAllEPoojaQuery(
    isLiveDarshan ? { page, limit: LIMIT } : skipToken
  );

  const {
    data: oldData,
    isFetching: oldFetching,
  } = useGetAllOldEPoojaQuery(
    !isLiveDarshan ? { slug, page, limit: LIMIT } : skipToken
  );

  useEffect(() => {
    setPage(1);
    setProducts([]);
    setHasMore(true);
  }, [slug]);

  useEffect(() => {
    if (isLiveDarshan && liveData?.data) {
      const list = liveData.data;
      const meta = liveData.meta;

      setProducts((prev) => {
        const ids = new Set(prev.map((i) => i._id));
        const unique = list.filter((i) => !ids.has(i._id));
        return page === 1 ? list : [...prev, ...unique];
      });

      setHasMore(meta?.hasNextPage === true);
      return;
    }

    if (!isLiveDarshan && oldData?.data) {
      const list = oldData.data;
      const meta = oldData.pagination;

      setProducts((prev) => {
        const ids = new Set(prev.map((i) => i._id));
        const unique = list.filter((i) => !ids.has(i._id));
        return page === 1 ? list : [...prev, ...unique];
      });

      setHasMore(meta?.hasNextPage === true);
      return;
    }

    // 🟡 FALLBACK
    if (!isLiveDarshan && !oldData) {
      setProducts(SHOP_PRODUCTS[slug] || []);
      setHasMore(false);
    }
  }, [isLiveDarshan, liveData, oldData, page, slug]);

  const handleObserver = useCallback(
    ([entry]) => {
      if (
        entry.isIntersecting &&
        hasMore &&
        !isFetching &&
        !oldFetching
      ) {
        setPage((prev) => prev + 1);
      }
    },
    [hasMore, isFetching, oldFetching]
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

  const getProductRouteId = (product) => {
    if (slug === "live-darshan") return product._id;
    return product.slug;
  };

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.heading}>{location.state?.name}</h2>
      {products.length === 0 && !isLoading && !isFetching && !oldFetching ? (
        <div className={styles.emptyState}>
          <p>No data found</p>
        </div>
      ) : (
        <>
          

          <div className={styles.grid}>
            {products.map((product) => (
              <div
                key={product._id}
                className={styles.card}
                onClick={() =>
                  navigate(`/shop/${slug}/${getProductRouteId(product)}`, {
                    state: product,
                  })
                }
              >
                <div className={styles.imageWrapper}>
                  <img
                    src={
                      product.defaultImage ||
                      product.image ||
                      "https://images.unsplash.com/photo-1625072290979-cac544181be8"
                    }
                    alt={product.title || product.name}
                  />

                  {isLiveDarshan && (
                    <div className={styles.liveTicker}>
                      <FaCircle className={styles.liveIcon} /> Live
                    </div>
                  )}
                </div>

                {!isLiveDarshan && (
                  <div className={styles.actions}>
                    <button
                      className={styles.bookBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(
                          `/shop/${slug}/${getProductRouteId(product)}`,
                          { state: product }
                        );
                      }}
                    >
                      Book
                    </button>
                  </div>
                )}

                <div className={styles.content}>
                  <div className={styles.titleRow}>
                    <h3>{product.title || product.name}</h3>
                    <div className={styles.views}>
                      <FaEye />
                      <span>{product.views || 0}</span>
                    </div>
                  </div>

                  {product?.district && (
                    <p className={styles.place}>
                      {product.district}, {product.state}
                    </p>
                  )}

                  <p>
                    {product.description
                      ? product.description.slice(0, 30) + "..."
                      : "--"}
                  </p>
                </div>
              </div>
            ))}

            {/* ===== SKELETON ===== */}
            {(isFetching || oldFetching) &&
              Array.from({ length: 2 }).map((_, i) => (
                <SkeletonCard key={`skeleton-${i}`} />
              ))}
          </div>

          {hasMore && <div ref={loadMoreRef} style={{ height: 40 }} />}
        </>
      )}

      <PrimaryLoader isLoading={isLoading || oldFetching} />
    </div>
  );
};

export default ProductList;
