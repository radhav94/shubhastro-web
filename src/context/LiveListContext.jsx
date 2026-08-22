import { createContext, useContext, useState, useCallback, useRef } from "react";

const LiveListContext = createContext(null);

export const LiveListProvider = ({ children, lives: initialLives, autoStartIndex = 0 }) => {
  const [lives, setLives] = useState(initialLives);
  const [currentIndex, setCurrentIndex] = useState(autoStartIndex);
  const [direction, setDirection] = useState("up");
  const [hasNewLive, setHasNewLive] = useState(false);
  // Increments when the current channel needs a forced rejoin (e.g. same roomId restarted)
  const [rejoinKey, setRejoinKey] = useState(0);

  // Sync if parent passes new lives (initial load)
  const [prevInitial, setPrevInitial] = useState(initialLives);
  if (initialLives !== prevInitial) {
    setPrevInitial(initialLives);
    setLives(initialLives);
  }

  // Sync autoStartIndex when parent updates it (e.g. URL changed to a different room)
  const [prevAutoStart, setPrevAutoStart] = useState(autoStartIndex);
  if (autoStartIndex !== prevAutoStart) {
    setPrevAutoStart(autoStartIndex);
    setCurrentIndex(autoStartIndex);
  }

  const getCurrentChannel = () => lives[currentIndex]?.channel;
  const getCurrentLive = () => lives[currentIndex] || null;

  /*
   * Both guard an empty list. The wrap-around is `% lives.length`, and once the
   * last astrologer ends their session that length is 0 — `% 0` is NaN, which
   * would stick in currentIndex and make getCurrentLive() permanently null even
   * after someone goes live again. A swipe or an arrow key can still reach these
   * during the moment the reel is empty.
   */
  const goNextLive = () => {
    if (lives.length === 0) return;
    setDirection("up");
    setCurrentIndex((i) => (i + 1) % lives.length);
    setHasNewLive(false);
  };

  const goPrevLive = () => {
    if (lives.length === 0) return;
    setDirection("down");
    setCurrentIndex((i) => (i - 1 + lives.length) % lives.length);
    setHasNewLive(false);
  };

  // Track recently removed channels so we can detect same-roomId restarts
  const recentlyRemovedRef = useRef(new Set());

  // Remove a live by roomId/channel and clamp index
  const removeLive = useCallback((roomId) => {
    recentlyRemovedRef.current.add(roomId);
    // Clean up after 10s to avoid memory leak
    setTimeout(() => recentlyRemovedRef.current.delete(roomId), 10000);
    setLives((prev) => {
      const next = prev.filter((l) => l.channel !== roomId);
      setCurrentIndex((i) => Math.min(i, Math.max(next.length - 1, 0)));
      return next;
    });
  }, []);

  // Add a new live entry (e.g. astrologer went live)
  const addLive = useCallback((liveEntry) => {
    setLives((prev) => {
      if (prev.some((l) => l.channel === liveEntry.channel)) return prev;
      // If this channel was recently removed and re-added (same roomId restart),
      // bump rejoinKey so useLiveStreaming re-runs its join effect
      if (recentlyRemovedRef.current.has(liveEntry.channel)) {
        recentlyRemovedRef.current.delete(liveEntry.channel);
        setRejoinKey((k) => k + 1);
      }
      setHasNewLive(true);
      const next = [...prev, liveEntry];
      // Auto-switch to the new entry if the list was empty (no active stream)
      if (prev.length === 0) {
        setCurrentIndex(0);
      }
      return next;
    });
  }, []);

  // Switch current view to a specific channel
  const switchToChannel = useCallback((channel) => {
    setLives((prev) => {
      const idx = prev.findIndex((l) => l.channel === channel);
      if (idx !== -1) setCurrentIndex(idx);
      return prev;
    });
  }, []);

  return (
    <LiveListContext.Provider
      value={{
        lives,
        currentIndex,
        direction,
        hasNewLive,
        rejoinKey,
        getCurrentChannel,
        getCurrentLive,
        goNextLive,
        goPrevLive,
        removeLive,
        addLive,
        switchToChannel,
      }}
    >
      {children}
    </LiveListContext.Provider>
  );
};

export const useLiveList = () => useContext(LiveListContext);
