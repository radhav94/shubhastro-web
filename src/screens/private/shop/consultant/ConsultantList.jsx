import { useEffect, useState, useRef } from "react";
import styles from "./ConsultantList.module.scss";
import { useGetAstrologersQuery } from "../../../../redux/api/astrologer/astrologerApi";
import ConsultantCard from "./ConsultantCard";
import PrimaryLoader from "../../../../component/UI/PrimaryLoader";

const ConsultantList = () => {
  const [page, setPage] = useState(1);
  const [allAstrologers, setAllAstrologers] = useState([]);
  const [hasMore, setHasMore] = useState(true);

  const limit = 6;

  const { data: astroRes, isFetching } = useGetAstrologersQuery({
    page,
    limit,
    specialties: "",
  });

  const data = astroRes?.data || [];

  // ⬇️ FIX: include page also
  useEffect(() => {
    if (!data) return;

    setAllAstrologers((prev) => {
      if (page === 1) {
        return data;
      }

      const existing = new Set(prev.map((i) => i._id));
      const merged = [...prev, ...data.filter((i) => !existing.has(i._id))];

      return merged;
    });

    setHasMore(data.length === limit);
  }, [data, page]); // FIXED

  const loaderRef = useRef(null);

  useEffect(() => {
    if (isFetching) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetching) {
          setPage((p) => p + 1);
        }
      },
      { threshold: 1 }
    );

    if (loaderRef.current) observer.observe(loaderRef.current);

    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [hasMore, isFetching]);

  return (
    <div className={styles.cardsContainer}>
      {allAstrologers.map((astro) => (
        <div key={astro._id} className={styles.cardWrapper}>
          <ConsultantCard data={astro} />
        </div>
      ))}

      <div ref={loaderRef} className={styles.loaderWrapper}>
        {isFetching && <PrimaryLoader />}
      </div>

      {!isFetching && allAstrologers.length === 0 && (
        <p className={styles.empty}>No consultants found.</p>
      )}
    </div>
  );
};

export default ConsultantList;
