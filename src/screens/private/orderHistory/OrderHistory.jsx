import React from "react";
import "./OrderHistory.scss";
import { useOrderHistory } from "./OrderHistory.logic";

import Tabs from "./components/Tabs/Tabs";
import Call from "./components/Call/Call";
import Chat from "./components/Chat/Chat";
import Report from "./components/Report/Report";
// import Astromall from "./components/Astromall/Astromall";

const OrderHistory = () => {
  const { activeTab, setActiveTab } = useOrderHistory();

  const renderContent = () => {
    switch (activeTab) {
      case "call":
        return <Call />;
      case "chat":
        return <Chat />;
    //   case "report":
    //     return <Report />;
    //   case "astromall":
    //     return <Astromall />;
      default:
        return null;
    }
  };

  return (
    <div className="order-history">
      <Tabs activeTab={activeTab} onChange={setActiveTab} />
      <div className="order-history__content">{renderContent()}</div>
    </div>
  );
};

export default OrderHistory;
