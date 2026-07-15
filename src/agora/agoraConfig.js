/**
 * Agora Video/Audio Encoding Configuration
 * Optimized for low bandwidth usage across all call types.
 *
 * Reference: https://docs.agora.io/en/interactive-live-streaming/enhance-call-quality/configure-video-encoding
 */

// Video call (one-to-one) — balanced quality at lower bandwidth
export const VIDEO_CALL_ENCODER_CONFIG = {
  width: 320,
  height: 240,
  frameRate: 30,
  bitrateMin: 200,
  bitrateMax: 500,
  degradationPreference: "maintain-framerate",
};

// Live streaming (audience viewing) — slightly higher res but still conservative
export const LIVE_STREAM_ENCODER_CONFIG = {
  width: 320,
  height: 240,
  frameRate: 30,
  bitrateMin: 200,
  bitrateMax: 500,
  degradationPreference: "maintain-framerate",
};

// Audio encoding config — minimal bandwidth, speech-only
export const AUDIO_ENCODER_CONFIG = {
  sampleRate: 16000,
  stereo: false,
  bitrate: 26,
};

/**
 * Applies video encoder configuration to an Agora camera track.
 * Call this after creating the camera track.
 */
export const applyVideoEncoderConfig = async (cameraTrack, config = VIDEO_CALL_ENCODER_CONFIG) => {
  if (!cameraTrack) return;
  try {
    await cameraTrack.setEncoderConfiguration({
      width: { max: config.width },
      height: { max: config.height },
      frameRate: { max: config.frameRate },
      bitrateMin: config.bitrateMin,
      bitrateMax: config.bitrateMax,
    });
    console.log("[Agora] ✅ Video encoder config applied:", config);
  } catch (err) {
    console.warn("[Agora] ⚠️ Failed to set video encoder config:", err.message);
  }
};
