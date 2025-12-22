import { useEffect, useState } from "react";

const useRecommendTrigger = (threshold = 0.8) => {
  const [showCTA, setShowCTA] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const scrolled =
        window.scrollY / (document.body.scrollHeight - window.innerHeight);

      if (scrolled > threshold) {
        setShowCTA(true);
        window.removeEventListener("scroll", onScroll);
      }
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return showCTA;
};

export default useRecommendTrigger;
