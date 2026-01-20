import React from "react";
import "./Tabs.scss";
import { useTabs } from "./Tabs.logic";

const Tabs = ({ activeTab, onChange }) => {
  const { tabs } = useTabs();

  return (
    <div className="order-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`order-tabs__item ${
            activeTab === tab.key ? "active" : ""
          }`}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
