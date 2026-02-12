import React from "react";
import styles from "./TopAstrologerCard.module.scss";
import { FaStar } from "react-icons/fa";
import { PiBookOpenTextLight } from "react-icons/pi";
import astrologerImage from "../../../assets/images/top-rated-1.svg";
import { Link } from "react-router-dom";
import { DefaultImages } from "../../../utils/appImages";

const TopAstrologerCard = ({ data, onConnect }) => {
  // Handle rating - use rating field or default to 4.5
  const rating = data?.rating || 4.5;

  // Handle experience - convert to number if string
  const experience = parseInt(data?.experience) || 0;

  // Handle image - try multiple possible fields
  const imageUrl =
    data?.imageUrl ||
    data?.aadharCardImgUrl ||
    data?.panCardImgUrl ||
    astrologerImage;

  return (
    <div className={styles.topAstrologerCard}>
      <Link
        to={`/astrologer/${data?.astrologerId || data?._id} `}
        className={styles.cardLink}
      >
        <div className={styles.imageContainer}>
          <img
            src={imageUrl || DefaultImages.AstrologerDefaultImg}
            alt={`${data?.firstName} ${data?.lastName}`}
            className={styles.profileImage}
            onError={(e) => {
              e.target.src = astrologerImage;
            }}
          />
        </div>

        <div className={styles.ratingBadge}>
          <FaStar className={styles.starIcon} />
          <span>{rating.toFixed(1)}</span>
        </div>

        <h3 className={styles.name}>
          {data?.firstName} {data?.lastName}
        </h3>

        {experience > 0 && (
          <div className={styles.experience}>
            <PiBookOpenTextLight className={styles.bookIcon} />
            <span>{experience} years exp.</span>
          </div>
        )}
      </Link>
      <button className={styles.connectButton} onClick={onConnect}>
        Connect
      </button>
    </div>
  );
};

export default TopAstrologerCard;
