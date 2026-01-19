import { useRef, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { skipToken } from "@reduxjs/toolkit/query";
import PrimaryTabs from "../../../component/UI/tabs/PrimaryTabs";
import BasicContent from "./BasicContent/BasicContent";
import KundaliContent from "./kundaliContent/KundaliContent";
import HtmlContentCard from "../../../component/UI/cards/htmlContenCard/HtmlContentCard";
import PrimaryLoader from "../../../component/UI/PrimaryLoader";
import { useKundli } from "./useKundli";
import KpContent from "./KpContent/KpContent";
import ChartsContent from "./ChartsContent/ChartsContent";
import AshtakvargaContent from "./AshtakvargaContent/AshtakvargaContent";
import DashaContent from "./DashaContent/DashaContent";
import Report from "./FreeKundli/Report";
import { buildVedicParam } from "../../../utils/VedicParams.js/vedicParams";
import Prediction from "./FreeKundli/Prediction";
import {
  useGetPlanetsQuery,
  useGetAstroDetailsQuery,
} from "../../../redux/api/kundli/kundliApi";
import {
  useGetAllKundlisQuery,
  useCreateKundliMutation,
  useDeleteKundliMutation,
} from "../../../services/appServices/kundliServicesNew";
import { setForm } from "../../../redux/kundliform/formSlice";
import { Toast } from "../../../component";
import ProfileSelector from "./components/ProfileSelector";
import KundliHeader from "./components/KundliHeader";
import KundliInfoContent from "./components/KundliInfoContent";
import ProfileModals from "./components/ProfileModals";
import { useProfileManager } from "./hooks/useProfileManager";

const Kundali = () => {
  const contentRef = useRef(null);
  const dispatch = useDispatch();

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

  // Use custom hook for profile management
  const {
    selectedProfile,
    profiles,
    profilesLoading,
    isCreating,
    showSelectProfile,
    showAddProfile,
    showEditProfile,
    formData,
    editFormData,
    setShowSelectProfile,
    setShowAddProfile,
    setShowEditProfile,
    setFormData,
    setEditFormData,
    handleSelectProfile,
    handleAddProfile,
    handleEditProfile,
    handleSubmitProfile,
    handleSubmitEditProfile,
    formatProfileDisplay,
  } = useProfileManager(dispatch);

  const payload = useSelector((state) => state?.form?.kundliPayload);
  const params = buildVedicParam(payload);

  const {
    data: fullData,
    isLoading: planetLoading,
    isSuccess: planetSuccess,
  } = useGetPlanetsQuery(params ? params : skipToken);

  const {
    data,
    isSuccess: isAstro,
    isLoading: astroLoading,
  } = useGetAstroDetailsQuery(params ? params : skipToken);

  const astroDetails = data?.response;

  const tabsData = [
    {
      label: "Basic",
      content: (
        <BasicContent
          birthDetails={fullData?.response}
          birthPanchang={fullData?.response?.panchang}
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
    {
      label: "12 Months Prediction",
      content: <Prediction params={params} skipToken={skipToken} />,
    },
  ];

  useEffect(() => {
    if (planetLoading || isAstro) {
      contentRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }
  }, [planetLoading, isAstro]);

  return (
    <div>
      {profilesLoading && <PrimaryLoader />}

      {/* Free Kundli Online Title - Always visible, above profile selector */}
      <KundliHeader />

      {/* Profile Selector - Always visible */}
      <ProfileSelector
        selectedProfile={selectedProfile}
        onSelectClick={() => setShowSelectProfile(true)}
        onEditClick={handleEditProfile}
      />

      {/* Show informational content only when no profile is selected */}
      {!selectedProfile && <KundliInfoContent />}

      <PrimaryLoader isLoading={planetLoading || astroLoading} />

      {/* Show tabs only when profile is selected and data is loaded */}
      {selectedProfile && (
        <div ref={contentRef} id="kundli-tabs">
          {planetLoading || isAstro ? (
            <PrimaryTabs tabs={tabsData} />
          ) : (
            <HtmlContentCard sections={kundliInfoData} />
          )}
        </div>
      )}

      {/* All Modals */}
      <ProfileModals
        showSelectProfile={showSelectProfile}
        showAddProfile={showAddProfile}
        showEditProfile={showEditProfile}
        profiles={profiles}
        selectedProfile={selectedProfile}
        formData={formData}
        editFormData={editFormData}
        isCreating={isCreating}
        onCloseSelect={() => setShowSelectProfile(false)}
        onCloseAdd={() => setShowAddProfile(false)}
        onCloseEdit={() => setShowEditProfile(false)}
        onSelectProfile={handleSelectProfile}
        onAddProfile={handleAddProfile}
        onSubmitProfile={handleSubmitProfile}
        onSubmitEditProfile={handleSubmitEditProfile}
        setFormData={setFormData}
        setEditFormData={setEditFormData}
        formatProfileDisplay={formatProfileDisplay}
      />
    </div>
  );
};

export default Kundali;
