import { useState, useRef, useCallback } from "react";
import { speechToText } from "../../../services/sarvamTTSService";

const SILENCE_THRESHOLD = 0.03; // Volume level below which is considered silence
const SILENCE_DURATION = 1500; // ms of silence before auto-stop
const MAX_RECORDING_DURATION = 30000; // Max 30s recording

/**
 * Hook that records audio from the microphone and transcribes it using Sarvam STT.
 * Auto-stops after detecting silence or max duration.
 */
export default function useSarvamSTT({ onResult, onEnd }) {
  const [isListening, setIsListening] = useState(false);
  // True while the recorded audio is being sent to the server for transcription
  // (the window between recording stop and the transcript coming back).
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSupported] = useState(
    typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia
  );

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const abortRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const maxTimerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const hasSpokenRef = useRef(false);

  const onResultRef = useRef(onResult);
  const onEndRef = useRef(onEnd);
  onResultRef.current = onResult;
  onEndRef.current = onEnd;

  const cleanup = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    silenceTimerRef.current = null;
    maxTimerRef.current = null;
    animFrameRef.current = null;
  }, []);

  const stopRecording = useCallback(() => {
    cleanup();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }, [cleanup]);

  const startListening = useCallback(async () => {
    if (!isSupported) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      hasSpokenRef.current = false;

      // Set up AudioContext for silence detection
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      // Monitor audio levels for silence detection using RMS
      const checkSilence = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteTimeDomainData(dataArray);

        // Calculate RMS volume (0-1 range)
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const normalized = (dataArray[i] - 128) / 128;
          sum += normalized * normalized;
        }
        const rms = Math.sqrt(sum / dataArray.length);

        if (rms > SILENCE_THRESHOLD) {
          // User is speaking
          hasSpokenRef.current = true;
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
        } else if (hasSpokenRef.current && !silenceTimerRef.current) {
          // Silence detected after speech — start countdown
          silenceTimerRef.current = setTimeout(() => {
            console.log("[SarvamSTT] Auto-stopping after silence");
            stopRecording();
          }, SILENCE_DURATION);
        }

        animFrameRef.current = requestAnimationFrame(checkSilence);
      };
      checkSilence();

      // Max recording duration safety
      maxTimerRef.current = setTimeout(() => {
        console.log("[SarvamSTT] Auto-stopping after max duration");
        stopRecording();
      }, MAX_RECORDING_DURATION);

      // Set up MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setIsListening(false);

        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        chunksRef.current = [];

        if (audioBlob.size < 1000) {
          onEndRef.current?.({ transcript: "", language_code: "" });
          return;
        }

        // Send to Sarvam STT
        setIsTranscribing(true);
        try {
          abortRef.current = new AbortController();
          const result = await speechToText(audioBlob, {
            model: "saaras:v3",
            mode: "transcribe",
            signal: abortRef.current.signal,
          });

          console.log("[SarvamSTT] Result:", result);
          onResultRef.current?.(result.transcript, result.language_code);
          onEndRef.current?.(result);
        } catch (err) {
          if (err.name !== "AbortError") {
            console.error("[SarvamSTT] Transcription error:", err);
          }
          onEndRef.current?.({ transcript: "", language_code: "" });
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start(250); // Collect data every 250ms
      setIsListening(true);
    } catch (err) {
      console.error("[SarvamSTT] Mic access error:", err);
      setIsListening(false);
    }
  }, [isSupported, stopRecording]);

  const stopListening = useCallback(() => {
    stopRecording();
  }, [stopRecording]);

  return { isListening, isTranscribing, isSupported, startListening, stopListening };
}
