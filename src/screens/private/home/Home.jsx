import React from "react";
import styles from "./Home.module.scss";
import HeroSection from "./components/heroSection/HeroSection";
import ServiceCards from "./components/serviceCards/ServiceCards";
import Astrologers from "./components/astrologers/Astrologers";
import Blogs from "./components/blogs/Blogs";
import { useNavigate } from "react-router-dom";
import { PATH } from "../../../utils/routes/Paths";
import { useGetHomeDetailsQuery } from "../../../services/appServices/homeServices"; // ⭐ API IMPORT

const Home = () => {
  const navigate = useNavigate();

  // CALL API
  const { data, isLoading, isError } = useGetHomeDetailsQuery();

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Something went wrong</div>;

  const onChat = (data) => {
    navigate(`/talk-to-astrologers/chat/${data._id}`, {
      state: { data: data },
    });
  };

  const onProfile = (data) => {
    // navigate(`/talk-to-astrologers/expert/${data.FirstName}`, {
    //   state: { data: data },
    // });
  };
  const onWatchNow = () => {
    navigate(PATH.privateRoutes.ASTRO_LIVE.path);
  };

  const onClickView = () => {
    navigate(PATH.privateRoutes.TALK_TO_ASTROLOGER.path);
  };

  const onClick = () => {
    navigate(PATH.privateRoutes.HOROSCOPE.path);
  };

  return (
    <div className={styles.homeContainer}>
      <HeroSection data={data?.data?.list} />

      {/* Example: Sending API data to components */}
      <ServiceCards data={data?.data?.list} />

      <Astrologers
        astrologers={data?.data?.list}
        onChat={onChat}
        onClickView={onClickView}
        onProfile={onProfile}
      />

      <Blogs data={data?.data?.list} />
    </div>
  );
};

export default Home;
