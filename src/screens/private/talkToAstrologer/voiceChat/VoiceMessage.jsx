import { useEffect, useRef, useState } from "react";
import { IoPlay, IoPause } from "react-icons/io5";
import { playAudio, stopAudio } from "./audioController";
import styles from "./VoiceMessage.module.scss";

const VoiceMessage = ({ url, duration, time, isSender }) => {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.paused ? playAudio(audio) : stopAudio(audio);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      setPlaying(false);
      setProgress(0);
    };

    const onTimeUpdate = () => {
      if (!audio.duration || !isFinite(audio.duration) || audio.duration <= 0) return;
      setProgress((audio.currentTime / audio.duration) * 100);
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("timeupdate", onTimeUpdate);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, []);

  return (
    <div className={isSender ? styles.voiceBubble : styles.voiceBubbleAstro}>
      <button className={styles.playBtn} onClick={togglePlay}>
        {playing ? <IoPause /> : <IoPlay />}
      </button>

      <div className={styles.content}>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className={styles.meta}>
          <span className={styles.duration}>
            {duration && isFinite(duration) && duration > 0 ? `${duration}s` : '--'}
          </span>
          {/* <span className={styles.time}>{time}</span> */}
        </div>
      </div>

      <audio ref={audioRef} src={url} preload="metadata" />
    </div>
  );
};

export default VoiceMessage;
