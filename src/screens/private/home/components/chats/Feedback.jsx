import FeedbackModal from "./FeedbackModal";
import React from "react";

const Feedback = ({ open, onClose, handleSubmit, ratedUserName, reviewerName, loading }) => {

  return (
    <>
      <FeedbackModal
        open={open}
        onClose={onClose}
        handleSubmit={handleSubmit}
        ratedUserName={ratedUserName}
        reviewerName={reviewerName}
        loading={loading}
      />
    </>
  );
};

export default Feedback;
