import React, { useEffect, useState } from "react";
import TransactionsTable from "./TransactionsTable";
import { useGetTransactionsQuery } from "../../../services/appServices/transactionService";
import { Link } from "react-router-dom";
import { useWalletBalance } from "./useWalletBalance";
import { FaSync } from "react-icons/fa";
import { trackEvent } from "../../../utils/analytics";

const PAYMENT = "payment";
const WALLET = "wallet";

const WalletTranscations = () => {
  const [activeTab, setActiveTab] = useState(WALLET);
  const [transactionData, setTransactionData] = useState([]);

  /*
    `limit` is explicit because the endpoint defaults to 10 and this screen has no
    pagination controls — without it the page silently claimed you had only ever
    made ten transactions.
  */
  const { data, isFetching } = useGetTransactionsQuery({ page: 1, limit: 50 });
  const {
    balance,
    refreshWallet,
    isFetching: isFetchingWallet,
  } = useWalletBalance();

  // Track wallet screen open + transaction history view (once on mount)
  useEffect(() => {
    trackEvent("wallet_screen_opened", {});
    trackEvent("transaction_history_viewed", {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    /*
      The rows live at `data.data.transactions`; `data.data` is the paginated
      envelope `{ transactions, pagination }`, not an array. This screen treated it
      as one, so the Wallet tab handed an object to the table (`.map is not a
      function`) and the Payment Logs tab called `.filter` on it — either way the
      route died with "Something went wrong" before rendering. Profile.jsx reads
      the same endpoint correctly and is the reference for this shape.
    */
    const rows = Array.isArray(data?.data?.transactions) ? data.data.transactions : [];

    if (activeTab === PAYMENT) {
      // Credit/debit is `billing.user.action`, not `type` — `type` carries values
      // like "refunded". Filtering on `type === "credit"` matched nothing, so this
      // tab would have been empty even once the crash was gone.
      setTransactionData(rows.filter((row) => row?.billing?.user?.action === "credit"));
    } else {
      setTransactionData(rows);
    }
  }, [activeTab, data]);

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      {/* Tabs + Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        {/* Tabs */}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            className={`px-4 py-2 rounded-md font-medium text-sm sm:text-base
              ${
                activeTab === WALLET
                  ? "bg-yellow-300 text-yellow-900"
                  : "bg-gray-200 text-gray-700"
              }`}
            onClick={() => setActiveTab(WALLET)}
          >
            Wallet Transactions
          </button>

          <button
            className={`px-4 py-2 rounded-md font-medium text-sm sm:text-base
              ${
                activeTab === PAYMENT
                  ? "bg-yellow-300 text-yellow-900"
                  : "bg-gray-200 text-gray-700"
              }`}
            onClick={() => setActiveTab(PAYMENT)}
          >
            Payment Logs
          </button>
        </div>

        {/* Balance + Actions */}
        <div className="flex flex-wrap items-center gap-3 justify-between sm:justify-end">
          <div className="text-green-600 font-medium text-sm sm:text-base">
            Available balance: <span className="font-bold">₹ {balance}</span>
          </div>

          {/* Refresh */}
          <button
            onClick={refreshWallet}
            className="p-2 rounded-full hover:text-blue-400 transition-all duration-200"
          >
            <FaSync
              className={`w-4 h-4 sm:w-5 sm:h-5 ${
                isFetchingWallet ? "animate-spin" : ""
              }`}
            />
          </button>

          <Link to="/recharge">
            <button
              className="border border-green-500 text-green-600 text-sm px-3 py-1 rounded-md
              hover:bg-green-500 hover:text-white transition-colors duration-300"
            >
              Recharge
            </button>
          </Link>

          {/* <button className="border border-red-300 text-red-600 text-sm px-3 py-1 rounded-md
            hover:bg-red-600 hover:text-white transition-all duration-300">
            Delete All
          </button> */}
        </div>
      </div>

      {/* Title */}
      <h2 className="text-center text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">
        {activeTab === WALLET ? "Transactions" : "Payment Logs"}
      </h2>

      {/* Table (Scrollable on mobile) */}
      {!isFetching && (
        <div className="overflow-x-auto">
          <TransactionsTable data={transactionData} />
        </div>
      )}
    </div>
  );
};

export default WalletTranscations;
