import KundaliHeader from "./kundaliHeader/KundaliHeader";
import PrimaryTabs from "../../../component/UI/tabs/PrimaryTabs";
import BasicContent from "./BasicContent/BasicContent";
import KundaliContent from "./kundaliContent/KundaliContent";
import HtmlContentCard from "../../../component/UI/cards/htmlContenCard/HtmlContentCard";
import { useState } from "react";

import PrimaryLoader from "../../../component/UI/PrimaryLoader";
import { useKundli } from "./useKundli";
import KpContent from "./KpContent/KpContent";
import ChartsContent from "./ChartsContent/ChartsContent";
import AshtakvargaContent from "./AshtakvargaContent/AshtakvargaContent";
import DashaContent from "./DashaContent/DashaContent";
import { IoMdCall } from "react-icons/io";
import { IoChatbubble } from "react-icons/io5";
import FreeReport from "./FreeReportContent/FreeReportContent";


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
    kpDetails,
    charts,
    ashtakvarga,
    dasha,
    report
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
    {
      label: "KP",
      content: <KpContent userData={userData} data={kpDetails} />,
    },
    {
      label: "Ashtakvarga",
      content: <AshtakvargaContent userData={userData} data={ashtakvarga} />,
    },
    {
      label: "Charts",
      content: <ChartsContent userData={userData} data={charts} />,
    },
    {
      label: "Dasha",
      content: <DashaContent userData={userData} data={dasha} />,
    },
    {
      label: "Free Report",
      content: <FreeReport userData={userData} data={report} />,
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
      <div className="bg-[#ffcb03] m-6 h-48 rounded-md" >
        <div>
          <p className="text-center text-2xl py-4 px-52  text-gray-500" >Connect with an Astrologer on Call or Chat for more personalised detailed predictions.</p>
          <div className="flex justify-center" >
            <div className="flex items-center justify-center rounded-full m-3 my-1 bg-white p-5 hover:text-white hover:bg-gray-700 transition-all duration-300" >
              <IoMdCall size={26} color="#ffcb03" />
              <button className="mx-1">Talk to Astrologer</button>
            </div>
            <div className="flex items-center justify-center rounded-full m-3 my-1 bg-white p-5 hover:text-white hover:bg-gray-700 transition-all duration-300" >
              <IoChatbubble size={26} color="#ffcb03" />
              <button className="mx-1">Chat to Astrologer</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Kundali;
