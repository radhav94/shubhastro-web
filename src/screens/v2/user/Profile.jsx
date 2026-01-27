import {
  ChevronLeft,
  LogOut,
  Sun,
  Moon,
  Sparkles,
  Filter,
  ArrowUpDown,
  Phone,
  MessageCircle,
  Star,
} from "lucide-react";
import { TiUserDelete } from "react-icons/ti";
import { LuPencilLine } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useState, useRef, useEffect } from "react";
import dayjs from "dayjs";
import { useGetTransactionsQuery } from "../../../services/appServices/transactionService";
import {
  useGetAllKundlisQuery,
  useDeleteKundliMutation,
} from "../../../services/appServices/kundliServicesNew";
import { useGetCallHistoryQuery } from "../../../redux/api/callHistory/callHistory";
import { useGetUserChatMessagesQuery } from "../../../redux/api/chatHistory/chatHistory";
import { useWalletBalance } from "../../private/wallet/useWalletBalance";
import { getUserFromStorage } from "../../../utils/authStorage";
import { logout } from "../../../redux/auth/authSlice";
import styles from "./Profile.module.scss";
import profileWallet from "../../../assets/images/profile-wallet.jpg";

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Profile");
  const [orderHistoryTab, setOrderHistoryTab] = useState("call"); // Sub-tab for order history
  const transactionListRef = useRef(null);
  const orderListRef = useRef(null); // Ref for order history scroll
  const user = getUserFromStorage();
  const userName = user
    ? (user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : user.phoneNumber || "Guest User")
    : "Guest User";
  const userId = localStorage.getItem("shubhtalk_customer_id");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [allLoadedTransactions, setAllLoadedTransactions] = useState([]);

  // Call history pagination state
  const [callHistoryPage, setCallHistoryPage] = useState(1);
  const [allLoadedCallOrders, setAllLoadedCallOrders] = useState([]);

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [kundliToDelete, setKundliToDelete] = useState(null);

  // Fetch call and chat history
  const {
    data: callHistoryData,
    isLoading: isLoadingCalls,
    isFetching: isFetchingCalls,
  } = useGetCallHistoryQuery(
    { userId, page: callHistoryPage, limit: 30 },
    { skip: !userId },
  );

  const { data: chatHistoryData, isLoading: isLoadingChats } =
    useGetUserChatMessagesQuery(userId, {
      skip: !userId,
    });

  // Get pagination info
  const callPagination = callHistoryData?.data?.pagination;
  const hasNextCallPage = callPagination?.hasNextPage || false;

  // Process order history data - current page call orders
  const currentCallOrders = Array.isArray(callHistoryData?.data?.callHistory)
    ? callHistoryData.data.callHistory
        .filter((item) => item?.type !== "chat")
        .map((item, index) => ({
          id: `call-${callHistoryPage}-${index}`,
          type: "call",
          astrologer: {
            name: item?.receiverName || "Unknown",
            image: "https://i.pravatar.cc/100",
          },
          date: item?.timestamp || new Date(),
          duration: `${item?.duration || 0} Min`,
          amount: item?.duration || 0,
          rate: 0,
          status: item?.status || "completed",
          roomId: item?.roomId,
          year: item?.timestamp
            ? new Date(item.timestamp).getFullYear()
            : new Date().getFullYear(),
        }))
    : [];

  // Update loaded call orders when new data arrives
  useEffect(() => {
    if (currentCallOrders.length > 0) {
      if (callHistoryPage === 1) {
        setAllLoadedCallOrders(currentCallOrders);
      } else {
        setAllLoadedCallOrders((prev) => [...prev, ...currentCallOrders]);
      }
    }
  }, [callHistoryData, callHistoryPage]);

  // Use accumulated call orders
  const callOrders = allLoadedCallOrders;

  const chatOrders = Array.isArray(chatHistoryData?.data)
    ? chatHistoryData.data.map((room, index) => {
        const lastChat = room.chatHistory?.[room.chatHistory.length - 1];
        return {
          id: `chat-${index}`,
          type: "chat",
          // orderId: room.roomId?.slice(-6) || "NA",
          astrologer: {
            name: room.astrologerFirstName
              ? `${room.astrologerFirstName} ${room.astrologerLastName || ""}`
              : "Unknown",
            image: "https://i.pravatar.cc/150",
          },
          date: lastChat?.createdAt || new Date(),
          duration: `${room.chatHistory?.length || 0} Messages`,
          amount: 0,
          rate: 0,
          status: "completed",
          roomId: room.roomId,
          year: lastChat?.createdAt
            ? new Date(lastChat.createdAt).getFullYear()
            : new Date().getFullYear(),
        };
      })
    : [];

  const allOrders = [...callOrders, ...chatOrders].sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );

  // Filter orders based on sub-tab
  const filteredOrders = orderHistoryTab === "call" ? callOrders : chatOrders;

  // Group orders by year
  const ordersByYear = filteredOrders.reduce((acc, order) => {
    if (!acc[order.year]) {
      acc[order.year] = [];
    }
    acc[order.year].push(order);
    return acc;
  }, {});
  // Fetch saved kundli profiles
  const {
    data: kundliData,
    isLoading: isLoadingKundlis,
    refetch: refetchKundlis,
  } = useGetAllKundlisQuery();
  const savedKundlis = kundliData?.data || [];

  // Delete kundli mutation
  const [deleteKundli, { isLoading: isDeletingKundli }] =
    useDeleteKundliMutation();

  // Fetch wallet balance
  const { balance, isFetching: isFetchingBalance } = useWalletBalance();

  // Fetch transactions data with pagination - only when on Transactions tab
  const shouldFetch = activeTab === "Transactions";

  const { data: transactionsData, isFetching: isFetchingTransactions } =
    useGetTransactionsQuery(
      { page: currentPage, limit: 10 },
      { skip: !shouldFetch },
    );

  const pagination = transactionsData?.data?.pagination;
  const hasNextPage = pagination?.hasNextPage || false;

  // Update loaded transactions when new data arrives
  useEffect(() => {
    if (transactionsData?.data?.transactions && shouldFetch) {
      if (currentPage === 1) {
        setAllLoadedTransactions(transactionsData.data.transactions);
      } else {
        setAllLoadedTransactions((prev) => [
          ...prev,
          ...transactionsData.data.transactions,
        ]);
      }
    }
  }, [transactionsData, currentPage, shouldFetch]);

  // Infinite scroll handler for transactions
  const handleTransactionScroll = (e) => {
    const element = e.target;
    const isAtBottom =
      element.scrollHeight - element.scrollTop <= element.clientHeight + 50;

    if (isAtBottom && hasNextPage && !isFetchingTransactions) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  // Infinite scroll handler for call orders
  const handleOrderScroll = (e) => {
    const element = e.target;
    const isAtBottom =
      element.scrollHeight - element.scrollTop <= element.clientHeight + 50;

    if (
      isAtBottom &&
      hasNextCallPage &&
      !isFetchingCalls &&
      orderHistoryTab === "call"
    ) {
      setCallHistoryPage((prev) => prev + 1);
    }
  };

  // Reset call history page when switching TO call tab (not away from it)
  useEffect(() => {
    if (
      orderHistoryTab === "call" &&
      allLoadedCallOrders.length === 0 &&
      !isLoadingCalls
    ) {
      // Only reset if we don't have data yet
      setCallHistoryPage(1);
    }
  }, [orderHistoryTab]);

  // Delete kundli handlers
  const handleDeleteClick = (kundliId) => {
    setKundliToDelete(kundliId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (kundliToDelete) {
      try {
        await deleteKundli(kundliToDelete).unwrap();
        refetchKundlis();
      } catch (error) {
        console.error("Failed to delete profile:", error);
      }
    }
    setShowDeleteConfirm(false);
    setKundliToDelete(null);
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setKundliToDelete(null);
  };

  const handleLogout = () => {
    // Dispatch Redux logout action
    dispatch(logout());
    
    // Clear all authentication related data from localStorage
    localStorage.removeItem("shubhtalk_customer_token");
    localStorage.removeItem("shubhtalk_role");
    localStorage.removeItem("shubhtalk_user");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userData");
    localStorage.removeItem("astro_wallet_balance");

    window.dispatchEvent(new Event("auth-change"));

    // Navigate to home page
    navigate("/");
  };

  const tabs = ["Profile", "Order History", "Transactions", "Support"];

  // Get initials for avatar
  const getInitials = (name) => {
    const names = name.split(" ");
    return names
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={styles.profilePage}>
      {/* Header */}
      <div className={styles.profileHeader}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <ChevronLeft size={24} />
        </button>

        <div className={styles.headerCenter}>
          <div className={styles.userAvatar}>
            <span>🐏</span>
          </div>
          <div className={styles.headerInfo}>
            <h1 className={styles.profileName}>{userName}</h1>
            <p className={styles.profileDetails}>
              {savedKundlis[0]
                ? `${dayjs(`${savedKundlis[0].year}-${savedKundlis[0].month}-${savedKundlis[0].day}`).format("MMM DD, YYYY")} • ${String(savedKundlis[0].hour).padStart(2, "0")}:${String(savedKundlis[0].min).padStart(2, "0")}`
                : " "}
            </p>
          </div>
        </div>

        <button className={styles.logoutButton} onClick={handleLogout}>
          <LogOut size={20} />
        </button>
      </div>

      {/* Zodiac Cards */}
      <div className={styles.zodiacSection}>
        <div
          className={styles.zodiacCard}
          style={{ background: "#E9D7F6", color: "#49196D" }}
        >
          <div className={styles.zodiacIcon}>
            <Sun size={32} fill="#49196D" />
          </div>
          <div className={styles.zodiacInfo}>
            <span className={styles.zodiacLabel}>Pisces</span>
            <span className={styles.zodiacValue}>Sun Sign</span>
          </div>
        </div>

        <div
          className={styles.zodiacCard}
          style={{ background: "#D8E9F4", color: "#1C4863" }}
        >
          <div className={styles.zodiacIcon}>
            <Moon size={32} fill="#1C4863" />
          </div>
          <div className={styles.zodiacInfo}>
            <span className={styles.zodiacLabel}>Gemini</span>
            <span className={styles.zodiacValue}>Moon Sign</span>
          </div>
        </div>

        <div
          className={styles.zodiacCard}
          style={{ background: "#D5F5E3", color: "#271C50" }}
        >
          <div className={styles.zodiacIcon}>
            <Moon size={32} fill="#271C50" />
          </div>
          <div className={styles.zodiacInfo}>
            <span className={styles.zodiacLabel}>Gemini</span>
            <span className={styles.zodiacValue}>Ascendant Sign</span>
          </div>
        </div>
      </div>

      {/* Balance Card */}
      <div
        className={styles.balanceCard}
        style={{ backgroundImage: `url(${profileWallet})` }}
      >
        <div className={styles.balanceLeft}>
          <div className={styles.balanceHeader}>
            <div className={styles.coinIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  fill="#FFD700"
                  stroke="#FFA500"
                  strokeWidth="2"
                />
                <circle cx="12" cy="12" r="6" fill="#FFA500" />
                <text
                  x="12"
                  y="16"
                  textAnchor="middle"
                  fill="#FFF"
                  fontSize="10"
                  fontWeight="bold"
                >
                  ₹
                </text>
              </svg>
            </div>
            <Sparkles size={16} fill="#FFF" color="#FFF" />
            <span className={styles.balanceLabel}>Balance</span>
          </div>
          <div className={styles.balanceAmount}>
            ₹{isFetchingBalance ? "..." : balance || 100}
          </div>
        </div>

        <button
          className={styles.addMinutesButton}
          onClick={() => navigate("/recharge")}
        >
          Add Shubh Minutes
          <ChevronLeft size={20} style={{ transform: "rotate(180deg)" }} />
        </button>
      </div>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`${styles.tabButton} ${activeTab === tab ? styles.active : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === "Profile" && (
          <div className={styles.profileContent}>
            {isLoadingKundlis ? (
              <div className={styles.loadingState}>
                <p>Loading profiles...</p>
              </div>
            ) : savedKundlis.length > 0 ? (
              <>
                {savedKundlis.map((kundli, index) => (
                  <div key={kundli._id} className={styles.profileCard}>
                    <div className={styles.avatarCircle}>
                      <span>{getInitials(kundli.name)}</span>
                    </div>

                    <div className={styles.profileCardContent}>
                      <div className={styles.profileCardHeader}>
                        <div className={styles.badge}>
                          {index === 0 ? "Self" : kundli.relation || "Brother"}
                        </div>
                        <div className={styles.profileActions}>
                          <button
                            className={styles.iconButton}
                            onClick={() =>
                              navigate(`/profile/edit/${kundli._id}`)
                            }
                          >
                            <LuPencilLine size={18} />
                          </button>
                          <button
                            className={styles.iconButton}
                            onClick={() => handleDeleteClick(kundli._id)}
                            disabled={isDeletingKundli}
                          >
                            <TiUserDelete size={18} />
                          </button>
                        </div>
                      </div>

                      <h3 className={styles.profileCardName}>{kundli.name}</h3>
                      <p className={styles.profileCardDate}>
                        {dayjs(
                          `${kundli.year}-${kundli.month}-${kundli.day}`,
                        ).format("DD MMM YYYY")}{" "}
                        • {String(kundli.hour).padStart(2, "0")}:
                        {String(kundli.min).padStart(2, "0")} PM
                      </p>
                      <p className={styles.profileCardLocation}>
                        {kundli.place}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Add Profile Button - now part of the list */}
                <button
                  className={styles.addProfileButton}
                  onClick={() => navigate("/profile/add")}
                >
                  Add Profile +
                </button>
              </>
            ) : (
              <div className={styles.emptyState}>
                <p>No profiles found</p>
                <button
                  className={styles.addProfileButton}
                  onClick={() => navigate("/profile/add")}
                >
                  Add Profile +
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "Order History" && (
          <div className={styles.orderContent}>
            {/* Sub Tabs for Call and Chat */}
            <div className={styles.subTabs}>
              <button
                className={`${styles.subTabButton} ${orderHistoryTab === "call" ? styles.active : ""}`}
                onClick={() => setOrderHistoryTab("call")}
              >
                Call
              </button>
              <button
                className={`${styles.subTabButton} ${orderHistoryTab === "chat" ? styles.active : ""}`}
                onClick={() => setOrderHistoryTab("chat")}
              >
                Chat
              </button>
            </div>

            {isLoadingCalls || isLoadingChats ? (
              <div className={styles.loadingState}>
                <p>Loading orders...</p>
              </div>
            ) : filteredOrders.length > 0 ? (
              <div
                key={orderHistoryTab} // Force re-render when tab changes
                className={styles.orderList}
                ref={orderListRef}
                onScroll={handleOrderScroll}
              >
                {/* Orders by Year */}
                {Object.keys(ordersByYear)
                  .sort((a, b) => b - a)
                  .map((year) => (
                    <div key={year} className={styles.yearSection}>
                      <h4 className={styles.yearTitle}>{year}</h4>

                      {ordersByYear[year].map((order) => (
                        <div key={order.id} className={styles.orderCard}>
                          <div className={styles.orderCardTop}>
                            <div className={styles.orderLeft}>
                              <div className={styles.astrologerAvatar}>
                                <span>
                                  {getInitials(order.astrologer.name)}
                                </span>
                              </div>
                              <div className={styles.orderInfo}>
                                <h5 className={styles.astrologerName}>
                                  {order.astrologer.name}
                                </h5>
                                <div className={styles.orderMeta}>
                                  <span className={styles.orderDate}>
                                    📅{" "}
                                    {dayjs(order.date).format("MMM DD, YYYY")}
                                  </span>
                                  <span className={styles.orderTime}>
                                    🕐 {dayjs(order.date).format("hh:mm A")}
                                  </span>
                                </div>
                                <p className={styles.orderDuration}>
                                  Duration : {order.duration}
                                </p>
                                <p className={styles.orderAmount}>
                                  ₹{order.amount}
                                </p>
                              </div>
                            </div>

                            <button className={styles.orderTypeIcon}>
                              {order.type === "call" ? (
                                <Phone size={20} />
                              ) : (
                                <MessageCircle size={20} />
                              )}
                            </button>
                          </div>

                          <div className={styles.orderCardBottom}>
                            <button className={styles.rateButton}>
                              Rate Consultation
                            </button>
                            <div className={styles.buttonSeparator}></div>
                            <button className={styles.consultAgainButton}>
                              Consult Again
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}

                {/* Loading more indicator */}
                {isFetchingCalls && orderHistoryTab === "call" && (
                  <div className={styles.loadingMore}>
                    <p>Loading more...</p>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <p>
                  No {orderHistoryTab === "call" ? "call" : "chat"} orders yet
                </p>
                <button
                  className={styles.exploreButton}
                  onClick={() => navigate("/astrologers")}
                >
                  Explore Astrologers
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "Transactions" && (
          <div className={styles.transactionsContent}>
            {/* Transaction History */}
            <div
              className={styles.transactionList}
              ref={transactionListRef}
              onScroll={handleTransactionScroll}
            >
              {allLoadedTransactions.length > 0 ? (
                <>
                  {allLoadedTransactions.map((transaction) => (
                    <div
                      key={transaction._id}
                      className={styles.transactionItem}
                    >
                      <div className={styles.transactionContent}>
                        <div className={styles.transactionLeft}>
                          <div className={styles.transactionTop}>
                            <span className={styles.transactionId}>
                              #{transaction._id} •{" "}
                              {dayjs(transaction.createdAt).format(
                                "MMM DD, YYYY",
                              )}{" "}
                              • {dayjs(transaction.createdAt).format("hh:mm A")}
                            </span>
                          </div>
                          <h4 className={styles.transactionDescription}>
                            {transaction.description || "Transaction with"}{" "}
                            {transaction?.displayProfile?.name}
                          </h4>
                        </div>
                        <div className={styles.transactionRight}>
                          <span
                            className={`${styles.transactionAmount} ${transaction?.billing?.user?.action === "credit" ? styles.credit : styles.debit}`}
                          >
                            {transaction?.billing?.user?.action === "credit"
                              ? "+"
                              : "-"}{" "}
                            ₹{transaction?.billing?.user?.debitAmount}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isFetchingTransactions && (
                    <div className={styles.loadingMore}>
                      <p>Loading more...</p>
                    </div>
                  )}
                </>
              ) : isFetchingTransactions ? (
                <div className={styles.loadingState}>
                  <p>Loading transactions...</p>
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <p>No transactions yet</p>
                </div>
              )}
            </div>

            {/* Sticky Contact Support Button */}
            <div className={styles.stickyButtonContainer}>
              <button
                className={styles.contactSupportButton}
                onClick={() => navigate("/contact-us")}
              >
                Contact Support
                <ChevronLeft
                  size={20}
                  style={{ transform: "rotate(180deg)" }}
                />
              </button>
            </div>
          </div>
        )}

        {activeTab === "Support" && (
          <div className={styles.supportContent}>
            {/* Support Grid Cards */}
            <div className={styles.supportGrid}>
              <div
                className={styles.supportGridCard}
                onClick={() => navigate("/contact-us")}
              >
                <div className={styles.supportGridIcon}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM12 6C9.79 6 8 7.79 8 10H10C10 8.9 10.9 8 12 8C13.1 8 14 8.9 14 10C14 12 11 11.75 11 15H13C13 12.75 16 12.5 16 10C16 7.79 14.21 6 12 6Z"
                      fill="white"
                    />
                  </svg>
                </div>
                <h4 className={styles.supportGridTitle}>Customer Support</h4>
                <p className={styles.supportGridDesc}>
                  Chat with our team for quick help on app or consultation
                  queries.
                </p>
              </div>

              <div
                className={styles.supportGridCard}
                onClick={() => navigate("/faq")}
              >
                <div className={styles.supportGridIcon}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 19H11V17H13V19ZM15.07 11.25L14.17 12.17C13.45 12.9 13 13.5 13 15H11V14.5C11 13.4 11.45 12.4 12.17 11.67L13.41 10.41C13.78 10.05 14 9.55 14 9C14 7.9 13.1 7 12 7C10.9 7 10 7.9 10 9H8C8 6.79 9.79 5 12 5C14.21 5 16 6.79 16 9C16 9.88 15.64 10.68 15.07 11.25Z"
                      fill="white"
                    />
                  </svg>
                </div>
                <h4 className={styles.supportGridTitle}>FAQs</h4>
                <p className={styles.supportGridDesc}>
                  Find quick answers to common astrology and app questions.
                </p>
              </div>

              <div
                className={styles.supportGridCard}
                onClick={() => navigate("/support-tickets")}
              >
                <div className={styles.supportGridIcon}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM7 10H9V17H7V10ZM11 7H13V17H11V7ZM15 13H17V17H15V13Z"
                      fill="white"
                    />
                  </svg>
                </div>
                <h4 className={styles.supportGridTitle}>Recent Tickets</h4>
                <p className={styles.supportGridDesc}>
                  Track updates on your latest support requests.
                </p>
              </div>

              <div
                className={styles.supportGridCard}
                onClick={() => navigate("/privacy")}
              >
                <div className={styles.supportGridIcon}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM12 11.99H19C18.47 16.11 15.72 19.78 12 20.93V12H5V6.3L12 3.19V11.99Z"
                      fill="white"
                    />
                  </svg>
                </div>
                <h4 className={styles.supportGridTitle}>Privacy & Security</h4>
                <p className={styles.supportGridDesc}>
                  Manage your data and privacy preferences.
                </p>
              </div>
            </div>

            {/* Others Section */}
            <div className={styles.othersSection}>
              <h3 className={styles.othersTitle}>Others</h3>

              <div
                className={styles.otherCard}
                onClick={() => navigate("/feedback")}
              >
                <div className={styles.otherCardLeft}>
                  <h4 className={styles.otherCardTitle}>App Feedback</h4>
                  <p className={styles.otherCardDesc}>
                    Share suggestions to improve your astro experience.
                  </p>
                </div>
                <ChevronLeft
                  size={20}
                  style={{ transform: "rotate(180deg)" }}
                  className={styles.otherCardIcon}
                />
              </div>

              <div
                className={styles.otherCard}
                onClick={() => navigate("/community-guidelines")}
              >
                <div className={styles.otherCardLeft}>
                  <h4 className={styles.otherCardTitle}>
                    Community Guidelines
                  </h4>
                  <p className={styles.otherCardDesc}>
                    Learn how to use the platform safely and respectfully.
                  </p>
                </div>
                <ChevronLeft
                  size={20}
                  style={{ transform: "rotate(180deg)" }}
                  className={styles.otherCardIcon}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className={styles.modalOverlay} onClick={handleDeleteCancel}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={styles.modalTitle}>Delete Profile</h3>
            <p className={styles.modalMessage}>
              Are you sure you want to delete this profile? This action cannot
              be undone.
            </p>
            <div className={styles.modalActions}>
              <button
                className={`${styles.modalBtn} ${styles.cancelBtn}`}
                onClick={handleDeleteCancel}
              >
                Cancel
              </button>
              <button
                className={`${styles.modalBtn} ${styles.deleteBtn}`}
                onClick={handleDeleteConfirm}
                disabled={isDeletingKundli}
              >
                {isDeletingKundli ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
