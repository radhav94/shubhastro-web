import FeedbackModal from "./FeedbackModal";
import React from "react";

const Feedback = ({ open, onClose, handleSubmit, ratedUserName, profileImgUrl, loading, gender }) => {

  return (
    <>
      <FeedbackModal
        open={open}
        onClose={onClose}
        handleSubmit={handleSubmit}
        ratedUserName={ratedUserName}
        profileImgUrl={profileImgUrl}
        loading={loading}
        gender={gender}
      />
    </>
  );
};

export default Feedback;
