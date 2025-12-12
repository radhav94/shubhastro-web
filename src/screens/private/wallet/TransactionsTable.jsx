import React from "react";
import { FiTrash } from "react-icons/fi";

export default function TransactionsTable({ data = [] }) {


  const formatCurrency = (value) => {
    const abs = Math.abs(value);
    return `₹ ${abs}`;
  };

  // Format date to a more readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // If no data, show the message like in the image
  if (data.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded shadow-sm">
        <div className="text-xl text-gray-400 mb-2">No sufficient data available!</div>
        <div className="text-gray-500 text-sm">
          
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white shadow-sm rounded">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-white">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Description</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Invoice</th>
            <th className="px-6 py-3 text-right text-sm font-medium text-gray-600">Transaction Amount</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Datetime</th>
            <th className="px-6 py-3 text-center text-sm font-medium text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {data?.map((r) => (
            <tr key={r._id} className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm text-left text-gray-700">{r.description || r.message || "-"}</td>
              <td className="px-6 py-4 text-sm">
                {r.invoice ? (
                  <span className="inline-block border border-gray-300 rounded-full px-3 py-1 text-xs">{r.invoice}</span>
                ) : (
                  <span className="text-gray-300">-</span>
                )}
              </td>
              <td className="px-6 py-4 text-sm text-right">
                {r.type === "debit" || r.action === "debit" ? (
                  <div className="text-red-600 font-semibold">- {formatCurrency(r.amount)}</div>
                ) : (
                  <div className="text-green-600 font-semibold">+ {formatCurrency(r.amount)}</div>
                )}
                {r.gst && <div className="text-xs text-gray-400">(GST {r.gst})</div>}
              </td>
              <td className="px-6 py-4 text-sm text-gray-700">{formatDate(r.updatedAt)}</td>
              <td className="px-6 py-4 text-center">
                <button className="inline-flex items-center justify-center p-2 rounded text-red-500 hover:bg-red-50">
                  <FiTrash />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}