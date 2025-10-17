import KundaliHeader from "./kundaliHeader/KundaliHeader";
import PrimaryTabs from "../../../component/UI/tabs/PrimaryTabs";
import BasicContent from "./BasicContent/BasicContent";
import KundaliContent from "./kundaliContent/KundaliContent";
import HtmlContentCard from "../../../component/UI/cards/htmlContenCard/HtmlContentCard";
import { useState } from "react";

import PrimaryLoader from "../../../component/UI/PrimaryLoader";
import { useKundli } from "./useKundli";

const Kundali = () => {
  const [
    dataIsFilled,
    setDataIsFilled,
    isLoading,
    setIsLoading,
    basicData,
    setBasicData,
    kundliInfoData,
    monthMap,
    onGenerateClick,
    userData,
    planetData,
  ] = useKundli();

  const tabsData = [
    {
      label: "Basic",
      content: <BasicContent basicData={basicData} userData={userData} />,
    },
    {
      label: "Kundli",
      content: <KundaliContent userData={userData} data={planetData} />,
    },
  ];

  return (
    <>
      <KundaliHeader onGenerateClick={onGenerateClick} />
      <PrimaryLoader isLoading={isLoading} />

      {dataIsFilled ? (
        <PrimaryTabs tabs={tabsData} />
      ) : (
        <HtmlContentCard sections={kundliInfoData} />
      )}
    </>
  );
};

export default Kundali;
