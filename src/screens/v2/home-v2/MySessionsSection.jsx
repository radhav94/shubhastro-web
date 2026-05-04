import { useMemo } from "react";
import { privateRequestNew } from "../../../services/appServices/privateRequestNew";

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

  const sessions = useMemo(() => {
    return Array.isArray(data?.data?.recentSessions)
      ? data.data.recentSessions.slice(0, 6)
      : [];
  }, [data]);

  if (isLoading || !sessions.length) return null;

  return (
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
        <button className={styles.viewAllBtn} onClick={() => navigate('/profile')}>View all &rsaquo;</button>
      </div>

      <div className={styles.sessionScroll}>
        {sessions.map((session, idx) => (
          <div key={session.roomId || idx} className={styles.sessionCard}>
            {/* Avatar */}
            <div className={styles.sessionAvatar}>
              <img
                src={session.profileImgUrl || astrologerMaleImg}
                alt={session.astrologerName}
                onError={e => { e.target.src = astrologerMaleImg; }}
              />
              <span className={styles.sessionOnlineDot} />
            </div>

            {/* Info */}
            <div className={styles.sessionInfo}>
              <h3 className={styles.sessionName}>{session.astrologerName || 'Astrologer'}</h3>
              <div className={styles.sessionMeta}>
                <span className={styles.sessionDate}>{formatDate(session.startTime)}</span>
                <span className={styles.sessionDivider}>|</span>
                <span className={styles.sessionType}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="#f75801"/>
                  </svg>
                  {getSessionType(session.sessiontype)}
                </span>
              </div>

              <div className={styles.sessionActions}>
                {/* Voice player */}
                <div className={styles.sessionPlayer}>
                  <button className={styles.sessionPlayBtn}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#f75801">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </button>
                  <div className={styles.sessionWave}>
                    {[4, 8, 14, 18, 22, 16, 22, 18, 14, 8, 4].map((h, i) => (
                      <span key={i} className={styles.sessionWaveBar} style={{ height: `${h}px` }} />
                    ))}
                  </div>
                </div>

                {/* Action button */}
                <button
                  className={styles.sessionCallBtn}
                  onClick={() => navigate('/chat-with-astrologers')}
                >
                  {session.sessiontype === 'chat' ? 'Chat Again' : 'Call Again'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default MySessionsSection;
