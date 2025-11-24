import React from "react";
import styles from "./Home.module.scss";
import HeroSection from "./components/heroSection/HeroSection";
import ServiceCards from "./components/serviceCards/ServiceCards";
import Astrologers from "./components/astrologers/Astrologers";
import Blogs from "./components/blogs/Blogs";
import { useNavigate } from "react-router-dom";
import { PATH } from "../../../utils/routes/Paths";
import { useGetHomeDetailsQuery } from "../../../services/appServices/homeServices";
import PrimaryLoader from "../../../component/UI/PrimaryLoader";

const Home = () => {
  const navigate = useNavigate();

  const { data, isLoading } = useGetHomeDetailsQuery();

  if (isLoading) return <PrimaryLoader isLoading={isLoading} />;

  const homeList = data?.data?.list;

  const onChat = (item) => {
    navigate(`/talk-to-astrologers/chat/${item._id}`, {
      state: { data: item },
    });
  };

  const onProfile = (item) => {};

  const onClickView = () => {
    navigate(PATH.privateRoutes.TALK_TO_ASTROLOGER.path);
  };

  return (
    <div className={styles.homePage}>
      <div className={styles.gradientBg} />

      <div className={styles.homeContainer}>
        <section className={styles.sectionFull}>
          <HeroSection data={homeList} />
        </section>

        <section className={styles.section}>
          <ServiceCards data={homeList} />
        </section>

        <section className={styles.sectionStack}>
          <div className={styles.sectionBlock}>
            <Astrologers
              astrologers={homeList}
              onChat={onChat}
              onClickView={onClickView}
              onProfile={onProfile}
            />
          </div>

          <div className={styles.sectionBlock}>
            <Blogs data={homeList} />
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
