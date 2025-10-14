import React from "react";
import { WorkInProgressCard } from "../../../component";
import InternalBanner from "../../../component/UI/cards/internalBanner/InternalBanner";
import { useTarote } from "./useTarot";
import HtmlContentCard from "../../../component/UI/cards/htmlContenCard/HtmlContentCard";

const Tarot = () => {
  const [tarotReadingData, tarotContentData, onCardClick] = useTarote();

  return (
    <>
      <InternalBanner data={tarotReadingData} onCardClick={onCardClick} />
      <HtmlContentCard sections={tarotContentData} />
    </>
  );
};

export default Tarot;
