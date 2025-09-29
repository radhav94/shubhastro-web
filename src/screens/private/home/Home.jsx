import React from "react";

import styles from "./Home.module.scss";
import HeroSection from "./components/heroSection/HeroSection";
import ServiceCards from "./components/serviceCards/ServiceCards";
import Astrologers from "./components/astrologers/Astrologers";
import LiveShows from "./components/liveShows/LiveShows";

import Rashis from "./components/Rashis/Rashies";
import Services from "./components/serivces/Services";
import Blogs from "./components/blogs/Blogs";
import { useNavigate } from "react-router-dom";
import { PATH } from "../../../utils/routes/Paths";

const Home = () => {
  const navigate = useNavigate();
  const onChat = (data) => {
    navigate(`/astrologer/expert/${data.FirstName}`, {
      state: { data: data },
    });
  };
  const onWatchNow = () => {
    navigate(PATH.privateRoutes.ASTRO_LIVE.path);
  };
  return (
    <div style={{ flex: 1 }}>
      <HeroSection />
      <ServiceCards />
      <Astrologers onChat={onChat} />
      <LiveShows onWatchNow={onWatchNow} />
      <Rashis />
      <Services />
      <Blogs />
    </div>
  );
};

export default Home;
