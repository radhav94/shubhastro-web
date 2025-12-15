import { createContext, useContext, useState } from "react";

const CallContext = createContext();

export const CallProvider = ({ children }) => {
  const [activeCall, setActiveCall] = useState(null); 

  return (
    <CallContext.Provider value={{ activeCall, setActiveCall }}>
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext);
