import React, { useState, useEffect, useRef } from "react";
import { useGetAi12MonthsPredictionQuery } from "../../../../redux/api/kundli/kundliApi";
import TTSButton from "../../../../component/UI/TTSButton";
import arrowUp from "../../../../assets/images/arrow-up.svg";

/* ================= UTIL HELPERS ================= */

const formatLabel = (key = "") =>
  key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const formatValue = (value) => {
  if (value === null || value === undefined) return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return value;
};

const renderAnyValue = (value) => {
  if (value === null || value === undefined) return "-";

  if (Array.isArray(value)) {
    return (
      <ul className="list-disc ml-4 space-y-1">
        {value.map((v, i) => (
          <li key={i}>{renderAnyValue(v)}</li>
        ))}
      </ul>
    );
  }

  if (typeof value === "object") {
    return (
      <div className="space-y-1">
        {Object.entries(value).map(([k, v]) => (
          <p key={k}>
            <span className="font-medium">{formatLabel(k)}:</span>{" "}
            {renderAnyValue(v)}
          </p>
        ))}
      </div>
    );
  }

  return value;
};

/* ================= COMPONENT ================= */

const Prediction = ({ params, skipToken }) => {
  const { data, isLoading } =
    useGetAi12MonthsPredictionQuery(params ?? skipToken);

  const predictions = Array.isArray(data?.response)
    ? data.response
    : [];

  const [openIndex, setOpenIndex] = useState(0);
  const [openMeta, setOpenMeta] = useState({});
  const accordionRefs = useRef([]);
  const HEADER_OFFSET = 100;

  /* open first accordion by default */
  useEffect(() => {
    if (predictions.length) setOpenIndex(0);
  }, [predictions.length]);

  /* scroll into view on open */
  useEffect(() => {
    if (accordionRefs.current[openIndex]) {
      const el = accordionRefs.current[openIndex];
      const top =
        el.getBoundingClientRect().top + window.pageYOffset - HEADER_OFFSET;

      window.scrollTo({ top, behavior: "smooth" });
    }
  }, [openIndex]);

  /* ================= STATES ================= */

  if (isLoading) {
    return (
      <div className="py-6 text-center text-sm text-gray-500">
        Loading predictions...
      </div>
    );
  }

  if (!predictions.length) {
    return (
      <div className="py-6 text-center text-sm text-gray-500">
        No Data Available
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="space-y-4 mt-4">
      {predictions.map((item, index) => {
        const { specifications = {}, predictions: predData = {} } = item;
        const isOpen = openIndex === index;

        return (
          <div
            key={index}
            ref={(el) => (accordionRefs.current[index] = el)}
            className="border border-gray-200 rounded-lg bg-white"
          >
            {/* ================= HEADER ================= */}
            <button
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="w-full flex justify-between items-center px-4 py-3 text-left"
            >
              <p className="text-base font-semibold text-gray-800">
                {(() => {
                  const sd = specifications?.start_date;
                  const ed = specifications?.end_date;
                  if (!sd || !ed) return specifications?.dasha || "Prediction";

                  const ordinal = (d) => {
                    const s = ["th","st","nd","rd"];
                    const v = d % 100;
                    return d + (s[(v-20)%10] || s[v] || s[0]);
                  };
                  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

                  try {
                    const start = new Date(sd);
                    const end = new Date(ed);

                    const startStr = `${ordinal(start.getDate())} ${months[start.getMonth()]} ${start.getFullYear()}`;
                    const endStr = `${ordinal(end.getDate())} ${months[end.getMonth()]} ${end.getFullYear()}`;

                    return `${startStr} - ${endStr}`;
                  } catch {
                    return specifications?.dasha || "Prediction";
                  }
                })()}
              </p>
              <span className="text-sm text-gray-400">
                <img
                  src={arrowUp}
                  alt="toggle"
                  className={`transition-transform duration-300 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </span>
            </button>

            {isOpen && (
              <div className="border-t px-4 py-4 space-y-5">
                {/* ================= SPECIFICATIONS ================= */}
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-md border">
                  {Object.entries(specifications).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-sm text-gray-500">
                        {formatLabel(key)}
                      </p>
                      <p className="text-sm font-medium text-gray-800">
                        {formatValue(value)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* ================= PREDICTIONS ================= */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {Object.entries(predData).map(([key, value]) => {
                    if (!value?.bot_response) return null;

                    const metaKey = `${index}-${key}`;
                    const isMetaOpen = openMeta[metaKey];
                    
                    // Show only first 150 characters
                    const fullText = value.bot_response;
                    const previewLength = 500;
                    const previewText = fullText.substring(0, previewLength);
                    const showPreview = fullText.length > previewLength;

                    return (
                      <div
                        key={key}
                        className="border border-gray-200 rounded-md p-4 bg-gray-50"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm font-semibold text-gray-700">
                            {formatLabel(key)}
                          </p>

                          <div className="flex items-center gap-2">
                            <TTSButton text={`${formatLabel(key)}. ${value.bot_response}. Probability: ${formatValue(value.probability)}`} />
                            {value.outcome && (
                            <span
                              className={`text-xs px-3 py-1 rounded-full capitalize ${
                                value.outcome === "positive"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {value.outcome}
                            </span>
                          )}
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 leading-relaxed">
                          {isMetaOpen ? fullText : previewText}
                          {!isMetaOpen && showPreview && "..."}
                        </p>

                        <p className="mt-2 text-xs text-gray-500">
                          Probability: {formatValue(value.probability)}
                        </p>

                        {(showPreview || value.contributors || value.houseScores) && (
                          <button
                            onClick={() =>
                              setOpenMeta((p) => ({
                                ...p,
                                [metaKey]: !p[metaKey],
                              }))
                            }
                            className="mt-3 text-xs text-blue-600 hover:underline"
                          >
                            {isMetaOpen ? "Hide details" : "Show details"}
                          </button>
                        )}

                        {isMetaOpen && (
                          <div className="mt-3 text-xs text-gray-600 space-y-3">
                            {value.contributors && (
                              <div>
                                <p className="font-medium text-gray-700 mb-1">
                                  Contributors
                                </p>
                                {renderAnyValue(value.contributors)}
                              </div>
                            )}

                            {value.houseScores && (
                              <div>
                                <p className="font-medium text-gray-700 mb-1">
                                  House Scores
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {Object.entries(value.houseScores).map(
                                    ([house, score]) => (
                                      <span
                                        key={house}
                                        className={`px-3 py-1 rounded-full text-xs ${
                                          score === "positive"
                                            ? "bg-green-100 text-green-700"
                                            : "bg-red-100 text-red-700"
                                        }`}
                                      >
                                        House {house}
                                      </span>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Prediction;
