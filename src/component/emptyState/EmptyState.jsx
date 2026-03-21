/**
 * EmptyState Component
 * Reusable fallback UI for when data is not available in any section.
 */

import { FileText } from "lucide-react";

const EmptyState = ({ message = "No data available for this section.", subtext = "Please try again later or check your input details." }) => {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "3rem 1.5rem",
      textAlign: "center",
      minHeight: "200px",
    }}>
      <div style={{
        width: "56px",
        height: "56px",
        borderRadius: "50%",
        backgroundColor: "#fff7ed",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "1rem",
      }}>
        <FileText size={28} style={{ color: "#F75801" }} />
      </div>
      <p style={{
        fontSize: "0.9375rem",
        fontWeight: 600,
        color: "#374151",
        marginBottom: "0.375rem",
      }}>
        {message}
      </p>
      <p style={{
        fontSize: "0.8125rem",
        color: "#9ca3af",
      }}>
        {subtext}
      </p>
    </div>
  );
};

export default EmptyState;
