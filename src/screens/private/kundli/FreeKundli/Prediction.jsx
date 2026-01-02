import React, { useState, useEffect, useRef } from "react";
import { useGetAi12MonthsPredictionQuery } from "../../../../redux/api/kundli/kundliApi";

const formatLabel = (key) =>
  key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const formatValue = (value) =>
  typeof value === "boolean" ? (value ? "Yes" : "No") : value;

const Prediction = ({ params, skipToken }) => {
  const { data, isLoading } =
    useGetAi12MonthsPredictionQuery(params ?? skipToken);

  const predictions = data?.response ?? [];
  const [openIndex, setOpenIndex] = useState(0);
  const [openMeta, setOpenMeta] = useState({});
  const accordionRefs = useRef([]);
  const HEADER_OFFSET = 100;


  /* open first by default */
  useEffect(() => {
    if (predictions.length) setOpenIndex(0);
  }, [predictions.length]);

  /* scroll into view on open */
  useEffect(() => {
    if (accordionRefs.current[openIndex]) {
      const element = accordionRefs.current[openIndex];
      const elementTop =
        element.getBoundingClientRect().top + window.pageYOffset;

      const offsetPosition = elementTop - HEADER_OFFSET;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  }, [openIndex]);


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

  return (
    <div className="space-y-4 mt-4">
      {predictions.map((item, index) => {
        const { specifications, predictions: data } = item;
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
                {specifications?.dasha}
              </p>
              <span className="text-sm text-gray-400">
                {isOpen ? "▲" : "▼"}
              </span>
            </button>

            {isOpen && (
              <div className="border-t px-4 py-4 space-y-5">
                {/* ================= SPECIFICATIONS ================= */}
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-md border">
                  {Object.entries(specifications || {}).map(([key, value]) => (
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
                  {Object.entries(data || {}).map(([key, value]) => {
                    if (!value?.bot_response) return null;

                    const metaKey = `${index}-${key}`;
                    const isMetaOpen = openMeta[metaKey];

                    return (
                      <div
                        key={key}
                        className="border border-gray-200 rounded-md p-4 bg-gray-50"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm font-semibold text-gray-700">
                            {formatLabel(key)}
                          </p>

                          <span
                            className={`text-xs px-3 py-1 rounded-full capitalize
                              ${value.outcome === "positive"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                              }`}
                          >
                            {value.outcome}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 leading-relaxed">
                          {value.bot_response}
                        </p>

                        <p className="mt-2 text-xs text-gray-500">
                          Probability: {value.probability}
                        </p>

                        {(value.contributors || value.houseScores) && (
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
                                <p>{value.contributors}</p>
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
                                        className={`px-3 py-1 rounded-full text-xs
                                          ${score === "positive"
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
