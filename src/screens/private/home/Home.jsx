import React from "react";
import styles from "./Home.module.scss";
// import HeroSection from "./components/heroSection/HeroSection";
import ServiceCards from "./components/serviceCards/ServiceCards";
import Astrologers from "./components/astrologers/Astrologers";
import Blogs from "./components/blogs/Blogs";
import News from "./components/news/news";
import { useNavigate } from "react-router-dom";
import { PATH } from "../../../utils/routes/Paths";
import { useGetHomeDetailsQuery } from "../../../services/appServices/homeServices";
import PrimaryLoader from "../../../component/UI/PrimaryLoader";
import Footer from "../../../layouts/Footer";
import WhyAstro from "./components/whyastro/WhyAstro";
import TotalCount from "./components/totalcount/TotalCount";
import QuickActionTray from "./components/quickActionTray/QuickActionTray";
import HeroSection from "./components/heroSection2/HeroSection";

const Home = () => {
  const navigate = useNavigate();

  const { data, isLoading } = useGetHomeDetailsQuery();

  if (isLoading) return <PrimaryLoader isLoading={isLoading} />;

  const homeList = data?.data?.list;

  const onChat = (item) => {
    navigate(`/talk-to-astrologers/${item._id}`, {
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
        {/* <section className={styles.sectionFull}>
          <HeroSection data={homeList} />
        </section> */}
        <HeroSection/>
        <QuickActionTray />

        <section className={styles.section}>
          <Astrologers
              astrologers={homeList}
              onChat={onChat}
              onClickView={onClickView}
              onProfile={onProfile}
            />
        </section>
        <News data={homeList} />
        <section className={styles.section}>
          <ServiceCards />
        </section>

        <section className={styles.sectionStack}>
          <div className={styles.sectionBlock}>
            <TotalCount data={homeList} />
          </div>

          {/* <div className={styles.sectionBlock}> */}
          <Blogs data={homeList} />
          {/* </div> */}
          <div>
            <WhyAstro />
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
