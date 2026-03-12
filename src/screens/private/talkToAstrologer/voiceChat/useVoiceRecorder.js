import { useRef, useState, useCallback } from "react";

/**
 * Voice recorder hook.
 * Primary: AAC in M4A container via Mediabunny + WebCodecs (Chrome/Edge 94+).
 * Fallback: WebM or MP4 via MediaRecorder (Firefox/Safari/mobile).
 */
export const useVoiceRecorder = () => {
  const outputRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const modeRef = useRef(null); // "aac" | "webm" | "mp4"

  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);

  // Find a supported mimeType for MediaRecorder
  const getSupportedMimeType = () => {
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg;codecs=opus",
      "",
    ];
    for (const type of types) {
      if (!type || MediaRecorder.isTypeSupported(type)) return type;
    }
    return "";
  };

  const startRecording = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
    streamRef.current = stream;
    setRecording(true);
    setSeconds(0);

    timerRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    // Try AAC via Mediabunny (needs WebCodecs AudioEncoder)
    if (typeof AudioEncoder !== "undefined") {
      try {
        const {
          Output,
          Mp4OutputFormat,
          BufferTarget,
          MediaStreamAudioTrackSource,
        } = await import("mediabunny");

        const audioTrack = stream.getAudioTracks()[0];

        const audioSource = new MediaStreamAudioTrackSource(audioTrack, {
          codec: "aac",
          bitrate: 128_000,
        });

        const target = new BufferTarget();
        const output = new Output({
          format: new Mp4OutputFormat(),
          target,
        });

        output.addAudioTrack(audioSource);
        await output.start();

        outputRef.current = output;
        modeRef.current = "aac";
        console.log("[VoiceRecorder] AAC mode started");
        return;
      } catch (e) {
        console.warn("[VoiceRecorder] AAC failed, falling back:", e);
        // Fall through to MediaRecorder
      }
    }

    // Fallback: MediaRecorder (WebM/MP4/OGG depending on browser)
    try {
      chunksRef.current = [];
      const mimeType = getSupportedMimeType();
      console.log("[VoiceRecorder] MediaRecorder mimeType:", mimeType || "default");

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data?.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.start(100);
      modeRef.current = "webm";
      console.log("[VoiceRecorder] MediaRecorder fallback started");
    } catch (e) {
      console.error("[VoiceRecorder] MediaRecorder also failed:", e);
      // Cleanup
      clearInterval(timerRef.current);
      stream.getTracks().forEach((t) => t.stop());
      setRecording(false);
    }
  }, []);

  const stopRecording = useCallback(
    () =>
      new Promise(async (resolve, reject) => {
        try {
          clearInterval(timerRef.current);
          setRecording(false);

          // Stop mic
          streamRef.current?.getTracks().forEach((t) => t.stop());

          const duration = Math.max(seconds, 1);

          if (modeRef.current === "aac") {
            const output = outputRef.current;
            if (!output) return reject("Recorder not initialized");

            await output.finalize();
            const buffer = output.target.buffer;
            if (!buffer || buffer.byteLength === 0)
              return reject("No audio data captured");

            const blob = new Blob([buffer], { type: "audio/mp4" });
            outputRef.current = null;
            modeRef.current = null;
            setSeconds(0);
            resolve({ blob, duration, codec: "aac" });
          } else if (modeRef.current === "webm") {
            const recorder = mediaRecorderRef.current;
            if (!recorder || recorder.state === "inactive")
              return reject("Recorder not initialized");

            recorder.onstop = () => {
              if (!chunksRef.current.length)
                return reject("No audio data captured");

              const blob = new Blob(chunksRef.current, {
                type: recorder.mimeType || "audio/webm",
              });
              mediaRecorderRef.current = null;
              modeRef.current = null;
              setSeconds(0);
              resolve({ blob, duration, codec: "webm" });
            };
            recorder.stop();
          } else {
            reject("Recorder not initialized — no mode set");
          }
        } catch (err) {
          reject(err);
        }
      }),
    [seconds]
  );

  return {
    recording,
    seconds,
    startRecording,
    stopRecording,
  };
};
