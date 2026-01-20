import { createContext, useContext, useState } from "react";

const LiveListContext = createContext(null);

export const LiveListProvider = ({ children, lives, autoStartIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(autoStartIndex);
  const [direction, setDirection] = useState("up");

  const getCurrentChannel = () => lives[currentIndex]?.channel;

  // ✅ ADD THIS
  const getCurrentLive = () => lives[currentIndex] || null;

  const goNextLive = () => {
    setDirection("up");
    setCurrentIndex((i) => Math.min(i + 1, lives.length - 1));
  };

  const goPrevLive = () => {
    setDirection("down");
    setCurrentIndex((i) => Math.max(i - 1, 0));
  };

  return (
    <LiveListContext.Provider
      value={{
        lives,
        currentIndex,
        direction,
        getCurrentChannel,
        getCurrentLive, // ✅ EXPOSE IT
        goNextLive,
        goPrevLive,
      }}
    >
      {children}
    </LiveListContext.Provider>
  );
};

export const useLiveList = () => useContext(LiveListContext);
