import FeedbackModal from "./FeedbackModal";
import React from "react";

const Feedback = ({ open, onClose, handleSubmit, ratedUserName, profileImgUrl, loading }) => {

  return (
    <>
      <FeedbackModal
        open={open}
        onClose={onClose}
        handleSubmit={handleSubmit}
        ratedUserName={ratedUserName}
        profileImgUrl={profileImgUrl}
        loading={loading}
      />
    </>
  );
};

export default Feedback;
