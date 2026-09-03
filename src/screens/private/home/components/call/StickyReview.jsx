import { useNavigate } from "react-router-dom";
import { useCall } from "../../../../../context/CallContext";
import { useAddAstrologerReviewMutation } from "../../../../../redux/api/review/reviewApi";
import { Toast } from "../../../../../component";
import FeedbackModal from "../../../home/components/chats/FeedbackModal";
import { trackEvent } from "../../../../../utils/analytics";

const StickyReview = () => {
  const {
    openReview,
    setOpenReview,
    reviewData
  } = useCall();
  const navigate = useNavigate();
  // `isLoading` was never read, so FeedbackModal's `loading` prop arrived
  // undefined: the button never showed "Submitting..." and a second tap while
  // the request was in flight posted the review twice. It matters more now that
  // the button is no longer natively disabled (see FeedbackModal).
  const [addAstrologerReview, { isLoading: isSubmittingReview }] =
    useAddAstrologerReviewMutation();

  if (!openReview)
    return null;

  /*
   * Returns false when the review could not be posted, which keeps FeedbackModal
   * mounted and its text intact so the visitor can retry.
   *
   * Every failure path here used to call setOpenReview(false). StickyReview
   * renders null while closed, so that unmounted the modal and threw away the
   * review — after telling the user to "try again", with nothing left to try
   * again with. Only success closes it now.
   */
  const handleReviewSubmit = async ({ rating, review, isAnonymous }) => {
    const astrologerID =
      reviewData?.astrologerID || reviewData?.astrologer_ID || reviewData?.astrologerId;

    if (!astrologerID) {
      // Not retryable: the id is missing from the data this modal was opened
      // with, so submitting again cannot succeed. Say what actually helps
      // rather than "try again", and leave the text on screen.
      Toast.error("We couldn't identify this astrologer. Please reload the page and try again.");
      return false;
    }

    try {
      const res = await addAstrologerReview({
        astrologerID,
        rating,
        review,
        isAnonymous,
        roomId: reviewData?.roomId,
      }).unwrap();

      if (!res.success) {
        Toast.error("Couldn't post your review. Please try again.");
        return false;
      }

      Toast.success(res.message || "Review submitted successfully");
      trackEvent("session_rated", { astrologer_id: astrologerID, session_id: reviewData?.roomId, rating });
      if (review) {
        trackEvent("session_review_submitted", { astrologer_id: astrologerID, session_id: reviewData?.roomId, review_length: review.length });
      }
      setOpenReview(false);
      return true;
    } catch {
      // Generic copy on purpose — the raw API message is not user-facing.
      Toast.error("Couldn't post your review. Please try again.");
      return false;
    }
  };
  return (
    <div>
        <FeedbackModal
          open={openReview}
          onClose={() => setOpenReview(false)}
          handleSubmit={handleReviewSubmit}
          loading={isSubmittingReview}
          ratedUserName={reviewData?.fullName}
          profileImgUrl={reviewData?.profileImage || reviewData?.profileImgUrl}
          gender={reviewData?.gender}
        />
    </div>
  );
};

export default StickyReview;
