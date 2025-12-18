import React, { createContext, useContext, useState } from "react";

const CallContext = createContext();

export const CallProvider = ({ children }) => {
  const [activeCall, setActiveCall] = useState(null);

  // 🔥 GLOBAL waiting list (persists across navigation)
  const [waitingList, setWaitingList] = useState([]);

  return (
    <CallContext.Provider
      value={{
        activeCall,
        setActiveCall,
        waitingList,
        setWaitingList,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext);
