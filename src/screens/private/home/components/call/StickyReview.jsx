import { useNavigate } from "react-router-dom";
import { useCall } from "../../../../../context/CallContext";
import { useAddAstrologerReviewMutation } from "../../../../../redux/api/review/reviewApi";
import { Toast } from "../../../../../component";
import FeedbackModal from "../../../home/components/chats/FeedbackModal";

const StickyReview = () => {
  const {
    openReview,
    setOpenReview,
    reviewData
  } = useCall();
  const navigate = useNavigate();
  const [addAstrologerReview] = useAddAstrologerReviewMutation();

  if (!openReview)
    return null;

  const handleReviewSubmit = async ({ rating, review, isAnonymous }) => {
    try {
      const astrologerID = reviewData?.astrologerID || reviewData?.astrologer_ID || reviewData?.astrologerId;
      
      if (!astrologerID) {
        Toast.error("Something went wrong. Please try again.");
        setOpenReview(false);
        return;
      }

      const res = await addAstrologerReview({
        astrologerID,
        rating,
        review,
        isAnonymous,
        roomId: reviewData?.roomId,
      }).unwrap();

      if (res.success) {
        Toast.success(res.message || "Review submitted successfully");
        setOpenReview(false);
      } else {
        Toast.error("Something went wrong. Please try again.");
        setOpenReview(false);
      }
    } catch (err) {
      // Show generic error instead of raw API message
      Toast.error("Something went wrong. Please try again.");
      setOpenReview(false);
    }
  };
  return (
    <div>
        <FeedbackModal
          open={openReview}
          onClose={() => setOpenReview(false)}
          handleSubmit={handleReviewSubmit}
          ratedUserName={reviewData?.fullName}
          profileImgUrl={reviewData?.profileImage || reviewData?.profileImgUrl}
          gender={reviewData?.gender}
        />
    </div>
  );
};

export default StickyReview;
