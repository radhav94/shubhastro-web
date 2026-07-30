import { useRef, useState, useCallback, useEffect } from "react";

/**
 * Voice recorder — uses native MediaRecorder.pause()/resume()
 * Same as WhatsApp approach: single recorder instance, continuous timestamps.
 */
export const useVoiceRecorder = () => {
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const mimeTypeRef = useRef("");

  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [paused, setPaused] = useState(false);
  const activeSecondsRef = useRef(0);

  const getSupportedMimeType = () => {
    // Prefer audio/mp4 (AAC) so recordings play across platforms (esp. iOS).
    // Falls back to webm/ogg only if the browser can't record mp4.
    const types = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", ""];
    for (const type of types) {
      if (!type || MediaRecorder.isTypeSupported(type)) return type;
    }
    return "";
  };

  const startRecording = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
    });
    streamRef.current = stream;
    chunksRef.current = [];
    activeSecondsRef.current = 0;

    const mimeType = getSupportedMimeType();
    mimeTypeRef.current = mimeType;

    const options = mimeType ? { mimeType } : undefined;
    const recorder = new MediaRecorder(stream, options);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data?.size > 0) chunksRef.current.push(e.data);
    };

    recorder.start();

    setRecording(true);
    setPaused(false);
    setSeconds(0);

    timerRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
      activeSecondsRef.current += 1;
    }, 1000);
  }, []);

  const pauseRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    clearInterval(timerRef.current);

    if (recorder.state === "recording") {
      // Native pause — recorder keeps running internally but marks data as paused
      // No new data chunks are generated during pause
      recorder.pause();
    }

    setPaused(true);
  }, []);

  const resumeRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    if (recorder.state === "paused") {
      recorder.resume();
    }

    timerRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
      activeSecondsRef.current += 1;
    }, 1000);

    setPaused(false);
  }, []);

  const stopRecording = useCallback(() =>
    new Promise((resolve, reject) => {
      try {
        clearInterval(timerRef.current);
        setRecording(false);
        setPaused(false);

        const duration = Math.max(activeSecondsRef.current, 1);
        const recorder = mediaRecorderRef.current;

        if (!recorder || recorder.state === "inactive") {
          return reject("Recorder not initialized");
        }

        // If paused, resume briefly to flush final data then stop
        if (recorder.state === "paused") {
          recorder.resume();
        }

        recorder.onstop = () => {
          streamRef.current?.getTracks().forEach(t => t.stop());
          streamRef.current = null;

          if (!chunksRef.current.length) {
            return reject("No audio data captured");
          }

          const mimeType = mimeTypeRef.current || "audio/mp4";
          const blob = new Blob(chunksRef.current, {
            type: mimeType,
          });

          mediaRecorderRef.current = null;
          chunksRef.current = [];
          setSeconds(0);
          activeSecondsRef.current = 0;

          resolve({ blob, duration, mimeType });
        };

        recorder.stop();
      } catch (err) {
        reject(err);
      }
    }),
  []);

  // Release the mic if the component unmounts mid-recording (e.g. navigation or
  // the browser Back button, which skip stopRecording).
  useEffect(() => () => {
    clearInterval(timerRef.current);
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    } catch {
      // ignore
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  return {
    recording,
    paused,
    seconds,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
  };
};
