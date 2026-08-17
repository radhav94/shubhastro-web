import FeedbackModal from "./FeedbackModal";

const Feedback = ({
  open,
  onClose,
  handleSubmit,
  ratedUserName,
  profileImgUrl,
  loading,
  gender,
}) => {
  return (
    <FeedbackModal
      open={open}
      onClose={onClose}
      handleSubmit={handleSubmit}
      ratedUserName={ratedUserName}
      profileImgUrl={profileImgUrl}
      loading={loading}
      gender={gender}
    />
  );
};

export default Feedback;
