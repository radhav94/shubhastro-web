import React, { useEffect, useState, useRef } from "react";
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

const LIMIT = 10;

const ProductList = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isLiveDarshan = slug === "live-darshan";

  const [page, setPage] = useState(1);
  const [products, setProducts] = useState([]);
  const [hasMore, setHasMore] = useState(true);

  const loadMoreRef = useRef(null);

  const {
    data: epoojaData,
    isLoading,
    isFetching,
  } = useGetAllEPoojaQuery(isLiveDarshan ? { page, limit: LIMIT } : skipToken);

  const { data: oldEpoojaData } = useGetAllOldEPoojaQuery(
    !isLiveDarshan ? slug : skipToken
  );

  useEffect(() => {
    setPage(1);
    setProducts([]);
    setHasMore(true);
  }, [slug]);

  useEffect(() => {
    if (isLiveDarshan) {
      const list = epoojaData?.data || [];
      const meta = epoojaData?.meta;

      if (!list.length) return;

      setProducts((prev) =>
        page === 1
          ? list
          : [...prev, ...list.filter((p) => !prev.some((x) => x._id === p._id))]
      );

      setHasMore(meta?.hasNextPage === true);
      return;
    }

    if (oldEpoojaData?.data) {
      setProducts(oldEpoojaData.data);
      setHasMore(false);
      return;
    }

    setProducts(SHOP_PRODUCTS[slug] || []);
    setHasMore(false);
  }, [isLiveDarshan, epoojaData, oldEpoojaData, slug, page]);

  useEffect(() => {
    if (!isLiveDarshan || !hasMore || isFetching) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 1 }
    );

    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [isLiveDarshan, hasMore, isFetching]);

  // ✅ FIX IS HERE
  const getProductRouteId = (product) => {
    if (slug === "live-darshan") return product._id;
    return product._id;
  };

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
                    navigate(`/shop/${slug}/${getProductRouteId(product)}`, {
                      state: product,
                    });
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
                  <span>{product.views || 1719}</span>
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
      </div>

      {isLiveDarshan && <div ref={loadMoreRef} style={{ height: 1 }} />}

      <PrimaryLoader isLoading={isLoading} />
    </div>
  );
};

export default ProductList;
