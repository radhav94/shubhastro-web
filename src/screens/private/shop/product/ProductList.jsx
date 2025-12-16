import React, { useEffect, useState, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { SHOP_PRODUCTS } from "../data/productData";
import styles from "./ProductList.module.scss";
import { useGetAllEPoojaQuery } from "../../../../redux/api/astromall/epooja/epoojaApi";
import { skipToken } from "@reduxjs/toolkit/query";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";

const ProductList = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const shouldFetchEPooja = slug === "online-puja";

  const [page, setPage] = useState(1);
  const limit = 10;

  const {
    data: epoojaData,
    isLoading,
    isFetching,
  } = useGetAllEPoojaQuery(shouldFetchEPooja ? { page, limit } : skipToken);

  const categoryProducts = SHOP_PRODUCTS[slug] || [];

  const [products, setProducts] = useState([]);
  const [hasMore, setHasMore] = useState(true);

  const loadMoreRef = useRef(null);
  const hasMoreRef = useRef(true);
  const isFetchingRef = useRef(false);

  const apiProducts = epoojaData?.data || [];
  const meta = epoojaData?.meta;

  useEffect(() => {
    if (!shouldFetchEPooja) {
      setProducts(categoryProducts);
      return;
    }

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
  }, [apiProducts, page, shouldFetchEPooja]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
    isFetchingRef.current = isFetching;
  }, [hasMore, isFetching]);

  useEffect(() => {
    if (!shouldFetchEPooja) return;

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

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [page, hasMore, isFetching, shouldFetchEPooja, meta?.totalPages]);

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.heading}>{location.state?.name}</h2>

      <div className={styles.grid}>
        {products.map((product) => (
          <div
            key={product._id || product.id}
            className={styles.card}
            onClick={() =>
              navigate(`/shop/${slug}/${product.slug || product.ID}`, {
                state: product,
              })
            }
          >
            <img
              src={product.defaultImage || product.image}
              alt={product.title || product.name}
            />

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

            <div className={styles.content}>
              <h3>{product.title || product.name}</h3>

              <p className={styles.place}>
                {product.district}, {product.state}
              </p>

              <p>
                Description{" "}
                {product.description?.length > 20
                  ? product.description.slice(0, 22) + "..."
                  : product.description || "--"}
              </p>
            </div>
          </div>
        ))}
      </div>

      {shouldFetchEPooja && <div ref={loadMoreRef} style={{ height: 1 }} />}

      <PrimaryLoader isLoading={isLoading} />
    </div>
  );
};

export default ProductList;
