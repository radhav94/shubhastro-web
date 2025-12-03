import React, { useEffect, useState } from 'react'
import TransactionsTable from './TransactionsTable'
import { useGetTransactionsQuery } from '../../../services/appServices/transactionService';
import { Link } from 'react-router-dom';

const PAYMENT = "payment";
const WALLET = "wallet";
const WalletTranscations = () => {
  const [activeTab, setActiveTab] = useState(WALLET); // 'wallet' or 'payment'
  const [transactionData, setTransactionData] = useState([]);
  
  const {data, isFetching} = useGetTransactionsQuery()
  
  useEffect(() => {
      if(activeTab === PAYMENT) {
          const filteredRows = data?.data?.filter(row => row.type === "credit");
          setTransactionData(filteredRows)
        }
        else {
            setTransactionData(data?.data);
        }
    }, [activeTab, data])
  

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Tabs and controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button 
            className={`px-4 py-2 rounded-md font-medium ${activeTab === WALLET ? 'bg-yellow-300 text-yellow-900' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setActiveTab(WALLET)}
          >
            Wallet Transactions
          </button>
          <button 
            className={`px-4 py-2 rounded-md font-medium ${activeTab === PAYMENT ? 'bg-yellow-300 text-yellow-900' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setActiveTab(PAYMENT)}
          >
            Payment Logs
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-green-600 font-medium">Available balance: <span className="font-bold">₹ 159</span></div>
          <Link to="/callingpack"><button className="border border-green-500 text-green-600 px-3 py-1 rounded-md hover:bg-green-500 hover:text-white transition-colors duration-300">Recharge</button></Link>
          <button className="ml-4 border border-red-300 text-red-600 px-3 py-1 rounded-md hover:bg-red-600 hover:text-white transition-all duration-300">Delete All</button>
        </div>
      </div>

      {/* Title */}
      <h2 className="text-center text-2xl font-semibold mb-6">
        {activeTab === WALLET ? 'Transactions' : 'Payment Logs'}
      </h2>
      {!isFetching && 
        <TransactionsTable data={transactionData} />
    }

    </div>
  )
}

export default WalletTranscations