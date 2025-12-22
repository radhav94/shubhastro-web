import React, { useEffect, useState, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { SHOP_PRODUCTS } from "../data/productData";
import styles from "./ProductList.module.scss";
import { FaEye,FaCircle } from "react-icons/fa";

import {
  useGetAllEPoojaQuery,
  useGetAllOldEPoojaQuery,
} from "../../../../redux/api/astromall/epooja/epoojaApi";
import { skipToken } from "@reduxjs/toolkit/query";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";

const ProductList = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isLiveDarshan = slug === "live-darshan";
  const isOnlinePuja = slug === "online-puja";

  const [page, setPage] = useState(1);
  const limit = 10;

  // APIs

  const {
    data: epoojaData,
    isLoading,
    isFetching,
  } = useGetAllEPoojaQuery(isLiveDarshan ? { page, limit } : skipToken);

  const { data: oldEpoojaData } = useGetAllOldEPoojaQuery(
    isOnlinePuja ? undefined : skipToken
  );

  // STATE

  const [products, setProducts] = useState([]);
  const [hasMore, setHasMore] = useState(true);

  const loadMoreRef = useRef(null);
  const hasMoreRef = useRef(true);
  const isFetchingRef = useRef(false);

  //LIVE DARSHAN (PAGINATED)

  const apiProducts = epoojaData?.data || [];
  const meta = epoojaData?.meta;

  useEffect(() => {
    if (!isLiveDarshan) return;

    if (!apiProducts.length) return;

    if (page === 1) {
      setProducts(apiProducts);
    } else {
      setProducts((prev) => {
        const ids = new Set(prev.map((p) => p._id));
        const newItems = apiProducts.filter((p) => !ids.has(p._id));
        return [...prev, ...newItems];
      });
    }

    setHasMore(meta?.hasNextPage === true);
  }, [apiProducts, page, isLiveDarshan, meta]);

  // ONLINE PUJA

  useEffect(() => {
    if (!isOnlinePuja) return;

    const list = oldEpoojaData?.data || [];
    setProducts(list);
    setHasMore(false);
  }, [isOnlinePuja, oldEpoojaData]);

  // OTHER CATEGORIES

  useEffect(() => {
    if (isLiveDarshan || isOnlinePuja) return;

    setProducts(SHOP_PRODUCTS[slug] || []);
    setHasMore(false);
  }, [slug, isLiveDarshan, isOnlinePuja]);

  // INFINITE SCROLL

  useEffect(() => {
    hasMoreRef.current = hasMore;
    isFetchingRef.current = isFetching;
  }, [hasMore, isFetching]);

  useEffect(() => {
    if (!isLiveDarshan) return;
    if (isFetching || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMoreRef.current &&
          !isFetchingRef.current &&
          page < meta?.totalPages
        ) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 1 }
    );

    if (loadMoreRef.current) observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [page, hasMore, isFetching, isLiveDarshan, meta?.totalPages]);

  const getProductRouteId = (product) => {
    if (slug === "online-puja") return product._id;
    if (slug === "live-darshan") return product.ID;
    return product.slug;
  };

  /* ---------- UI ---------- */

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.heading}>{location.state?.name}</h2>

      <div className={styles.grid}>
        {products.map((product) => (
          <div
            key={product._id || product.id}
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
                  "https://images.unsplash.com/photo-1625072290979-cac544181be8?q=80&w=387&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                }
                alt={product.title || product.name}
              />

              {/* Live Ticker Badge */}
              {(slug === "live-darshan")&&(<div className={styles.liveTicker}>
                <FaCircle className={styles.liveIcon} /> Live
              </div>)}
            </div>

            <div className={styles.actions}>
              <button
                className={styles.bookBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/shop/${slug}/${product.slug || product._id}`, {
                    state: product,
                  });
                }}
              >
                Book
              </button>
            </div>

            <div className={styles.content}>
              <div className={styles.titleRow}>
                <h3>{product.title || product.name}</h3>
                <div className={styles.views}>
                  <FaEye className={styles.eyeIcon} />
                  <span>{product.views || 1719}</span>
                </div>
              </div>

              {product?.district && (
                <p className={styles.place}>
                  {product.district}, {product.state}
                </p>
              )}

              <p>
                {product.description?.length > 42
                  ? product.description.slice(0, 42) + "..."
                  : product.description || "--"}
              </p>
            </div>
          </div>
        ))}
      </div>


      {isLiveDarshan && <div ref={loadMoreRef} style={{ height: 1 }} />}

      <PrimaryLoader isLoading={isLoading} />
    </div>
  );
};

export default ProductList;
