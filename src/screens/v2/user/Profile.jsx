import {
  ChevronLeft,
  LogOut,
  Sun,
  Moon,
  Sparkles,
  Filter,
  ArrowUpDown,
  Phone,
  Video,
  MessageCircle,
  Star,
  Trash2,
} from "lucide-react";
import { TiUserDelete } from "react-icons/ti";
import { LuPencilLine } from "react-icons/lu";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useState, useRef, useEffect } from "react";
import dayjs from "dayjs";
import { useGetTransactionsQuery } from "../../../services/appServices/transactionService";
import { useGetAllKundlisQuery } from "../../../services/appServices/kundliServicesNew";
import { useGetCallHistoryQuery } from "../../../redux/api/callHistory/callHistory";
import { useGetUserChatMessagesQuery } from "../../../redux/api/chatHistory/chatHistory";
import { useWalletBalance } from "../../private/wallet/useWalletBalance";
import { getUserFromStorage } from "../../../utils/authStorage";
import { useChat } from "../../../context/ChatContext";
import { useCall } from "../../../context/CallContext";
import { voiceSocket } from "../../../services/voiceSocketServices";
import { useCreateChatRoomMutation } from "../../../redux/api/chatApi";
import ConnectAstrologerPopup from "../../private/v2/components/ui/ConnectAstrologerPopup";
import { useAstrologerConnect } from "../../../utils/hooks/useAstrologerConnect";
import { useGetAstrologerByIdQuery } from "../../../redux/api/astrologer/astrologerApi";
import AddProfileModal from "../../../component/UI/Profile/AddProfileModal";
import EditProfileModal from "../../../component/UI/Profile/EditProfileModal";
import DeleteConfirmationModal from "../../../component/UI/modal/deleteModal/DeleteConfirmationModal";
import { useProfileManager } from "../../private/kundli/hooks/useProfileManager";
import WaitingModal from "../../../component/UI/modal/waitingModal/WaitingModal";
import { useGetAstroDetailsQuery } from "../../../redux/api/kundli/kundliApi";
import { buildVedicParam } from "../../../utils/VedicParams.js/vedicParams";
import { PATH } from "../../../utils/routes/Paths";
import { logout, updateRegistrationStatus } from "../../../redux/auth/authSlice";
import { setSelectedKundli } from "../../../redux/kundli/kundliSlice";
import styles from "./Profile.module.scss";
import profileWallet from "../../../assets/images/profile-wallet.jpg";
import { Toast } from "../../../component/index";
import StickyReview from "../../private/home/components/call/StickyReview";
import MallHistoryContent from "../../private/shubhAstroMallHistory/MallHistoryContent";
import {
  useCreateKundliMutation,
  useDeleteKundliMutation,
  useEditKundliMutation,
} from "../../../services/appServices/kundliServicesNew";
import Pagination from "../../../component/pagination/Pagination";
import { ProfileManager } from "../../../component/UI/Profile";
import { registerUser } from "../../../services/appServices/authService";
import { useSelector } from "react-redux";
import { clearSelectedKundli } from "../../../redux/kundli/kundliSlice";

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Get state from navigation
  const navigationState = location.state || {};

  // Get isRegister from Redux auth state
  const isRegister = useSelector((state) => state.auth.isRegister);

  const [activeTab, setActiveTab] = useState(
    navigationState.activeTab || "Profile"
  );
  const [orderHistoryTab, setOrderHistoryTab] = useState("call"); // Sub-tab for order history
  const transactionListRef = useRef(null);
  const orderListRef = useRef(null); // Ref for order history scroll
  const user = getUserFromStorage();
  // const userName = user
  //   ? user.firstName && user.lastName
  //     ? `${user.firstName} ${user.lastName}`
  //     : user.phoneNumber || "Guest User"
  //   : "Guest User";
  const userId = localStorage.getItem("shubhtalk_customer_id");

  // Connect popup state
  const [isConnectPopupOpen, setIsConnectPopupOpen] = useState(false);
  const [selectedAstrologer, setSelectedAstrologer] = useState(null);
  const [selectedAstrologerId, setSelectedAstrologerId] = useState(null);
  const [callRoomId, setCallRoomId] = useState(null);
  const [chatRoomId, setChatRoomId] = useState(null);
  const [connectionType, setConnectionType] = useState(null);
  const activeAstroRef = useRef(null);

  // Fetch latest astrologer details when selected (for dynamic pricing)
  const {
    data: latestAstrologerData,
    isLoading: isLoadingAstrologer,
    isFetching: isFetchingAstrologer,
  } = useGetAstrologerByIdQuery(
    { id: selectedAstrologerId },
    { skip: !selectedAstrologerId }
  );

  // Update activeAstroRef when latest astrologer data is fetched
  useEffect(() => {
    if (latestAstrologerData?.data) {
      activeAstroRef.current = latestAstrologerData.data;
      console.log('✅ Updated activeAstroRef with latest pricing:', latestAstrologerData.data.price);
    }
  }, [latestAstrologerData]);

  // Get contexts
  const {
    waitingList: WaitingList,
    setWaitingList,
    resetChatFlow,
    setActiveChatRoomId,
    setActiveChat,
    setChatSeconds,
  } = useChat();
  const {
    waitingList: callWaitingList,
    setWaitingList: setCallWaitingList,
    resetCallFlow,
    setActiveCallRoomId,
    setActiveCall,
    setOpenReview,
    setReviewData,
  } = useCall();

  const [createChatRoom] = useCreateChatRoomMutation();

  // Use profile manager hook
  const { selectedProfile, profiles, profilesLoading, isCreating } =
    useProfileManager(dispatch);

  // Profile modal state
  const [showAddProfileModal, setShowAddProfileModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [profileToEdit, setProfileToEdit] = useState(null);
  const [profileToDelete, setProfileToDelete] = useState(null);

  // RTK Query hooks for profile operations
  const [createKundli, { isLoading: isCreatingProfile }] =
    useCreateKundliMutation();
  const [deleteKundli] = useDeleteKundliMutation();
  const [editKundli] = useEditKundliMutation();

  // Use the astrologer connect hook
  const {
    handleChatStart,
    handleCallStart,
    handleAfterKundliSelect: hookHandleAfterKundliSelect,
    openModal: hookOpenModal,
    setOpenModal: hookSetOpenModal,
  } = useAstrologerConnect();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [allLoadedTransactions, setAllLoadedTransactions] = useState([]);

  // Call history pagination state
  const [callHistoryPage, setCallHistoryPage] = useState(1);

  // Chat history pagination state
  const [chatHistoryPage, setChatHistoryPage] = useState(1);

  // Fetch call and chat history
  const {
    data: callHistoryData,
    isLoading: isLoadingCalls,
    isFetching: isFetchingCalls,
  } = useGetCallHistoryQuery(
    { userId, page: callHistoryPage, limit: 10 },
    { skip: !userId },
  );
  console.log("callHistoryData",callHistoryData?.data?.callHistory)

  const { data: chatHistoryData, isLoading: isLoadingChats, isFetching: isFetchingChats } =
    useGetUserChatMessagesQuery({ userId, page: chatHistoryPage, limit: 10 }, {
      skip: !userId,
    });


  // Get pagination info
  const callPagination = callHistoryData?.data?.pagination;
  const hasNextCallPage = callPagination?.hasNextPage || false;
  const hasPrevCallPage = callPagination?.hasPreviousPage || false;

  const chatPagination = chatHistoryData?.data?.pagination;
  const hasNextChatPage = chatPagination?.hasNextPage || false;
  const hasPrevChatPage = chatPagination?.hasPreviousPage || false;



  const formatDuration = (seconds = 0) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} Min ${secs} Secs`;
  };
  // Process order history data - current page call orders
  const callOrders = Array.isArray(callHistoryData?.data?.callHistory)
    ? callHistoryData.data.callHistory
        .filter((item) => item?.type !== "chat")
        .map((item, index) => ({
          id: `call-${callHistoryPage}-${index}`,
          type: "call",
          sessionType: item?.type || "audio",
          astrologer: {
            name: item?.receiverName || "Unknown",
            image: item?.astrologerProfileImgUrl || "",
            _id: item?.receiverId,
            astrologer_ID: item?.astrologer_ID || item?.receiverAstrologerId,
            firstName: item?.receiverName?.split(" ")[0] || "Unknown",
            lastName: item?.receiverName?.split(" ").slice(1).join(" ") || "",
            isActive: true,
          },
          date: item?.timestamp || new Date(),
          duration: `${item?.duration || 0} Min`,
          amount: item?.amount || 0,
          rate: 0,
          status: item?.status || "completed",
          roomId: item?.roomId,
          year: item?.timestamp
            ? new Date(item.timestamp).getFullYear()
            : new Date().getFullYear(),
        }))
    : [];

  const chatOrders = Array.isArray(chatHistoryData?.data?.chatHistory)
    ? chatHistoryData.data.chatHistory.map((room, index) => {
        const lastChat = room?.[room.length - 1];
        // const chatDuration = Math.round(room?.totalDuration)
        return {
          id: `chat-${chatHistoryPage}-${index}`,
          type: "chat",
          // orderId: room.roomId?.slice(-6) || "NA",
          astrologer: {
            name: room.astrologerFirstName
              ? `${room.astrologerFirstName} ${room.astrologerLastName || ""}`
              : "Unknown",
            image: room.astrologerProfileImgUrl || "",
            _id: room.astrologerId,
            astrologer_ID: room.astrologer_ID || room.astrologerAstrologerId,
            firstName: room.astrologerFirstName || "Unknown",
            lastName: room.astrologerLastName || "",
            isActive: true,
          },
          date: lastChat?.createdAt || new Date(),
          duration: `${formatDuration(Math.round(room?.totalDuration)) || 0}`,
          amount: room?.amount || 0,
          rate: room?.rate || 0,
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
  } = useGetAllKundlisQuery(userId, {
    skip: !userId,
    refetchOnMountOrArgChange: true, // Always refetch when component mounts or userId changes
  });
  const savedKundlis = kundliData?.data || [];

  // Debug: Log kundli structure
  useEffect(() => {
    if (savedKundlis.length > 0) {
      console.log("First kundli structure:", savedKundlis[0]);
      console.log("Available ID fields:", {
        _id: savedKundlis[0]._id,
        kundli_ID: savedKundlis[0].kundli_ID,
        id: savedKundlis[0].id,
      });
    }
  }, [savedKundlis]);

  // Helper: Get primary profile (prioritize Redux selectedKundli, then 'self' relation, otherwise first profile)
  const selectedKundli = useSelector((state) => state.kundli.selectedKundli);
  const primaryProfile = (() => {
    if (selectedKundli?._id) {
      const found = savedKundlis.find(p => p._id === selectedKundli._id);
      if (found) return found;
    }
    return savedKundlis.find(profile => profile.relation?.toLowerCase() === 'self') || savedKundlis[0];
  })();

  // Capitalize first letter of each word
  const capitalizeWords = (str) => {
    if (!str) return str;
    return str
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

    // Get user name with fallback to first Kundli name
 
  const userName = (() => {
    // Top priority: If a kundli is explicitly selected from dropdown, show its name
    if (selectedKundli?._id && primaryProfile?.name) {
      return capitalizeWords(primaryProfile.name);
    }

    // First priority: User's registered name
    if (user?.firstName && user?.lastName) {
      return capitalizeWords(`${user.firstName} ${user.lastName}`);
    }
    if (user?.firstName) {
      return capitalizeWords(user.firstName);
    }
    
    // Second priority: Primary Kundli profile name (self or first)
    if (primaryProfile?.name) {
      return capitalizeWords(primaryProfile.name);
    }
    
    // Third priority: Phone number
    if (user?.phoneNumber) {
      return user.phoneNumber;
    }
    
    // Last resort
    return "Guest User";
  })();
  // Build params for Kundali API from primary profile
  const kundliParams = primaryProfile
    ? buildVedicParam({
        name: primaryProfile.name,
        gender:
          primaryProfile.gender === "male"
            ? "Male"
            : primaryProfile.gender === "female"
              ? "Female"
              : "Others",
        day: primaryProfile.day,
        month: primaryProfile.month,
        year: primaryProfile.year,
        hour:
          primaryProfile.hour > 12
            ? primaryProfile.hour - 12
            : primaryProfile.hour === 0
              ? 12
              : primaryProfile.hour,
        min: primaryProfile.min,
        meridiem: primaryProfile.hour >= 12 ? "PM" : "AM",
        birthPlace: primaryProfile.place,
        lat: primaryProfile.lat,
        lon: primaryProfile.lon,
        tzone: 5.5,
      })
    : null;

  // Fetch astrological details
  const {
    data: astroData,
    isLoading: isLoadingAstro,
    isError: isAstroError,
  } = useGetAstroDetailsQuery(kundliParams, {
    skip: !kundliParams,
  });

  const astroDetails = astroData?.response;

  // Delete kundli mutation - removed, now using ProfileManager

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

  // Reset pages when switching tabs
  useEffect(() => {
    if (orderHistoryTab === "call") {
      setCallHistoryPage(1);
    } else {
      setChatHistoryPage(1);
    }
  }, [orderHistoryTab]);

  // Restore waiting state from localStorage on mount
  useEffect(() => {
    const savedWaitingState = localStorage.getItem("waitingState");
    if (savedWaitingState) {
      try {
        const { roomId, type, timestamp } = JSON.parse(savedWaitingState);

        // Check if waiting state is not too old (max 30 minutes)
        const now = Date.now();
        const maxAge = 30 * 60 * 1000; // 30 minutes

        if (now - timestamp < maxAge) {
          // Restore state
          setConnectionType(type);
          if (type === "chat") {
            setChatRoomId(roomId);
            setWaitingList(2);
          } else {
            setCallRoomId(roomId);
            setCallWaitingList(5);
          }

          // Reconnect socket if needed
          if (!voiceSocket.connected && userId) {
            voiceSocket.io.opts.query = {
              userId: userId,
              role: "CUSTOMER",
            };
            voiceSocket.connect();
          }
        } else {
          // Clear old waiting state
          localStorage.removeItem("waitingState");
        }
      } catch (error) {
        console.error("Error restoring waiting state:", error);
        localStorage.removeItem("waitingState");
      }
    }
  }, [userId, setWaitingList, setCallWaitingList]);

  // Socket event listeners for waiting modal
  useEffect(() => {
    if (!userId) return;

    const handleChatRoom = (data) => {
      setChatRoomId(data?.roomId);
      setActiveChatRoomId(data?.roomId);
      setWaitingList(data?.waitingTime || 2);
      setConnectionType("chat");

      // Save to localStorage
      localStorage.setItem(
        "waitingState",
        JSON.stringify({
          roomId: data?.roomId,
          type: "chat",
          timestamp: Date.now(),
        }),
      );
    };

    const handleCallRoom = (data) => {
      setCallRoomId(data?.roomId);
      setActiveCallRoomId(data?.roomId);
      setCallWaitingList(data?.waitingTime || 5);
      setConnectionType(data?.type || "audio");

      // Save to localStorage
      localStorage.setItem(
        "waitingState",
        JSON.stringify({
          roomId: data?.roomId,
          type: data?.type || "audio",
          timestamp: Date.now(),
        }),
      );
    };

    const handleChatAccepted = async ({
      roomId,
      astrologerId,
      userId,
      ...data
    }) => {
      setWaitingList(false);

      // Clear localStorage
      localStorage.removeItem("waitingState");

      const astro = activeAstroRef.current;
      const kundliId = selectedProfile?._id;

      try {
        if (!roomId) throw new Error("Room ID missing");

        setActiveChat({
          roomId,
          chatRoomId: roomId,
          callerName: `${astro?.firstName || ""} ${astro?.lastName || ""}`.trim(),
          isUserSide: true,
          userId: userId,
          astrologerId: astrologerId,
          kundliId,
          astrologerName: data?.astrologer?.firstName || "",
          remainingTime: data?.remainingTime,
        });
        setChatSeconds(Number(data?.remainingTime) * 60);

        // Navigate to chat page
        navigate(`/chat-with-astrologers/${astrologerId}`, {
          state: {
            userId: userId,
            astrologerId,
            fullName: `${astro?.firstName || ""} ${astro?.lastName || ""}`.trim(),
            roomId,
            isUserSide: true,
            kundliId,
            astrologerName: data?.astrologer?.firstName || "",
            astroID: data?.astrologer?.astrologer_ID,
          },
        });
      } catch (e) {
        console.error("Chat accepted error:", e);
        Toast.error("Failed to start chat");
      }
    };

    const handleCallAccepted = async ({
      roomId,
      token,
      type,
      remainingTime,
      isSwitch,
    }) => {
      // If there's an active audio call and this is a video acceptance, it's an upgrade — let CallContext handle it
      if (type === "video" && activeCall && activeCall.callType === "audio") {
        console.log("🔄 Video upgrade accepted - CallContext will handle the switch (isSwitch:", isSwitch, ")");
        resetCallFlow();
        localStorage.removeItem("waitingState");
        return;
      }

      // If there's an active video call and this is an audio acceptance, it's a downgrade — let CallContext handle it
      if (type === "audio" && activeCall && activeCall.callType === "video") {
        console.log("🔄 Audio downgrade accepted - CallContext will handle the switch (isSwitch:", isSwitch, ")");
        resetCallFlow();
        localStorage.removeItem("waitingState");
        return;
      }
      
      // Regular call acceptance
      resetCallFlow();

      // Clear localStorage
      localStorage.removeItem("waitingState");

      const astro = activeAstroRef.current;
      const kundliId = selectedProfile?._id;

      try {
        if (!astro) {
          console.error("❌ Astrologer data missing in ref");
          Toast.error("Astrologer data missing");
          return;
        }

        const res = await createChatRoom({
          userId: userId,
          astrologerId: astro._id,
        });

        const chatRoomId = res?.data?.data;
        if (!chatRoomId) throw new Error("Failed to create chat room");

        setActiveCall({
          roomId,
          chatRoomId,
          agoraToken: token,
          callerName: `${astro?.firstName || ""} ${astro?.lastName || ""}`.trim(),
          isUserSide: true,
          callType: type,
          userId: userId,
          astrologerId: astro._id,
          kundliId,
          astrologerID: astro?.astrologer_ID,
          remainingTime,
        });
      } catch (error) {
        console.error("Call accepted error:", error);
        Toast.error("Failed to start call");
      }
    };

    const handleRejected = (data) => {
      // Check if this is a switch rejection during an active call
      if (data?.switchRejected && (data?.type === "audio" || data?.type === "video")) {
        console.log("🔄 Call switch rejected - current call continues");
        // Don't reset anything - the current call should continue
        return;
      }
      
      // Regular call rejection - end everything
      const errorMsg =
        data?.sessionData?.sessionEndReason === "rejected" &&
        data?.type === "chat"
          ? "Astrologer has rejected the chat request"
          : "Astrologer has rejected the call request";
      Toast.error(errorMsg);

      // Clear localStorage
      localStorage.removeItem("waitingState");

      resetChatFlow();
      resetCallFlow();
      setConnectionType(null);
    };

    const handleSocketError = (err) => {
      Toast.error(err?.message || "Connection error");

      // Clear localStorage
      localStorage.removeItem("waitingState");

      resetChatFlow();
      resetCallFlow();
      setConnectionType(null);
    };

    // Attach events
    voiceSocket.on("chat:room", handleChatRoom);
    voiceSocket.on("call:room", handleCallRoom);
    voiceSocket.on("chat:accepted", handleChatAccepted);
    voiceSocket.on("call:accepted", handleCallAccepted);
    voiceSocket.on("chat:rejected", handleRejected);
    voiceSocket.on("call:rejected", handleRejected);
    voiceSocket.on("error", handleSocketError);

    return () => {
      voiceSocket.off("chat:room", handleChatRoom);
      voiceSocket.off("call:room", handleCallRoom);
      voiceSocket.off("chat:accepted", handleChatAccepted);
      voiceSocket.off("call:accepted", handleCallAccepted);
      voiceSocket.off("chat:rejected", handleRejected);
      voiceSocket.off("call:rejected", handleRejected);
      voiceSocket.off("error", handleSocketError);
    };
  }, [
    userId,
    navigate,
    resetChatFlow,
    resetCallFlow,
    setWaitingList,
    setCallWaitingList,
    setActiveChatRoomId,
    setActiveCallRoomId,
  ]);

  // Reset waiting state function
  const resetCallState = () => {
    // Cancel the active room on server based on connection type
    if (connectionType === "chat" && chatRoomId) {
      voiceSocket.emit("chat:cancel", { roomId: chatRoomId });
    } else if (
      (connectionType === "audio" || connectionType === "video") &&
      callRoomId
    ) {
      voiceSocket.emit("call:cancel", { roomId: callRoomId });
    }

    // Explicitly reset waiting states to false
    setWaitingList(false);
    setCallWaitingList(false);

    // Reset local state
    setCallRoomId(null);
    setChatRoomId(null);
    setConnectionType(null);

    // Clear localStorage
    localStorage.removeItem("waitingState");

    // Reset context flows
    resetChatFlow();
    resetCallFlow();
  };

  // Handle connect button click
  const handleConnectClick = (astrologer) => {
    console.log("astrologer", astrologer);
    // Check if already in waiting state
    if (WaitingList || callWaitingList) {
      Toast.error(
        "You are already waiting for an astrologer. Please cancel the current request first.",
      );
      return;
    }

    // Set the astrologer ID to trigger fetching latest details
    setSelectedAstrologerId(astrologer._id);
    setSelectedAstrologer(astrologer); // Keep basic info for immediate display
    activeAstroRef.current = astrologer;
    setIsConnectPopupOpen(true);
  };

  // Handle rate consultation button click
  const handleRateConsultation = (astrologer, roomId) => {
    console.log("astrologerssss",astrologer)
    setReviewData({
      astrologerID: astrologer.astrologer_ID || astrologer._id,
      fullName: `${astrologer.firstName} ${astrologer.lastName || ""}`.trim(),
      roomId,
    });
    setOpenReview(true);
  };

  const handleClosePopup = () => {
    setIsConnectPopupOpen(false);
    setSelectedAstrologer(null);
    setSelectedAstrologerId(null); // Clear the ID to stop fetching
  };

  // Handler for ProfileManager startCallMode - receives selected profile and triggers connection
  const handleProfileManagerStartCall = (selectedProfile) => {
    hookHandleAfterKundliSelect(selectedProfile);
  };

  // Delete kundli handlers - now using direct modals
  const handleOpenAddProfileModal = () => {
    setShowAddProfileModal(true);
  };

  const handleEditClick = (kundli) => {
    setProfileToEdit(kundli);
    setShowEditProfileModal(true);
  };

  const handleDeleteClick = (kundli) => {
    console.log("=== DELETE BUTTON CLICKED ===");
    console.log("Full kundli object:", kundli);
    console.log("Available ID fields:");
    console.log("  - kundli._id:", kundli._id);
    console.log("  - kundli.id:", kundli.id);
    console.log("  - kundli.kundli_ID:", kundli.kundli_ID);
    console.log("  - kundli.kundliId:", kundli.kundliId);
    
    // Use _id (same as other working components)
    const idToDelete = kundli._id;
    
    if (!idToDelete) {
      console.error("❌ No valid ID found!");
      Toast.error("Cannot delete: Invalid profile ID");
      return;
    }
    
    console.log("✅ Using ID:", idToDelete);
    console.log("ID type:", typeof idToDelete);
    console.log("ID length:", idToDelete.length);
    
    setProfileToDelete(idToDelete);
    setShowDeleteModal(true);
  };

  const handleCloseAddProfile = () => {
    setShowAddProfileModal(false);
  };

  const handleCloseEditProfile = () => {
    setShowEditProfileModal(false);
    setProfileToEdit(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setProfileToDelete(null);
  };

  // Helper function to build kundli payload
  const buildKundliPayload = (data) => {
    const dateObj = new Date(data.birthDate);
    const timeObj = data.birthTime ? data.birthTime.split(":") : ["0", "0"];

    return {
      name: data.name,
      gender: data.identity.toLowerCase(),
      relation: data.relation || "Self",
      day: dateObj.getDate(),
      month: dateObj.getMonth() + 1,
      year: dateObj.getFullYear(),
      hour: data.unknownBirthTime ? "00" : String(parseInt(timeObj[0])).padStart(2, "0"),
      min: data.unknownBirthTime ? "00" : String(parseInt(timeObj[1])).padStart(2, "0"),
      second: "00",
      place: data.birthPlace,
      lat: data.latitude || 0,
      lon: data.longitude || 0,
      tzone: 5.5,
    };
  };

  // Helper function to check for duplicate kundli
  const isDuplicateKundli = (payload, list) =>
    list.some(
      (k) =>
        k.name.trim().toLowerCase() === payload.name.trim().toLowerCase() &&
        k.gender.toLowerCase() === payload.gender.toLowerCase() &&
        Number(k.day) === Number(payload.day) &&
        Number(k.month) === Number(payload.month) &&
        Number(k.year) === Number(payload.year) &&
        Number(k.hour) === Number(payload.hour) &&
        Number(k.min) === Number(payload.min) &&
        Math.abs(Number(k.lat) - Number(payload.lat)) < 0.0001 &&
        Math.abs(Number(k.lon) - Number(payload.lon)) < 0.0001 &&
        k.place.trim().toLowerCase() === payload.place.trim().toLowerCase(),
    );

  // Get initial data for edit modal
  const getEditInitialData = () => {
    if (!profileToEdit) return null;

    return {
      name: profileToEdit.name,
      identity:
        profileToEdit.gender === "male"
          ? "Male"
          : profileToEdit.gender === "female"
            ? "Female"
            : "Others",
      relation: profileToEdit.relation
        ? profileToEdit.relation.charAt(0).toUpperCase() + profileToEdit.relation.slice(1).toLowerCase()
        : "Self",
      birthDate: `${profileToEdit.year}-${String(profileToEdit.month).padStart(2, "0")}-${String(profileToEdit.day).padStart(2, "0")}`,
      birthTime: `${String(profileToEdit.hour).padStart(2, "0")}:${String(profileToEdit.min).padStart(2, "0")}`,
      birthPlace: profileToEdit.place,
      unknownBirthTime: false,
      latitude: profileToEdit.lat,
      longitude: profileToEdit.lon,
    };
  };

  const handleSubmitProfile = async (formData) => {
    try {
      const payload = buildKundliPayload(formData);

      // Check for duplicate
      if (isDuplicateKundli(payload, savedKundlis)) {
        Toast.error("This profile already exists");
        throw new Error("Duplicate profile");
      }

      // Only call registerUser API if:
      // 1. User skipped onboarding (isRegister = false)
      // 2. AND the profile being added is "Self" relation
      // 3. AND user has not been registered yet (check localStorage as source of truth)
      const isSelfProfile = formData.relation?.toLowerCase() === "self";
      
      // Check if user is already registered from localStorage (source of truth)
      const currentUserData = localStorage.getItem("userData");
      const parsedUserData = currentUserData ? JSON.parse(currentUserData) : {};
      const isAlreadyRegistered = parsedUserData.isRegister === true;
      
      if (isRegister === false && isSelfProfile && !isAlreadyRegistered) {
        console.log("📝 User not registered and adding Self profile, calling registration API first...");
        
        // Prepare registration payload from profile data
        const dateObj = new Date(formData.birthDate);
        const phoneNumber = user?.phoneNumber || localStorage.getItem("shubhtalk_customer_phone") || "";
        const cleanPhone = phoneNumber.replace(/^\+?91/, "");
        const formattedPhone = `91${cleanPhone}`;
        
        const registrationPayload = {
          firstName: formData.name.split(" ")[0] || formData.name,
          lastName: formData.name.split(" ").slice(1).join(" ") || "",
          dateOfBirth: formData.birthDate,
          place: formData.birthPlace,
          phoneNumber: formattedPhone,
          password: "TempPass@123",
          email: `${formattedPhone}@shubhtalk.com`,
          gender: formData.identity.toLowerCase() === "others" ? "other" : formData.identity.toLowerCase(),
          languagePreferences: ["en"],
          role: "CUSTOMER",
          lat: formData.latitude || 0,
          lon: formData.longitude || 0,
        };

        try {
          const regResponse = await registerUser(registrationPayload);
          console.log("✅ Registration successful:", regResponse);
          
          // Update localStorage with registration data
          const updatedUserData = {
            ...parsedUserData,
            isRegister: true,
            firstName: registrationPayload.firstName,
            lastName: registrationPayload.lastName,
            place: formData.birthPlace,
            dateOfBirth: formData.birthDate,
            gender: formData.identity,
          };
          localStorage.setItem("userData", JSON.stringify(updatedUserData));
          
          // Update Redux state to reflect registration
          dispatch(updateRegistrationStatus({ isRegister: true }));
          
          // Update shubhtalk_user for TopBar
          const currentUser = localStorage.getItem("shubhtalk_user");
          const parsedUser = currentUser ? JSON.parse(currentUser) : {};
          const updatedUser = {
            ...parsedUser,
            firstName: registrationPayload.firstName,
            lastName: registrationPayload.lastName,
            place: formData.birthPlace,
          };
          localStorage.setItem("shubhtalk_user", JSON.stringify(updatedUser));
          
          // Dispatch event to notify components
          window.dispatchEvent(new Event("auth-change"));
          
          Toast.success("Registration completed successfully");
        } catch (regErr) {
          console.error("❌ Registration failed:", regErr);
          const errorMessage = regErr?.response?.data?.message || regErr?.message || "Registration failed. Please try again.";
          
          // If user is already registered, update localStorage and continue
          if (errorMessage.toLowerCase().includes("already registered") || errorMessage.toLowerCase().includes("already exists")) {
            console.log("⚠️ User already registered, updating local state and continuing...");
            const updatedUserData = {
              ...parsedUserData,
              isRegister: true,
            };
            localStorage.setItem("userData", JSON.stringify(updatedUserData));
            
            // Update Redux state
            dispatch(updateRegistrationStatus({ isRegister: true }));
            
            // Don't throw error, continue with kundli creation
          } else {
            Toast.error(errorMessage);
            throw regErr;
          }
        }
      } else if (isSelfProfile && isAlreadyRegistered) {
        console.log("✅ User already registered, skipping registration API");
      }

      // Now create the kundli profile
      const result = await createKundli(payload).unwrap();
      
      // If this is a Self profile, update shubhtalk_user to reflect the new name in TopHeader
      if (isSelfProfile && result?.data) {
        const currentUser = localStorage.getItem("shubhtalk_user");
        const parsedUser = currentUser ? JSON.parse(currentUser) : {};
        const updatedUser = {
          ...parsedUser,
          firstName: formData.name.split(" ")[0] || formData.name,
          lastName: formData.name.split(" ").slice(1).join(" ") || "",
          place: formData.birthPlace,
        };
        localStorage.setItem("shubhtalk_user", JSON.stringify(updatedUser));
        
        // Dispatch event to notify TopHeader to update
        window.dispatchEvent(new Event("auth-change"));
        console.log("✅ Updated shubhtalk_user with new Self profile name");
      }
      
      Toast.success("Profile added successfully");
      setShowAddProfileModal(false);
    } catch (err) {
      console.error("Add profile error:", err);
      setShowAddProfileModal(false);
      // Only show custom toast for duplicate error (already shown above)
      // For API errors, global handler in privateRequestNew.js will show the toast
      if (err.message !== "Duplicate profile") {
        throw err;
      }
    }
  };

  // Handler: Submit edited profile
  const handleSubmitEditProfile = async (formData) => {
    try {
      if (!profileToEdit) return;

      // Build payload with updated data
      const payload = buildKundliPayload(formData);

      // Call editKundli with id and payload
      await editKundli({
        id: profileToEdit.kundli_ID,
        ...payload,
      }).unwrap();

      Toast.success("Profile updated successfully");

      setShowEditProfileModal(false);
      setProfileToEdit(null);
    } catch (err) {
      console.error("Edit profile error:", err);
      throw err;
    }
  };

  // Handler: Confirm delete profile
  const confirmDeleteProfile = async () => {
    if (!profileToDelete) {
      console.error("No profile ID to delete");
      return;
    }

    console.log("=== DELETE PROFILE DEBUG ===");
    console.log("Profile ID to delete:", profileToDelete);
    console.log("Type of ID:", typeof profileToDelete);
    console.log("ID length:", profileToDelete?.length);

    try {
      const result = await deleteKundli(profileToDelete).unwrap();
      console.log("Delete successful:", result);
      Toast.success("Profile deleted successfully");

      setShowDeleteModal(false);
      setProfileToDelete(null);
    } catch (err) {
      console.error("=== DELETE ERROR ===");
      console.error("Full error:", err);
      console.error("Error data:", err?.data);
      console.error("Error message:", err?.data?.message || err?.message);
      
      const errorMessage = err?.data?.message || err?.message || "Failed to delete profile";
      Toast.error(errorMessage);
      
      setShowDeleteModal(false);
      setProfileToDelete(null);
    }
  };

  const handleLogout = () => {
   
    // Dispatch Redux logout action
    dispatch(logout());
     dispatch(clearSelectedKundli())
    
    // Clear all authentication related data from localStorage
    localStorage.clear();

    window.dispatchEvent(new Event("auth-change"));

    // Navigate to home page
    navigate("/");
  };

  const tabs = ["Profile", "Order History", "ShubhAstro Mall History", "Transactions", "Support"];

  // Get initials for avatar
  const getInitials = (name) => {
    const names = name.split(" ");
    return names
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get user avatar display (initials or emoji)
  const userAvatarDisplay = (() => {
    // If a kundli is explicitly selected from dropdown, show its initials
    if (selectedKundli?._id && primaryProfile?.name) {
      return getInitials(primaryProfile.name);
    }

    // If user has registered name, show initials
    if (user?.firstName && user?.lastName) {
      return getInitials(`${user.firstName} ${user.lastName}`);
    }
    if (user?.firstName) {
      return user.firstName.charAt(0).toUpperCase();
    }
    
    // If primary kundli exists, show its initials
    if (primaryProfile?.name) {
      return getInitials(primaryProfile.name);
    }
    
    // Default: show goat emoji
    return "🐏";
  })();

  return (
    <div className={styles.profilePage}>
      {/* Header */}
      <div className={styles.profileHeader}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <ChevronLeft size={24} />
        </button>

        <div className={styles.headerCenter}>
          <div className={styles.userAvatar}>
            <span>{userAvatarDisplay}</span>
          </div>
          <div className={styles.headerInfo}>
            <h1 className={styles.profileName}>{userName}</h1>
            <p className={styles.profileDetails}>
              {primaryProfile
                ? `${dayjs(`${primaryProfile.year}-${primaryProfile.month}-${primaryProfile.day}`).format("MMM DD, YYYY")} • ${String(primaryProfile.hour > 12 ? primaryProfile.hour - 12 : primaryProfile.hour === 0 ? 12 : primaryProfile.hour).padStart(2, "0")}:${String(primaryProfile.min).padStart(2, "0")} ${primaryProfile.hour >= 12 ? "PM" : "AM"}`
                : " "}
            </p>
            {user?.phoneNumber && (
              <p className={styles.profileDetails}>{user.phoneNumber.startsWith("+") ? user.phoneNumber : `+${user.phoneNumber}`}</p>
            )}
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
            <span className={styles.zodiacLabel}>
              {isLoadingAstro
                ? "Loading..."
                : isAstroError || !astroDetails?.sun_sign
                  ? "-"
                  : astroDetails.sun_sign}
            </span>
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
            <span className={styles.zodiacLabel}>
              {isLoadingAstro
                ? "Loading..."
                : isAstroError || !astroDetails?.rasi
                  ? "-"
                  : astroDetails.rasi}
            </span>
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
            <span className={styles.zodiacLabel}>
              {isLoadingAstro
                ? "Loading..."
                : isAstroError || !astroDetails?.ascendant_sign
                  ? "-"
                  : astroDetails.ascendant_sign}
            </span>
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
            {/* <Sparkles size={16} fill="#FFF" color="#FFF" /> */}
            <span className={styles.balanceLabel}>Balance</span>
          </div>
          <div className={styles.balanceAmount}>
            ₹{Number(balance || 0).toLocaleString("en-IN")}
          </div>
        </div>

        <button
          className={styles.addMinutesButton}
          onClick={() => navigate("/recharge")}
        >
          Recharge Wallet
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
                  <div
                    key={kundli._id}
                    className={`${styles.profileCard} ${selectedKundli?._id === kundli._id ? styles.profileCardSelected : ""}`}
                    onClick={() => dispatch(setSelectedKundli(kundli))}
                    style={{ cursor: "pointer" }}
                  >
                    <div className={styles.avatarCircle}>
                      <span>{getInitials(kundli.name)}</span>
                    </div>

                    <div className={styles.profileCardContent}>
                      <div className={styles.profileCardHeader}>
                        <div className={styles.badge}>{kundli?.relation}</div>
                        <div className={styles.profileActions}>
                          <button
                            className={styles.iconButton}
                            onClick={(e) => { e.stopPropagation(); handleEditClick(kundli); }}
                            type="button"
                          >
                            <LuPencilLine size={18} />
                          </button>
                          {kundli?.relation !== "Self" && kundli?.relation !== "self" && (
                            <button
                              className={styles.iconButton}
                              onClick={(e) => { e.stopPropagation(); handleDeleteClick(kundli); }}
                              type="button"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </div>

                      <h3 className={styles.profileCardName}>{kundli.name}</h3>
                      <p className={styles.profileCardDate}>
                        {dayjs(
                          `${kundli.year}-${kundli.month}-${kundli.day}`,
                        ).format("DD MMM YYYY")}{" "}
                        • {String(kundli.hour > 12 ? kundli.hour - 12 : kundli.hour === 0 ? 12 : kundli.hour).padStart(2, "0")}:
                        {String(kundli.min).padStart(2, "0")} {kundli.hour >= 12 ? "PM" : "AM"}
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
                  onClick={handleOpenAddProfileModal}
                >
                  Add Profile +
                </button>
              </>
            ) : (
              <div className={styles.emptyState}>
                <p>No profiles found</p>
                <button
                  className={styles.addProfileButton}
                  onClick={handleOpenAddProfileModal}
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

            {(orderHistoryTab === "call" ? isLoadingCalls : isLoadingChats) ? (
              <div className={styles.loadingState}>
                <p>Loading orders...</p>
              </div>
            ) : filteredOrders.length > 0 ? (
              <>
              <div
                key={orderHistoryTab}
                className={styles.orderList}
                ref={orderListRef}
              >
                {/* Loading overlay for page transitions */}
                {(orderHistoryTab === "call" ? isFetchingCalls : isFetchingChats) && (
                  <div className={styles.loadingMore}>
                    <p>Loading...</p>
                  </div>
                )}

                {/* Orders by Year */}
                {Object.keys(ordersByYear)
                  .sort((a, b) => b - a)
                  .map((year) => (
                    <div key={year} className={styles.yearSection}>
                      <h4 className={styles.yearTitle}>{year}</h4>

                      {ordersByYear[year].map((order) => (
                        <div 
                          key={order.id} 
                          className={styles.orderCard}
                          onClick={() => navigate(`/profile/order-history/${order.astrologer._id}`)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className={styles.orderCardTop}>
                            <div className={styles.orderLeft}>
                              <div 
                                className={styles.astrologerAvatar} 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/astrologer/${order.astrologer._id}`);
                                }} 
                                style={{ cursor: 'pointer' }}
                              >
                                {order.astrologer.image ? (
                                  <img src={order.astrologer.image} alt={order.astrologer.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                  <span>{getInitials(order.astrologer.name)}</span>
                                )}
                              </div>
                              <div className={styles.orderInfo}>
                                <h5 
                                  className={styles.astrologerName}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/astrologer/${order.astrologer._id}`);
                                  }}
                                  style={{ cursor: 'pointer' }}
                                >
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
                                order.sessionType === "video" ? <Video size={20} /> : <Phone size={20} />
                              ) : (
                                <MessageCircle size={20} />
                              )}
                            </button>
                          </div>

                          <div className={styles.orderCardBottom}>
                            <button
                              className={styles.rateButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRateConsultation(order.astrologer, order.roomId);
                              }}
                            >
                              Rate Consultation
                            </button>
                            <div className={styles.buttonSeparator}></div>
                            <button
                              className={styles.consultAgainButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleConnectClick(order.astrologer);
                              }}
                            >
                              Consult Again
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}

              </div>

              {/* Pagination Controls - outside scrollable orderList */}
              {(() => {
                const isCall = orderHistoryTab === "call";
                const page = isCall ? callHistoryPage : chatHistoryPage;
                const totalPages = isCall ? (callPagination?.totalPages || 1) : (chatPagination?.totalPages || 1);
                const hasPrev = isCall ? hasPrevCallPage : hasPrevChatPage;
                const hasNext = isCall ? hasNextCallPage : hasNextChatPage;

                return totalPages > 1 ? (
                  <Pagination
                    pagination={{
                      page,
                      totalPages,
                      hasNextPage: hasNext,
                      hasPrevPage: hasPrev,
                    }}
                    onPageChange={(newPage) => {
                      if (isCall) setCallHistoryPage(newPage);
                      else setChatHistoryPage(newPage);
                    }}
                  />
                ) : null;
              })()}
              </>
            ) : (
              <div className={styles.emptyState}>
                <p>
                  No {orderHistoryTab === "call" ? "call" : "chat"} orders yet
                </p>
                <button
                  className={styles.exploreButton}
                  onClick={() => navigate("/chat-with-astrologers")}
                >
                  Explore Astrologers
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "ShubhAstro Mall History" && (
          <MallHistoryContent />
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
                onClick={() => navigate("/customer-support", { state: { fromTab: "Support" } })}
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
                onClick={() => navigate("/faq", { state: { fromTab: "Support" } })}
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
                onClick={() => navigate(PATH.privateRoutes.RECENT_TICKETS.path, { state: { fromTab: "Support" } })}
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
                onClick={() => navigate("/privacy", { state: { activeTab } })}
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
                onClick={() => navigate("/feedback", { state: { fromTab: "Support" } })}
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
                onClick={() => navigate("/community-guidelines", { state: { fromTab: "Support" } })}
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

      <ProfileManager
        isOpen={hookOpenModal.kundli}
        onClose={() => hookSetOpenModal((prev) => ({ ...prev, kundli: false }))}
        startCallMode={true}
        onStartCall={handleProfileManagerStartCall}
        title="Select Profile to Continue"
        enabledOperations={{
          list: true,
          add: true,
          edit: true,
          delete: true,
        }}
      />

      {/* Connect Astrologer Popup */}
      <ConnectAstrologerPopup
        isOpen={isConnectPopupOpen}
        onClose={handleClosePopup}
        astrologer={latestAstrologerData?.data || selectedAstrologer}
        isLoadingAstrologer={isLoadingAstrologer || isFetchingAstrologer}
        onChatStart={handleChatStart}
        onCallStart={handleCallStart}
      />


      {/* Add Profile Modal */}
      <AddProfileModal
        isOpen={showAddProfileModal}
        onClose={handleCloseAddProfile}
        onSubmit={handleSubmitProfile}
        isLoading={isCreatingProfile}
        title="Add Profile"
        savedKundlis={savedKundlis}
        showProfileListing={false}
      />

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={showEditProfileModal}
        onClose={handleCloseEditProfile}
        onSubmit={handleSubmitEditProfile}
        isLoading={isCreatingProfile}
        title="Edit Profile"
        savedKundlis={savedKundlis}
        initialData={getEditInitialData()}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        title="Delete Profile"
        message="Are you sure you want to delete this profile? This action cannot be undone."
        onCancel={handleCancelDelete}
        onConfirm={confirmDeleteProfile}
      />

      {/* Sticky Review Modal */}
      <StickyReview />
    </div>
  );
};

export default Profile;
