import React from "react";

import HoroScopeBanner from "./horoscopeComp/horoScopeBanner";
import MoreHscope from "./horoscopeComp/MoreHscope";
import { ContentCard } from "../../../component";
import { appColors } from "../../../utils/theme";
import Astrologers from "../home/components/astrologers/Astrologers";
import Blog from "../blog/Blog";
import Blogs from "../home/components/blogs/Blogs";
import { useNavigate } from "react-router-dom";
import { useHoroscope } from "./useHoroscope";

const Horoscope = () => {
  const [description, horoDisc, onChat, onClickSign, data] = useHoroscope();

  return (
    <>
      <HoroScopeBanner data={data} onClickSign={onClickSign} />
      <MoreHscope />
      <ContentCard
        title="Daily planetary movements"
        description={description}
        bgColor={appColors.sec}
        showDate={true}
      />
      <ContentCard
        title="What is a Horoscope?"
        description={horoDisc}
        bgColor={appColors.app_bg}
      />
      <Astrologers onChat={onChat} />
      <Blogs />
    </>
  );
};

export default Horoscope;
