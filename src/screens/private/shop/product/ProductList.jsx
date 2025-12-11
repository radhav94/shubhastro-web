import React, { useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { SHOP_PRODUCTS } from "../data/productData";
import styles from "./ProductList.module.scss";
import { useGetAllEPoojaQuery } from "../../../../redux/api/astromall/epooja/epoojaApi";
import { skipToken } from "@reduxjs/toolkit/query";

const ProductList = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  /**  Only call RTK query when slug === "online-puja" */
  const shouldFetchEPooja = slug === "online-puja";

  const { data: epoojaData, isLoading } = useGetAllEPoojaQuery(
    shouldFetchEPooja ? undefined : skipToken
  );

  /**  Use RTK data OR fallback to categoryProducts */
  const categoryProducts = SHOP_PRODUCTS[slug] || [];
  const finalProducts = shouldFetchEPooja
    ? epoojaData?.data || []
    : categoryProducts;

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.heading}>{location.state?.name}</h2>

      <div className={styles.grid}>
        {finalProducts.map((product) => (
          <div
            key={product._id || product.id}
            className={styles.card}
            onClick={() =>
              navigate(`/shop/${slug}/${product.slug || product._id}`, {
                state: product,
              })
            }
          >
            <img
              src={
                product.defaultImage ||
                `https://images.unsplash.com/photo-1625072290979-cac544181be8?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D`
              }
              alt={product.title || product.name}
            />

            {/* Book Button */}
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

              {/* Online puja price key = "price", normal category price key = minConsultantPrice */}
              <p>
                Starting from ₹{" "}
                {product.price || product.minConsultantPrice || "--"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductList;
