import React from "react";
import { useTodayPanchang } from "./useTodayPanchang";
import InternalBanner from "../../../../component/UI/cards/internalBanner/InternalBanner";
import { PanchangInputCard } from "../../../../component";

const TodayPanchang = () => {
  const [data, onCardClick] = useTodayPanchang();
  return (
    <>
      <InternalBanner data={data} onCardClick={onCardClick} />
      <PanchangInputCard
        imageSrc={
          "https://images.astroyogi.com/astroyogi/panchang/panchang_widget.webp"
        }
      />
    </>
  );
};

export default TodayPanchang;
