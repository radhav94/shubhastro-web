import React from "react";

import HoroScopeBanner from "./horoscopeComp/HoroScopeBanner";
import MoreHscope from "./horoscopeComp/MoreHscope";
import { ContentCard, PrimaryText } from "../../../component";
import { appColors } from "../../../utils/theme";
import Astrologers from "../home/components/astrologers/Astrologers";
import Blogs from "../home/components/blogs/Blogs";
import { useNavigate } from "react-router-dom";
import { useHoroscope } from "./useHoroscope";

import DividerWithImage from "../../../component/UI/DividerWithImage";
import ShubhTalkLogo from "../../../assets/icons/logo.png";
import styles from "./SignScreen";

const Horoscope = () => {
  const [description, horoDisc, onChat, onClickSign, data] = useHoroscope();

  // return (
  //   <>
  //     <HoroScopeBanner data={data} onClickSign={onClickSign} />
  //     <MoreHscope />
  //     <ContentCard
  //       title="Daily planetary movements"
  //       description={description}
  //       bgColor={appColors.sec}
  //       showDate={true}
  //     />
  //     <ContentCard
  //       title="What is a Horoscope?"
  //       description={horoDisc}
  //       bgColor={appColors.app_bg}
  //     />
  //     <Astrologers onChat={onChat} />
  //     <Blogs />
  //   </>
  // );

  return (
    <div className={styles.dailyContainer}>
      <PrimaryText isCenter isBold size_32>
        Horoscope
      </PrimaryText>
      <PrimaryText isCenter isSemiBold size_18 color={appColors.greyDark}>
        Check your Horoscope
      </PrimaryText>
      <DividerWithImage imageSrc={ShubhTalkLogo} />
    </div>
  );
};

export default Horoscope;
