import { createContext, useContext, useState, useCallback } from "react";

const LiveListContext = createContext(null);

export const LiveListProvider = ({ children, lives: initialLives, autoStartIndex = 0 }) => {
  const [lives, setLives] = useState(initialLives);
  const [currentIndex, setCurrentIndex] = useState(autoStartIndex);
  const [direction, setDirection] = useState("up");

  // Sync if parent passes new lives (initial load)
  const [prevInitial, setPrevInitial] = useState(initialLives);
  if (initialLives !== prevInitial) {
    setPrevInitial(initialLives);
    setLives(initialLives);
  }

  const getCurrentChannel = () => lives[currentIndex]?.channel;
  const getCurrentLive = () => lives[currentIndex] || null;

  const goNextLive = () => {
    setDirection("up");
    setCurrentIndex((i) => Math.min(i + 1, lives.length - 1));
  };

  const goPrevLive = () => {
    setDirection("down");
    setCurrentIndex((i) => Math.max(i - 1, 0));
  };

  // Remove a live by roomId/channel and clamp index
  const removeLive = useCallback((roomId) => {
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
      return [...prev, liveEntry];
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
