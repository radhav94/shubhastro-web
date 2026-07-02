// Looping "incoming/ring" sound played while an astrologer has accepted and the
// user is being asked to join (call:astrologer_accepted / chat:astrologer_accepted).
// It repeats until stopped (user joins/cancels/rejects, or the ring otherwise ends).
//
// Browsers block audio playback until the user has interacted with the page, so
// we prime ("unlock") the audio element on the first user gesture — the same
// approach used for the FCM notification sound in fcmService.jsx.

const INCOMING_SOUND_URL =
  "https://shubhastroassets.s3.ap-south-1.amazonaws.com/sound/customer-incoming.mpeg";

let incomingSound = null;
let audioUnlocked = false;

const getAudio = () => {
  if (!incomingSound && typeof Audio !== "undefined") {
    incomingSound = new Audio(INCOMING_SOUND_URL);
    incomingSound.preload = "auto";
    incomingSound.loop = true;
  }
  return incomingSound;
};

const unlockAudio = () => {
  if (audioUnlocked) return;
  const audio = getAudio();
  if (!audio) return;
  const wasLooping = audio.loop;
  audio.loop = false;
  audio.volume = 0;
  audio
    .play()
    .then(() => {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 1;
      audio.loop = wasLooping;
      audioUnlocked = true;
    })
    .catch(() => {
      audio.loop = wasLooping;
    });
};

if (typeof document !== "undefined") {
  ["click", "touchstart", "keydown"].forEach((evt) =>
    document.addEventListener(evt, unlockAudio, { once: true })
  );
}

/** Start playing the ring sound on repeat (best-effort; ignores autoplay errors). */
export const startIncomingSound = () => {
  const audio = getAudio();
  if (!audio) return;
  audio.loop = true;
  audio.volume = 1;
  // Only restart from the beginning if it isn't already playing, so repeated
  // calls while ringing don't cause an audible glitch.
  if (audio.paused) {
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }
};

/** Stop the ring sound immediately and reset to the start. */
export const stopIncomingSound = () => {
  if (!incomingSound) return;
  incomingSound.pause();
  incomingSound.currentTime = 0;
};
