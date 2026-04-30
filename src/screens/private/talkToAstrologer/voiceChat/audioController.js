let currentAudio = null;

export const playAudio = (audioEl) => {
  // Pause previous audio if different (stop it and reset)
  if (currentAudio && currentAudio !== audioEl) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  currentAudio = audioEl;
  audioEl.play();
};

// Pause at current position (WhatsApp-style — resume from same point)
export const stopAudio = (audioEl) => {
  if (audioEl) {
    audioEl.pause();
    // Do NOT reset currentTime — keep position for resume
    if (currentAudio === audioEl) {
      currentAudio = null;
    }
  }
};
