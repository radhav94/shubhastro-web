import React, { useState } from "react";
import styles from "./AstrologerProfile.module.scss";
import { FaCheckCircle, FaVideo } from "react-icons/fa";
import { FaPhoneAlt } from "react-icons/fa";
import { FaComments } from "react-icons/fa";
import GiftSection from "./GiftSection";
import { useGetAstrologerByIdQuery } from "../../../redux/api/astrologer/astrologerApi";
import { useNavigate, useParams } from "react-router-dom";
import { ErrorText } from "../../../component";
import toast from "../../../component/toast";
import {
  useFollowAstrologerByIdMutation,
  useUnfollowAstrologerByIdMutation,
} from "../../../redux/api/astrologer/followAstrologerApi";

const AstrologerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    data: astrologerData,
    isLoading,
    error,
  } = useGetAstrologerByIdQuery({ id }, { skip: !id });
  const isInitiallyFollowing = astrologerData?.data?.isFollowing || false;
  const [isFollowing, setIsFollowing] = useState(isInitiallyFollowing);

  const [followAstrologer, { isLoading: followLoading }] =
    useFollowAstrologerByIdMutation();

  const [unfollowAstrologer, { isLoading: unfollowLoading }] =
    useUnfollowAstrologerByIdMutation();

  const handleFollow = async () => {
    try {
      if (!data?._id) return;

      if (!isFollowing) {
        // FOLLOW API CALL
        await followAstrologer({ astrologerId: data.ID }).unwrap();
        toast.success(
          `We will notify you when ${
            data?.firstName || ""
          } goes live or posts an update!`
        );
      } else {
        // UNFOLLOW API CALL
        await unfollowAstrologer({ astrologerId: data.ID }).unwrap();
        toast.success(`You unfollowed ${data?.firstName}`);
      }

      setIsFollowing(!isFollowing);
    } catch (err) {
      console.log("Follow/Unfollow error:", err);
    }
  };

  const handleTalk = () => navigate(`/talk-to-astrologers`);

  const data = astrologerData?.data;
  if (isLoading) return <p>Loading...</p>;
  if (error) return <ErrorText>Something went wrong!</ErrorText>;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.leftBlock}>
          <img
            src={data?.imageUrl}
            className={styles.profileImg}
            alt="profile"
          />

          {/* FOLLOW BUTTON */}
          <button
            className={`${styles.followBtn} ${
              isFollowing ? styles.following : ""
            }`}
            onClick={handleFollow}
            disabled={followLoading || unfollowLoading}
          >
            {followLoading || unfollowLoading
              ? "..."
              : isFollowing
              ? "Following"
              : "Follow"}
          </button>
        </div>

        <div className={styles.headerInfo}>
          <div className={styles.nameRow}>
            <h1>{data?.firstName + " " + data?.lastName}</h1>
            {data?.isVerified && (
              <FaCheckCircle className={styles.verifyIcon} />
            )}
          </div>

          <p>{data?.specialities?.map((s) => s).join(", ") || ""}</p>
          <p className={styles.light}>
            Languages: {data?.languagePreference?.map((l) => l).join(", ")}
          </p>
          <p className={styles.light}>Exp : {data?.experience} Years </p>

          <h3 className={styles.price}>₹ {data?.price?.amount}/min</h3>

          <div className={styles.stats}>
            <span>💬 {data?.chatMinutes || 0} mins</span>
            <span>📞 {data?.callMinutes || 0} mins</span>
          </div>

          <div className={styles.actionRow}>
            <button className={styles.chatBtn} onClick={handleTalk}>
              <FaComments /> Start Chat
            </button>
            <button className={styles.callBtn} onClick={handleTalk}>
              <FaPhoneAlt /> Start Call
            </button>
            <button className={styles.videoCallBtn} onClick={handleTalk}>
              <FaVideo /> Start Video
            </button>
          </div>
        </div>
      </div>

      {/* Gallery */}
      {/* <div className={styles.gallery}>
        {data?.gallery?.map((img, index) => (
          <img key={index} src={img} alt="" />
        ))}
      </div> */}

      {/* About */}
      <div className={styles.about}>
        <h2>About me</h2>
        <p>{data.description}</p>
      </div>

      {data?.rating && (
        <div className={styles.ratingAndReview}>
          {/* Rating Section */}
          <div className={styles.ratingSection}>
            <h2>Rating & Reviews</h2>

            <div className={styles.ratingSummary}>
              <div className={styles.ratingValue}>
                <h1>{data.rating} </h1>
                <p>⭐ ⭐ ⭐ ⭐ ⭐</p>
                {/* <p>{data?.ratingTotal || 5} total</p> */}
              </div>

              {/* <div className={styles.ratingBars}>
              {Object.entries(data.ratingDistribution)?.map(
                ([star, percent]) => (
                  <div key={star} className={styles.barRow}>
                    <span>{star}</span>
                    <div className={styles.bar}>
                      <div style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                )
              )}
            </div> */}
            </div>
          </div>

          {/* Reviews */}
          {data?.reviews?.length > 0 && (
            <div className={styles.reviews}>
              <h2>User Reviews</h2>

              {data?.reviews?.map((rev, i) => (
                <div key={i} className={styles.reviewCard}>
                  <div className={styles.reviewHeader}>
                    <h4>{rev.user}</h4>
                    <span>{"⭐".repeat(rev.rating)}</span>
                  </div>
                  <p>{rev.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <GiftSection astrologerId={data?.ID} />
    </div>
  );
};

export default AstrologerProfile;
