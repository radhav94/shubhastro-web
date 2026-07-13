import { useMemo, useState, useRef, useCallback, Suspense } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useIsOverflowing from "../../../hooks/useIsOverflowing";
import { privateRequestNew } from "../../../services/appServices/privateRequestNew";
import { useAstrologerConnect } from "../../../utils/hooks/useAstrologerConnect";
import RechargeModal from "../../../component/UI/modal/RechargeModal/RechargeModal";
import { useLazyGetAstrologerByIdQuery } from "../../../redux/api/astrologer/astrologerApi";
import { PANDIT_AI_ID } from "../../../component/panditAI/usePanditAI";
import EmergencySessionModal from "../../../component/UI/modal/EmergencySessionModal/EmergencySessionModal";

// Inject getAllUserSessions endpoint
const sessionsApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    getAllUserSessions: builder.query({
      query: ({ page = 1, limit = 6 } = {}) => ({
        url: "sessions/getAllUserSessions",
        method: "GET",
        params: { page, limit },
      }),
    }),
  }),
  overrideExisting: false,
});

const { useGetAllUserSessionsQuery } = sessionsApi;

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const getSessionType = (sessiontype) => {
  if (sessiontype === 'chat')  return 'Chat Session';
  if (sessiontype === 'audio') return 'Call Session';
  if (sessiontype === 'video') return 'Video Session';
  return 'Session';
};

