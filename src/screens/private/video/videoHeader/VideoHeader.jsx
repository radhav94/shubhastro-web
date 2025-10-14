import React, { useState, useEffect } from "react";
import styles from "./VideoHeader.module.scss";

// --- UPDATED Data with Real YouTube Links ---
const mainVideoData = {
  id: 1,
  videoId: "l0Y7xOOcYPQ", // Real Video ID
  thumbnailUrl: "https://i.ytimg.com/vi/l0Y7xOOcYPQ/maxresdefault.jpg",
  channelIconUrl: "http://googleusercontent.com/profile/picture/4",
  channelName: "Sadhguru",
  uploadDate: "Feb 10, 2021",
  views: "2.1M",
  title: "The Power of Mars in Yogic Mysticism - Sadhguru",
};

const subsidiaryVideosData = [
  {
    id: 2,
    videoId: "bjUIq_qGfKE",
    thumbnailUrl: "https://i.ytimg.com/vi/bjUIq_qGfKE/maxresdefault.jpg",
    channelIconUrl: "http://googleusercontent.com/profile/picture/5",
    channelName: "The Art of Living",
    uploadDate: "Jul 29, 2022",
    views: "215K",
    title:
      "How To Choose The Right Path in Life? | Gurudev Sri Sri Ravi Shankar",
  },
  {
    id: 3,
    videoId: "NGk3fCoJtBA", // Real Video ID
    thumbnailUrl: "https://i.ytimg.com/vi/NGk3fCoJtBA/maxresdefault.jpg",
    channelIconUrl: "http://googleusercontent.com/profile/picture/6",
    channelName: "Dr. Puneet Chawla",
    uploadDate: "Oct 2, 2021",
    views: "588K",
    title:
      "घर में पैसों की तंगी को दूर करेगा ये वास्तु उपाय | Vastu Tips for Money",
  },
  {
    id: 4,
    videoId: "bjUIq_qGfKE", // Real Video ID
    thumbnailUrl: "https://i.ytimg.com/vi/bjUIq_qGfKE/maxresdefault.jpg",
    channelIconUrl: "http://googleusercontent.com/profile/picture/7",
    channelName: "Gaur Gopal Das",
    uploadDate: "May 25, 2022",
    views: "1.2M",
    title: "Do This For 15 Mins Everyday | Gaur Gopal Das",
  },
];

const PlayIcon = () => (
  <svg height="100%" version="1.1" viewBox="0 0 36 36" width="100%">
    <path
      fill="#fff"
      d="M 12,26 18.5,22 18.5,14 12,10 z M 18.5,22 25,18 25,18 18.5,14 z"
    ></path>
  </svg>
);

const VideoHeader = () => {
  const [isMainVideoPlaying, setIsMainVideoPlaying] = useState(false);

  // Reset video player state if the data changes
  useEffect(() => {
    setIsMainVideoPlaying(false);
  }, [mainVideoData]);

  const handlePlayMainVideo = () => {
    setIsMainVideoPlaying(true);
  };

  const youtubeLink = (videoId) => `https://www.youtube.com/watch?v=${videoId}`;
  const youtubeEmbedLink = (videoId) =>
    `https://www.youtube.com/embed/${videoId}?autoplay=1`;

  return (
    <div className={styles.videoContainer}>
      {/* --- Main Video Section --- */}
      <div className={styles.leftContainer}>
        <article className={styles.mainVideoCard}>
          {isMainVideoPlaying ? (
            <div className={styles.videoPlayer}>
              <iframe
                src={youtubeEmbedLink(mainVideoData.videoId)}
                title={mainVideoData.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          ) : (
            <div
              className={styles.thumbnailWrapper}
              onClick={handlePlayMainVideo}
            >
              <img
                src={mainVideoData.thumbnailUrl}
                alt={mainVideoData.title}
                className={styles.mainThumbnail}
              />
              <div className={styles.playIconOverlay}>
                <PlayIcon />
              </div>
            </div>
          )}

          <div className={styles.mainVideoContent}>
            <h2 className={styles.mainTitle}>{mainVideoData.title}</h2>
            <div className={styles.channelInfo}>
              <img
                src={mainVideoData.channelIconUrl}
                alt={mainVideoData.channelName}
                className={styles.channelImage}
              />
              <div className={styles.channelDetails}>
                <span className={styles.channelName}>
                  {mainVideoData.channelName}
                </span>
                <span
                  className={styles.metaInfo}
                >{`${mainVideoData.views} views · ${mainVideoData.uploadDate}`}</span>
              </div>
            </div>
          </div>
        </article>
      </div>

      {/* --- Subsidiary Videos Section (Scrollable Links) --- */}
      <div className={styles.rightContainer}>
        {subsidiaryVideosData.map((video) => (
          <a
            href={youtubeLink(video.videoId)}
            target="_blank"
            rel="noopener noreferrer"
            key={video.id}
            className={styles.subsidiaryLink}
          >
            <article className={styles.subsidiaryVideoItem}>
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className={styles.subsidiaryThumbnail}
              />
              <div className={styles.subsidiaryContent}>
                <h3 className={styles.subsidiaryTitle}>{video.title}</h3>
                <div className={styles.subsidiaryChannelInfo}>
                  <img
                    src={video.channelIconUrl}
                    alt={video.channelName}
                    className={styles.subsidiaryChannelImage}
                  />
                  <span>{video.channelName}</span>
                </div>
              </div>
            </article>
          </a>
        ))}
      </div>
    </div>
  );
};

export default VideoHeader;
