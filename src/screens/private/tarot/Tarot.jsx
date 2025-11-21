import React, { useState } from "react";
import InternalBanner from "../../../component/UI/cards/internalBanner/InternalBanner";
import HtmlContentCard from "../../../component/UI/cards/htmlContenCard/HtmlContentCard";
import { useGetTarotShuffleDataQuery } from "../../../redux/api/tarot/tarotApi";
import PrimaryLoader from "../../../component/UI/PrimaryLoader";
import TarotCardDisplay from "./TarotCardDisplay";
// import { useGetTarotShuffleDataQuery } from "../../../redux/api/tarot/tarotApi";

const Tarot = () => {
  const { data, isLoading } = useGetTarotShuffleDataQuery({
    shuffle_type: "major", // change if dynamic
    lang: "en",
  });

  if (isLoading) return(<PrimaryLoader/>);

  // API mappings
  const tarotReadingData = data?.response || [];
  console.log("tarotReadingData",JSON.stringify(tarotReadingData));


  return (
    <>
     <TarotCardDisplay data={tarotReadingData}/>
    </>
  );
};

export default Tarot;
