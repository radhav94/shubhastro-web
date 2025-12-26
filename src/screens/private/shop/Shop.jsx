import { useEffect, useState } from "react";
import { SHOP_CATEGORIES } from "./data/shop";
import styles from "./Shop.module.scss";
import { useNavigate } from "react-router-dom";
import { useGetAllCategoriesQuery } from "../../../redux/api/astromall/epooja/epoojaApi";

const Shop = () => {
  const navigate = useNavigate();
  const { data } = useGetAllCategoriesQuery();
  const [categories, setCategories] = useState(SHOP_CATEGORIES);
  const allCategories = data?.data || [];

  useEffect(() => {
    setCategories([...categories, ...allCategories]);
  }, [allCategories]);

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.heading}>Shop Categories</h2>

      <div className={styles.grid}>
        {categories?.map((cat) => (
          <div
            key={cat?._id}
            className={styles.card}
            onClick={() => navigate(`/shop/${cat?._id}`, { state: cat })}
          >
            <img src={cat.imgUrl} className={styles.image} alt={cat?.name} />

            <div className={styles.content}>
              {cat?.tag && <span className={styles.tag}>{cat?.tag}</span>}
              <h3>{cat?.name}</h3>
              <p>{cat?.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Shop;
