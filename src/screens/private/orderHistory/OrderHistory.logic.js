import { useState } from "react";

export const useOrderHistory = () => {
  const [activeTab, setActiveTab] = useState("call");

  return {
    activeTab,
    setActiveTab,
  };
};
