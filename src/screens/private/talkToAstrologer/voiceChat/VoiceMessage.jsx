import { useEffect, useRef, useState, useCallback } from "react";
import { playAudio, stopAudio } from "./audioController";
import styles from "./VoiceMessage.module.scss";

const fmt = (s) => {
  if (!s || !isFinite(s) || s <= 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
};

// Generate fake waveform bars (consistent per URL)
const getWaveBars = (url, count = 40) => {
  let hash = 0;
  for (let i = 0; i < (url?.length || 0); i++) hash = (hash * 31 + url.charCodeAt(i)) & 0xffffffff;
  return Array.from({ length: count }, (_, i) => {
    const h = Math.abs(Math.sin((hash + i * 137) * 0.1)) * 0.7 + 0.15;
    return Math.round(h * 100) / 100;
  });
};

const VoiceMessage = ({ url, duration, time, isSender }) => {
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration > 0 ? duration : 0);
  // Update totalDuration when prop changes (AudioMessageWrapper fetches it async)
  useEffect(() => {
    if (duration > 0) setTotalDuration(duration);
  }, [duration]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => { setPlaying(false); setCurrentTime(0); };
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      if (isFinite(audio.duration) && audio.duration > 0) {
        setTotalDuration(audio.duration);
      }
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.paused ? playAudio(audio) : stopAudio(audio);
  }, []);

  // Click on waveform to seek
  const handleSeek = useCallback((e) => {
    const audio = audioRef.current;
    if (!audio || !totalDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * totalDuration;
  }, [totalDuration]);

  const progress = totalDuration > 0 ? (currentTime / totalDuration) : 0;
  const bars = getWaveBars(url);
  const activeBars = Math.floor(progress * bars.length);

  return (
    <div className={`${styles.voiceBubble} ${isSender ? styles.sender : styles.receiver}`}>
      {/* Play/Pause button */}
      <button className={styles.playBtn} onClick={togglePlay}>
        {playing ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        )}
      </button>

      {/* Waveform + scrubber */}
      <div className={styles.waveWrap} onClick={handleSeek}>
        {/* Progress dot — clamped within waveform */}
        <div
          className={styles.scrubDot}
          style={{ left: `${Math.min(Math.max(progress * 100, 1), 98)}%` }}
        />
        {/* Bars */}
        <div className={styles.waveform}>
          {bars.map((h, i) => (
            <span
              key={i}
              className={`${styles.bar} ${i < activeBars ? styles.barActive : ''}`}
              style={{ height: `${Math.max(h * 100, 15)}%` }}
            />
          ))}
        </div>
      </div>

      {/* Time */}
      <div className={styles.timeMeta}>
        <span className={styles.currentTime}>
          {playing
            ? fmt(currentTime)                          // playing → show current position
            : currentTime > 0
              ? fmt(currentTime)                        // paused → show pause position
              : fmt(totalDuration)                      // idle/ended → show total duration
          }
        </span>
      </div>

      <audio ref={audioRef} src={url} preload="metadata" />
    </div>
  );
};

export default VoiceMessage;
