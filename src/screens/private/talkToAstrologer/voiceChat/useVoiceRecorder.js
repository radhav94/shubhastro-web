import { useRef, useState } from "react";

export const useVoiceRecorder = () => {
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const startRecording = async () => {
    chunksRef.current = []; // ✅ reset FIRST

    streamRef.current = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: "audio/webm", // ✅ important
    });

    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.start(100); // ✅ collect data every 100ms
    setRecording(true);

    timerRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
  };

  const stopRecording = () =>
    new Promise((resolve, reject) => {
      if (!mediaRecorderRef.current) {
        reject("Recorder not initialized");
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        clearInterval(timerRef.current);
        setRecording(false);

        streamRef.current?.getTracks().forEach((t) => t.stop());

        if (!chunksRef.current.length) {
          reject("No audio data captured");
          return;
        }

        const blob = new Blob(chunksRef.current, {
          type: "audio/webm",
        });

        setSeconds(0);
        resolve({ blob, duration: Math.max(seconds, 1) });
      };

      mediaRecorderRef.current.stop();
    });

  return {
    recording,
    seconds,
    startRecording,
    stopRecording,
  };
};
