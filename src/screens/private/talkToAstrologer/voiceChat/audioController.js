let currentAudio = null;

export const playAudio = (audioEl) => {
  // Pause previous audio if exists
  if (currentAudio && currentAudio !== audioEl) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  currentAudio = audioEl;
  audioEl.play();
};

export const stopAudio = (audioEl) => {
  if (currentAudio === audioEl) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
};
