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
    navigate(`/chat-with-astrologers/${item._id}`, {
      state: { data: item },
    });
  };

  const onProfile = (item) => {};
  const astrologerSectionOnline = homeList?.find(
    (item) => item.slug === "astrologer"
  );
  const astrologerTitle = "Top Online Astrologers";
  const astrologersOnline = astrologerSectionOnline?.content || [];
  
  const OurastrologerSection = homeList.find(
    (item) => item.slug === "our-astrologers"
  );
  const OurastrologersTitle ="Our Astrologers";
  const Ourastrologers= OurastrologerSection?.content || [];

  const onClickView = () => {
    navigate(PATH.privateRoutes.TALK_TO_ASTROLOGER.path);
  };
  const onClickViewOnline = () => {
    navigate(PATH.privateRoutes.TALK_TO_ASTROLOGER_ONLINE.path);
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
        {astrologersOnline?.length > 0 && (
        <section className={styles.section}>
          <Astrologers
              title={astrologerTitle}
              astrologers={astrologersOnline}
              onChat={onChat}
              onClickView={onClickViewOnline}
              onProfile={onProfile}
            />
        </section>
      )}
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
          {Ourastrologers?.length > 0 && (
          <section className={styles.section}>
          <Astrologers
              title={OurastrologersTitle}
              astrologers={Ourastrologers}
              onChat={onChat}
              onClickView={onClickView}
              onProfile={onProfile}
            />
          </section>
          )}
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