const MySessionsSection = ({ userId, navigate, styles, astrologerMaleImg }) => {
  const { data, isLoading } = useGetAllUserSessionsQuery(
    { page: 1, limit: 6 },
    { skip: !userId }
  );

  const {
    handleChatStart,
    handleCallStart,
    openModal,
    setOpenModal,
    selectedAstrologer,
    activeCallAstroRef,
  } = useAstrologerConnect();

  const [fetchAstrologer] = useLazyGetAstrologerByIdQuery();
  const [lastConnectionType, setLastConnectionType] = useState("chat");
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyAstrologer, setEmergencyAstrologer] = useState(null);
  const scrollRef = useRef(null);

  const scrollByCards = useCallback((direction) => {
    const grid = scrollRef.current;
    if (!grid) return;
    const amount = Math.max(grid.clientWidth * 0.8, 240);
    grid.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  }, []);

  const sessions = useMemo(() => {
    return Array.isArray(data?.data?.recentSessions)
      ? data.data.recentSessions.slice(0, 6)
      : [];
  }, [data]);

  const canScroll = useIsOverflowing(scrollRef, [sessions]);

  if (isLoading || !sessions.length) return null;

  const handleAgain = async (session) => {
    if (!session._id) {
      console.error("Astrologer _id not found in session");
      return;
    }

    // Block re-connect while the astrologer is live streaming.
    if (session?.astrologerLiveStatus?.isLive === true) return;

    // Fetch full astrologer data to get experience and other fields
    let astrologer = {
      _id: session._id,
      astrologerID: session.astrologerID,
      firstName: session.astrologerName?.split(' ')[0] || session.astrologerName,
      lastName: session.astrologerName?.split(' ').slice(1).join(' ') || '',
      profileImgUrl: session.profileImgUrl,
      isActiveType: session.isActiveType,
      price: session.price,
      experience: session.experience,
    };

    try {
      const { data: astroData } = await fetchAstrologer({ id: session._id });
      if (astroData?.data) {
        astrologer = { ...astrologer, ...astroData.data };
      }
    } catch {
      console.warn("Failed to fetch astrologer details, using session data");
    }

    activeCallAstroRef.current = astrologer;

    let result;
    if (session.sessiontype === 'chat') {
      setLastConnectionType("chat");
      result = await handleChatStart(astrologer);
    } else if (session.sessiontype === 'video') {
      setLastConnectionType("video");
      result = await handleCallStart(astrologer, 'video');
    } else {
      setLastConnectionType("audio");
      result = await handleCallStart(astrologer, 'audio');
    }

    // If astrologer is offline but emergency is available, show emergency modal
    if (result?.emergencyAvailable) {
      setEmergencyAstrologer(astrologer);
      setShowEmergencyModal(true);
    }
  };

  return (
    <div className={styles.astrologerSliderWrapper} style={{ position: "relative" }}>
      {canScroll && (
        <button
          type="button"
          className={`${styles.gridSliderBtn} ${styles.gridSliderBtnLeft}`}
          onClick={() => scrollByCards("left")}
          aria-label="Scroll left"
        >
          <ChevronLeft size={20} />
        </button>
      )}
      <section className={styles.mySessionsSection}>
      <div className={styles.mySessionsHeader}>
        <div className={`${styles.titleWithBottomDevider}`}>
          <h4 className={styles.wowTitle}>MY SESSIONS</h4>
          <div className={styles.BottomDevider}>
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="11" viewBox="0 0 4 5" fill="none">
              <path d="M3.39392 4.18679C3.03602 4.50885 2.58016 4.7032 2.08582 4.7032C0.934798 4.7032 0 3.64991 0 2.35021C0 1.05329 0.934798 0 2.08582 0C2.18869 0 2.2891 0.00867403 2.38704 0.0232501C1.91056 0.452549 1.60687 1.11403 1.60687 1.85706C1.60687 3.04084 2.38458 4.02125 3.39392 4.18679Z" fill="#030303"/>
            </svg>
          </div>
        </div>
        <button className={styles.viewAllBtn} onClick={() => navigate('/profile', { state: { activeTab: 'Order History' } })}>View All &rsaquo;</button>
      </div>

      <div className={styles.sessionScroll} ref={scrollRef}>
        {sessions.map((session, idx) => {
          const isLive = session?.astrologerLiveStatus?.isLive === true;
          return (
          <div key={session.roomId || idx} className={styles.sessionCard}>
            {/* Avatar */}
            <div className={styles.sessionAvatar}>
              <img
                src={session.profileImgUrl || astrologerMaleImg}
                alt={session.astrologerName}
                onError={e => { e.target.src = astrologerMaleImg; }}
              />
              <span className={styles.sessionOnlineDot} style={{ background: isLive ? '#e53e3e' : session.isActive ? '#22c55e' : '#9ca3af' }} />
            </div>

            {/* Info */}
            <div className={styles.sessionInfo}>
              <h3 className={styles.sessionName}>{session.astrologerName || 'Astrologer'}</h3>
              <div className={styles.sessionMeta}>
                <span className={styles.sessionDate}>{formatDate(session.startTime)}</span>
                <span className={styles.sessionDivider}>|</span>
                <span className={styles.sessionType}>
                  {session.sessiontype === 'chat' ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill="#f75801"/>
                    </svg>
                  ) : session.sessiontype === 'video' ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="#f75801">
                      <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="#f75801"/>
                    </svg>
                  )}
                  {getSessionType(session.sessiontype)}
                </span>
              </div>

              <div className={styles.sessionActions}>
                {session.sessiontype === 'chat' ? (
                  /* Chat History button */
                  <button
                    className={styles.sessionHistoryBtn}
                    onClick={() => navigate(`/profile/order-history/${session._id}`, { state: { tab: 'Chat' } })}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f75801" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                      <path d="M3 3v5h5"/>
                      <path d="M12 7v5l4 2"/>
                    </svg>
                    History
                  </button>
                ) : session.sessiontype === 'video' ? (
                  /* Video History button */
                  <button
                    className={styles.sessionHistoryBtn}
                    onClick={() => navigate(`/profile/order-history/${session._id}`, { state: { tab: 'Video' } })}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#f75801">
                      <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                    </svg>
                    History
                  </button>
                ) : (
                  /* Audio player pill for call sessions */
                  <div className={styles.sessionPlayer} onClick={() => navigate(`/profile/order-history/${session._id}`, { state: { tab: 'Call' } })} style={{ cursor: 'pointer' }}>
                    <button className={styles.sessionPlayBtn} onClick={(e) => { e.stopPropagation(); navigate(`/profile/order-history/${session._id}`, { state: { tab: 'Call' } }); }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#f75801">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </button>
                    <div className={styles.sessionWave}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="24" viewBox="0 0 36 24" fill="none">
                        <path d="M0.849557 16.0142C1.31681 16.0142 1.69911 15.6319 1.69911 15.1646V8.79292C1.69911 8.32566 1.31681 7.94336 0.849557 7.94336C0.382301 7.94336 0 8.32566 0 8.79292V15.1646C0 15.6319 0.382301 16.0142 0.849557 16.0142Z" fill="#E56329"/>
                        <path d="M4.24805 5.60688V18.3502C4.24805 18.8175 4.63035 19.1998 5.0976 19.1998C5.56486 19.1998 5.94716 18.8175 5.94716 18.3502V5.60688C5.94716 5.13963 5.56486 4.75732 5.0976 4.75732C4.63035 4.75732 4.24805 5.13963 4.24805 5.60688Z" fill="#E56329"/>
                        <path d="M8.2832 0.849557V23.1504C8.2832 23.6177 8.6655 24 9.13276 24C9.60002 24 9.98232 23.6177 9.98232 23.1504V0.849557C9.98232 0.382301 9.60002 0 9.13276 0C8.6655 0 8.2832 0.339823 8.2832 0.849557Z" fill="#E56329"/>
                        <path d="M13.1699 5.60688V18.3502C13.1699 18.8175 13.5522 19.1998 14.0195 19.1998C14.4867 19.1998 14.869 18.8175 14.869 18.3502V5.60688C14.869 5.13963 14.4867 4.75732 14.0195 4.75732C13.5522 4.75732 13.1699 5.13963 13.1699 5.60688Z" fill="#E56329"/>
                        <path d="M16.9922 8.79292V15.1646C16.9922 15.6319 17.3745 16.0142 17.8417 16.0142C18.309 16.0142 18.6913 15.6319 18.6913 15.1646V8.79292C18.6913 8.32566 18.309 7.94336 17.8417 7.94336C17.3745 7.94336 16.9922 8.32566 16.9922 8.79292Z" fill="#E56329"/>
                        <path d="M21.4512 5.60688V18.3502C21.4512 18.8175 21.8335 19.1998 22.3007 19.1998C22.768 19.1998 23.1503 18.8175 23.1503 18.3502V5.60688C23.1503 5.13963 22.768 4.75732 22.3007 4.75732C21.8335 4.75732 21.4512 5.13963 21.4512 5.60688Z" fill="#E56329"/>
                        <path d="M25.5293 1.35932V22.5983C25.5293 23.0655 25.9116 23.4478 26.3789 23.4478C26.8461 23.4478 27.2284 23.0655 27.2284 22.5983V1.35932C27.2284 0.892066 26.8461 0.509766 26.3789 0.509766C25.9116 0.509766 25.5293 0.892066 25.5293 1.35932Z" fill="#E56329"/>
                        <path d="M30.373 4.75732C29.9057 4.75732 29.5234 5.13963 29.5234 5.60688V18.3502C29.5234 18.8175 29.9057 19.1998 30.373 19.1998C30.8403 19.1998 31.2226 18.8175 31.2226 18.3502V5.60688C31.2226 5.13963 30.8403 4.75732 30.373 4.75732Z" fill="#E56329"/>
                        <path d="M35.0449 7.94336C34.5776 7.94336 34.1953 8.32566 34.1953 8.79292V15.1646C34.1953 15.6319 34.5776 16.0142 35.0449 16.0142C35.5121 16.0142 35.8944 15.6319 35.8944 15.1646V8.79292C35.8944 8.32566 35.5121 7.94336 35.0449 7.94336Z" fill="#E56329"/>
                      </svg>
                    </div>
                  </div>
                )}

                {/* Action button - hide for AI Astrologer */}
                {session._id !== PANDIT_AI_ID && (
                  <button
                    className={styles.sessionCallBtn}
                    onClick={() => handleAgain(session)}
                    disabled={isLive}
                  >
                    {session.sessiontype === 'chat' ? 'Chat Again' : 'Call Again'}
                  </button>
                )}
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {/* Recharge Modal for insufficient balance */}
      <RechargeModal
        isOpen={openModal.recharge}
        onClose={() => setOpenModal((prev) => ({ ...prev, recharge: false }))}
        astrologer={selectedAstrologer}
        connectionType={lastConnectionType}
      />

      {/* Emergency Session Modal */}
      {showEmergencyModal && (
        <Suspense fallback={null}>
          <EmergencySessionModal
            isOpen={true}
            onClose={() => { setShowEmergencyModal(false); setEmergencyAstrologer(null); }}
            astrologer={emergencyAstrologer}
            onChatNow={(astro) => handleChatStart(astro, true, true)}
            onCallNow={(astro) => handleCallStart(astro, lastConnectionType === "video" ? "video" : "audio", true)}
          />
        </Suspense>
      )}
      </section>
      {canScroll && (
        <button
          type="button"
          className={`${styles.gridSliderBtn} ${styles.gridSliderBtnRight}`}
          onClick={() => scrollByCards("right")}
          aria-label="Scroll right"
        >
          <ChevronRight size={20} />
        </button>
      )}
    </div>
  );
};

export default MySessionsSection;
