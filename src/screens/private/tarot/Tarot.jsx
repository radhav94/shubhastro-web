import React, { useState } from "react";
import InternalBanner from "../../../component/UI/cards/internalBanner/InternalBanner";
import HtmlContentCard from "../../../component/UI/cards/htmlContenCard/HtmlContentCard";
import { useGetTarotShuffleDataQuery } from "../../../redux/api/tarot/tarotApi";
import PrimaryLoader from "../../../component/UI/PrimaryLoader";
import TarotCardDisplay from "./TarotCardDisplay";

const Tarot = () => {
  const { data, isLoading } = useGetTarotShuffleDataQuery({
    shuffle_type: "both", // change if dynamic
    lang: "en",
  });

  if (isLoading) return <PrimaryLoader />;

  // API mappings
  const tarotReadingData = data?.response || [];

  return (
    <>
      <TarotCardDisplay data={tarotReadingData} />
    </>
  );
};

export default Tarot;
