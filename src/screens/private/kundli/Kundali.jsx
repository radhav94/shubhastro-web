import KundaliHeader from "./kundaliHeader/KundaliHeader";
import PrimaryTabs from "../../../component/UI/tabs/PrimaryTabs";
import BasicContent from "./BasicContent/BasicContent";
import KundaliContent from "./kundaliContent/KundaliContent";
import HtmlContentCard from "../../../component/UI/cards/htmlContenCard/HtmlContentCard";
import { useRef, useEffect } from "react";

import PrimaryLoader from "../../../component/UI/PrimaryLoader";
import { useKundli } from "./useKundli";
import KpContent from "./KpContent/KpContent";
import ChartsContent from "./ChartsContent/ChartsContent";
import AshtakvargaContent from "./AshtakvargaContent/AshtakvargaContent";
import DashaContent from "./DashaContent/DashaContent";
import { IoMdCall } from "react-icons/io";
import { IoChatbubble } from "react-icons/io5";
import FreeReport from "./FreeReportContent/FreeReportContent";
import {
  useFetchBirthDetailsQuery,
  useGetAstroDetailsQuery,
  useGetBasicPanchangQuery,
} from "../../../redux/api/kundli/kundliApi";
import { useSelector } from "react-redux";
import { skipToken } from "@reduxjs/toolkit/query";
import Report from "./FreeKundli/Report";

const Kundali = () => {
  const contentRef = useRef(null);

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
    report,
  ] = useKundli();

  const payload = useSelector((state) => state?.form?.kundliPayload);
  const {
    data: birthDetails,
    isSuccess: isBirth,
    isLoading: birthLoading,
  } = useFetchBirthDetailsQuery(payload ? { payload } : skipToken);

  const {
    data: birthPanchang,
    isSuccess: isPanchang,
    isLoading: panchangLoading,
  } = useGetBasicPanchangQuery(payload ? { payload } : skipToken);
  const {
    data: astroDetails,
    isSuccess: isAstro,
    isLoading: astroLoading,
  } = useGetAstroDetailsQuery(payload ? { payload } : skipToken);

  const tabsData = [
    {
      label: "Basic",
      content: (
        <BasicContent
          birthDetails={birthDetails}
          birthPanchang={birthPanchang}
          astroDetails={astroDetails}
        />
      ),
    },
    {
      label: "Kundli",
      content: <KundaliContent />,
    },
    {
      label: "KP",
      content: <KpContent />,
    },
    {
      label: "Ashtakvarga",
      content: <AshtakvargaContent />,
    },
    {
      label: "Charts",
      content: <ChartsContent />,
    },
    {
      label: "Dasha",
      content: <DashaContent />,
    },
    {
      label: "Free Report",
      content: <Report />,
    },
  ];

  useEffect(() => {
    if (isBirth || isPanchang || isAstro) {
      contentRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }
  }, [isBirth, isPanchang, isAstro]);

  return (
    <>
      <KundaliHeader />

      <PrimaryLoader
        isLoading={birthLoading || panchangLoading || astroLoading}
      />

      <div ref={contentRef}>

      {isBirth || isPanchang || isAstro ? (
        <PrimaryTabs tabs={tabsData} />
      ) : (
        <HtmlContentCard sections={kundliInfoData} />
      )}
      </div>
    </>
  );
};

export default Kundali;
