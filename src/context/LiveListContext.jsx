import { createContext, useContext, useState } from "react";

const LiveListContext = createContext(null);

export const LiveListProvider = ({ children, lives, autoStartIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(autoStartIndex);
  const [direction, setDirection] = useState("up");


  const getCurrentChannel = () => lives[currentIndex]?.channel;

 const goNextLive = () => {
  setDirection("up");

  setTimeout(() => {
    setCurrentIndex((i) => Math.min(i + 1, lives.length - 1));
  }, 50);
};

const goPrevLive = () => {
  setDirection("down");

  setTimeout(() => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }, 50);
};


  return (
    <LiveListContext.Provider
      value={{ lives, currentIndex, getCurrentChannel, goNextLive, goPrevLive,direction}}
    >
      {children}
    </LiveListContext.Provider>
  );
};


export const useLiveList = () => useContext(LiveListContext);
