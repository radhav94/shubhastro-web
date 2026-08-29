import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaPlay, FaPause } from "react-icons/fa";
import styles from "./AudioIntro.module.scss";

/**
 * AudioIntro
 * "Hear from <name>" voice-intro player shown on the astrologer detail page.
 *
 * Works with a real audio file when `src` is provided; otherwise it simulates
 * playback over `duration` seconds so the waveform/progress still animate.
 *
 * Props:
 * - name: astrologer's name (default "Astrologer")
 * - src: optional audio URL
 * - duration: total length in seconds (default 45) — used for the label and,
 *   when no src is given, for simulated playback
 * - isNew: show the "New" badge (default true)
 */
const BAR_COUNT = 220;

// Deterministic pseudo-random in 0..1 for a given index (stable across renders).
const pseudoRandom = (i) => {
  const v = Math.sin((i + 1) * 127.1) * 43758.5453;
  return v - Math.floor(v);
};

const formatTime = (secs) => {
  const s = Math.max(0, Math.floor(secs || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
};

const AudioIntro = ({
  name = "Astrologer",
  src,
  duration = 45,
  isNew = true,
}) => {
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalTime, setTotalTime] = useState(duration);
  /*
    Why this exists: `play()` returns a promise that rejects for reasons that are
    routine on iOS — Low Power Mode, an audio session another app or element
    holds, metadata not loaded yet — and the old handler answered every one of
    them with `setIsPlaying(false)` and nothing else. The icon flipped to Pause
    and straight back to Play, no sound, no explanation. On a phone that is a tap
    that did nothing, which is how it reaches the dead-click report: an iOS Safari
    visitor on an astrologer profile, one tap at 00:20, gone by 00:59.

    A file that 404s or is in a codec Safari won't take was equally silent — the
    <audio> element's own `error` event was not handled at all.

    `seq` remounts the message so a second failed tap replays it instead of
    setting an identical string that React renders as no change.
  */
  const [playError, setPlayError] = useState(null);
  const reportPlayError = (text) =>
    setPlayError((prev) => ({ text, seq: (prev?.seq || 0) + 1 }));

  // Deterministic heights that resemble a real voice recording. The waveform
  // stays active across the full width (dense spiky lines), with a gentle
  // swell toward the middle and short fades at the very start/end.
  const bars = useMemo(() => {
    return Array.from({ length: BAR_COUNT }, (_, i) => {
      const t = i / (BAR_COUNT - 1); // 0..1 across the track
      // Quick fade-in at the start and fade-out at the end
      const edge = Math.min(1, t / 0.05, (1 - t) / 0.05);
      // Gentle central swell so the middle is a bit louder (peaks ~0.6)
      const swell = 0.6 + 0.4 * Math.exp(-Math.pow((t - 0.6) / 0.4, 2));
      // Two-layer noise for a natural, busy amplitude across the whole width
      const noise = pseudoRandom(i) * 0.7 + pseudoRandom(i * 3.3) * 0.3;
      const amp = edge * swell * (0.35 + noise * 0.65);
      return Math.min(100, Math.max(6, Math.round(amp * 100)));
    });
  }, []);

  const progress = totalTime > 0 ? currentTime / totalTime : 0;

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Simulated playback ticker, extracted so seeking can restart it from a new
  // position instead of fighting the `startedAt` baseline captured in the old
  // interval's closure.
  const startSimulated = (fromSeconds) => {
    clearTimer();
    const startedAt = Date.now() - fromSeconds * 1000;
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000;
      if (elapsed >= totalTime) {
        setCurrentTime(totalTime);
        stop();
      } else {
        setCurrentTime(elapsed);
      }
    }, 100);
  };

  const stop = () => {
    setIsPlaying(false);
    clearTimer();
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const togglePlay = async () => {
    if (isPlaying) {
      stop();
      return;
    }

    // Restart if finished
    if (currentTime >= totalTime) {
      setCurrentTime(0);
      if (audioRef.current) audioRef.current.currentTime = 0;
    }

    setPlayError(null);
    setIsPlaying(true);

    if (src && audioRef.current) {
      try {
        await audioRef.current.play();
      } catch {
        /*
          One retry through load() first: with `preload="metadata"` Safari can
          reject a play() that arrives before it has enough of the file, and a
          reload plus replay is the usual remedy. Only then do we give up and say
          so.
        */
        try {
          audioRef.current.load();
          await audioRef.current.play();
        } catch {
          setIsPlaying(false);
          reportPlayError(
            "Couldn't start the intro. Tap play again, or turn off Low Power Mode if it's on."
          );
        }
      }
      return;
    }

    // Simulated playback (no real audio source)
    startSimulated(currentTime >= totalTime ? 0 : currentTime);
  };

  /*
    Seek by clicking the waveform.

    The bars are drawn in two colours split at the playback position, which is
    exactly what a scrubbable progress track looks like — so it gets clicked,
    and until now nothing happened anywhere except on the 40px play button. 220
    bars of obvious affordance, all inert.

    Works in both modes: with a real `src` we move `audio.currentTime`; in the
    simulated mode we move the state and, if it is running, restart the ticker
    from the new offset.
  */
  const seekTo = (seconds) => {
    const next = Math.min(totalTime, Math.max(0, seconds));
    setCurrentTime(next);

    if (src && audioRef.current) {
      audioRef.current.currentTime = next;
      return;
    }
    if (isPlaying) startSimulated(next);
  };

  const handleWaveformClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width) return;
    const ratio = (e.clientX - rect.left) / rect.width;
    seekTo(ratio * totalTime);
  };

  const handleWaveformKeyDown = (e) => {
    // 5s nudges, plus Home/End — the conventional keyboard contract for a
    // slider, which this now is.
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      seekTo(currentTime + 5);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      seekTo(currentTime - 5);
    } else if (e.key === "Home") {
      e.preventDefault();
      seekTo(0);
    } else if (e.key === "End") {
      e.preventDefault();
      seekTo(totalTime);
    }
  };

  // Cleanup on unmount
  useEffect(() => () => clearTimer(), []);

  // Real-audio event wiring
  const handleLoadedMeta = () => {
    if (audioRef.current?.duration && isFinite(audioRef.current.duration)) {
      setTotalTime(audioRef.current.duration);
    }
  };
  const handleTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };
  const handleEnded = () => {
    setCurrentTime(totalTime);
    stop();
  };
  // The element's own failure path: a 404 voiceNoteUrl or a codec Safari won't
  // decode never reaches the play() promise, and was silent.
  const handleAudioError = () => {
    setIsPlaying(false);
    clearTimer();
    reportPlayError("This voice intro couldn't be loaded.");
  };

  return (
    <div className={styles.audioIntro}>
      {src && (
        <audio
          ref={audioRef}
          src={src}
          preload="metadata"
          onLoadedMetadata={handleLoadedMeta}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onError={handleAudioError}
        />
      )}

      <div className={styles.topRow}>
        <span className={styles.title}>Hear from {name}</span>
        {isNew && <span className={styles.newBadge}>New</span>}
      </div>

      <div className={styles.playerRow}>
        <button
          type="button"
          className={styles.playBtn}
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause intro" : "Play intro"}
        >
          {isPlaying ? <FaPause /> : <FaPlay className={styles.playIcon} />}
        </button>

        {/* Was `aria-hidden` on a plain div. Now a real slider: clickable,
            focusable, and announced with its position. The individual bars stay
            decorative. */}
        <div
          className={styles.waveform}
          role="slider"
          tabIndex={0}
          aria-label="Seek voice intro"
          aria-valuemin={0}
          aria-valuemax={Math.round(totalTime)}
          aria-valuenow={Math.round(currentTime)}
          aria-valuetext={`${formatTime(currentTime)} of ${formatTime(totalTime)}`}
          onClick={handleWaveformClick}
          onKeyDown={handleWaveformKeyDown}
        >
          {bars.map((h, i) => {
            const played = i / BAR_COUNT <= progress;
            return (
              <span
                key={i}
                className={`${styles.bar} ${played ? styles.barPlayed : ""}`}
                style={{ height: `${h}%` }}
                aria-hidden="true"
              />
            );
          })}
        </div>

        <span className={styles.duration}>
          {formatTime(isPlaying || currentTime > 0 ? currentTime : totalTime)}
        </span>
      </div>

      {/* role="status" so the reason is announced without stealing focus from
          the play button the visitor just tapped. Keyed on seq — see
          reportPlayError. */}
      {playError && (
        <p key={playError.seq} className={styles.playError} role="status">
          {playError.text}
        </p>
      )}
    </div>
  );
};

export default AudioIntro;
