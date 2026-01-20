import React from "react";

const DynamicTable = ({ title, headers, data }) => {
  // Convert nested objects (like varna, vasya, etc.) into an array
  const rows = Object.keys(data)
    .filter((key) => typeof data[key] === "object" && data[key] !== null)
    .map((key) => data[key]);

  return (
    <div className="w-full  mx-auto mt-6 border rounded-2xl shadow-md overflow-auto">
      {title && (
        <h2 className="text-xl font-semibold text-start  p-3 ">{title}</h2>
      )}

      <table className="w-full text-sm border-collapse">
        <thead className="bg-[#f4d24b] text-gray-800">
          <tr>
            {headers.map((h) => (
              <th key={h.key} className="p-3 text-left border-b">
                {h.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((item, i) => (
            <tr key={i} className=" text-left ">
              {headers.map((h, i) => (
                <td
                  key={h.key}
                  className={`p-3 border-b text-left ${
                    i === 0 ? "text-[#f4d24b] font-bold" : ""
                  }`}
                >
                  {item[h.key] ?? "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DynamicTable;
