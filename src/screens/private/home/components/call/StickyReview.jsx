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
      const res = await addAstrologerReview({
        astrologerID: reviewData?.astrologerID,
        rating,
        review,
        isAnonymous,
      }).unwrap();

      if (res.success) {
        Toast.success(res.message);
        // navigate(-1); // or home
      } else {
        Toast.error(res.message);
      }

      setOpenReview(false);
    } catch (err) {
      Toast.error("Failed to submit review");
    }
  };
  return (
    <div>
        <FeedbackModal
          open={openReview}
          onClose={() => setOpenReview(false)}
          handleSubmit={handleReviewSubmit}
          ratedUserName={reviewData?.fullName}
          reviewerName="You"
        />
    </div>
  );
};

export default StickyReview;
