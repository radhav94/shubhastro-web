import { useState, useCallback, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Search, ArrowUpDown, UserPlus } from "lucide-react";
import dayjs from "dayjs";
import { useLazyGetFollowedAstrologersQuery } from "../../../redux/api/astrologer/followedAstrologersApi";
import {
  useFollowAstrologerByIdMutation,
  useUnfollowAstrologerByIdMutation,
} from "../../../redux/api/astrologer/followAstrologerApi";
import styles from "./FollowedAstrologers.module.scss";
import {
  getAstrologerDisplayName,
  getAstrologerProfilePath,
} from "../../../utils/helper/string.utils";

const SORT_OPTIONS = [
  { label: "Default", value: "" },
  { label: "Newest first", value: "desc" },
  { label: "Oldest first", value: "asc" },
];
const PAGE_LIMIT = 10;
const SEARCH_DEBOUNCE_MS = 400;

const FollowedAstrologers = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [allAstrologers, setAllAstrologers] = useState([]);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const loaderRef = useRef(null);
  const canLoadMore = useRef(false);
  const fetchIdRef = useRef(0);

  const [getFollowedAstrologers, { isLoading, isFetching }] =
    useLazyGetFollowedAstrologersQuery();

  const [followAstrologer] = useFollowAstrologerByIdMutation();
  const [unfollowAstrologer] = useUnfollowAstrologerByIdMutation();
  const activeSort = SORT_OPTIONS.find((option) => option.value === sortOrder) || SORT_OPTIONS[0];

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset to page 1 when search or sort changes
  useEffect(() => {
    setPage(1);
    setAllAstrologers([]);
  }, [debouncedSearch, sortOrder]);

  // Fetch data — uses the result from the trigger directly to avoid stale `data`
  useEffect(() => {
    const currentFetchId = ++fetchIdRef.current;

    getFollowedAstrologers({
      page,
      limit: PAGE_LIMIT,
      searchTerm: debouncedSearch,
      sortOrder,
    })
      .unwrap()
      .then((result) => {
        // Ignore if a newer fetch has been started
        if (currentFetchId !== fetchIdRef.current) return;

        const items = Array.isArray(result?.data) ? result.data : [];
        setHasNextPage(result?.pagination?.hasNextPage ?? false);

        setAllAstrologers((prev) => {
          if (page === 1) return items;

          const seenIds = new Set(
            prev.map((item) => item.astrologerId || item.astrologer?._id).filter(Boolean)
          );
          const newItems = items.filter((item) => {
            const id = item.astrologerId || item.astrologer?._id;
            return id && !seenIds.has(id);
          });
          return [...prev, ...newItems];
        });
      })
      .catch(() => {
        // handled by base query
      });
  }, [getFollowedAstrologers, page, debouncedSearch, sortOrder]);

  // Keep ref in sync so observer callback always has latest values
  useEffect(() => {
    canLoadMore.current = hasNextPage && !isFetching;
  }, [hasNextPage, isFetching]);

  // Infinite scroll observer
  useEffect(() => {
    const node = loaderRef.current;
    if (!node || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && canLoadMore.current) {
          canLoadMore.current = false;
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, allAstrologers.length]);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
  };

  const handleSortSelect = (value) => {
    setSortOrder(value);
    setIsSortOpen(false);
  };

  const handleUnfollow = async (astrologerId) => {
    if (!astrologerId) return;

    setUpdatingId(astrologerId);
    try {
      await unfollowAstrologer({ astrologerId }).unwrap();
      setAllAstrologers((prev) =>
        prev.map((item) => {
          const id = item.astrologerId || item.astrologer?._id;
          return id === astrologerId ? { ...item, isFollowing: false } : item;
        })
      );
    } catch (_err) {
      // handled by base query
    } finally {
      setUpdatingId(null);
    }
  };

  const handleFollow = async (astrologerId) => {
    if (!astrologerId) return;

    setUpdatingId(astrologerId);
    try {
      await followAstrologer({ astrologerId }).unwrap();
      setAllAstrologers((prev) =>
        prev.map((item) => {
          const id = item.astrologerId || item.astrologer?._id;
          return id === astrologerId ? { ...item, isFollowing: true } : item;
        })
      );
    } catch (_err) {
      // handled by base query
    } finally {
      setUpdatingId(null);
    }
  };

  const getInitials = useCallback((name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.headerWrap}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <ChevronLeft size={20} />
          </button>
          <h1 className={styles.headerTitle}>Astrologer You Follow</h1>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.searchWrapper}>
          <div className={styles.searchContainer}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search name"
              value={search}
              onChange={handleSearchChange}
              className={styles.searchInput}
            />
          </div>
        </div>

        <div className={styles.sortRow}>
          <span className={styles.sortLabel}>
            Sort by <strong>{activeSort.label}</strong>
          </span>
          <button
            className={styles.sortBtn}
            onClick={() => setIsSortOpen(true)}
            aria-label="Open sort options"
          >
            <ArrowUpDown size={20} />
          </button>
        </div>

        {isLoading && page === 1 ? (
          <p className={styles.loading}>Loading...</p>
        ) : allAstrologers.length === 0 && !isFetching ? (
          <p className={styles.empty}>
            {search ? "No astrologers found" : "You haven't followed any astrologers yet"}
          </p>
        ) : (
          <div className={styles.list}>
            {allAstrologers.map((item) => {
              const astro = item.astrologer || {};
              const name = astro.fullName || getAstrologerDisplayName(astro) || "Astrologer";
              const id = item.astrologerId || astro._id;
              const image = astro.profileImgUrl;
              const isFollowing = item.isFollowing !== false;
              const since = item.followedAt;

              return (
                <div key={id} className={styles.card}>
                  {/*
                    The avatar and name open the astrologer, as they do in every
                    other astrologer list in the app (NewAstrologerCard,
                    TopAstrologerCard, SessionCard all wrap in this same Link).
                    Previously the only interactive element in the row was the
                    Follow button, so tapping the astrologer you follow did
                    nothing at all — a dead click on the most obvious target in
                    the list. The Link deliberately wraps only the avatar and
                    text so it can't swallow taps meant for Follow/Unfollow.
                  */}
                  <Link
                    to={getAstrologerProfilePath(astro, id)}
                    className={styles.cardLink}
                    aria-label={`View ${name}'s profile`}
                  >
                    {image ? (
                      <img
                        src={image}
                        alt={name}
                        className={styles.avatar}
                        onError={(e) => {
                          e.target.style.display = "none";
                          if (e.target.nextSibling) {
                            e.target.nextSibling.style.display = "flex";
                          }
                        }}
                      />
                    ) : null}
                    <div
                      className={styles.avatarInitials}
                      style={image ? { display: "none" } : {}}
                    >
                      {getInitials(name)}
                    </div>

                    <div className={styles.info}>
                      <p className={styles.name}>{name}</p>
                      {since && (
                        <p className={styles.since}>
                          Following since {dayjs(since).format("DD MMM, YYYY")}
                        </p>
                      )}
                    </div>
                  </Link>

                  {isFollowing ? (
                    <button
                      className={styles.followingBtn}
                      onClick={() => handleUnfollow(id)}
                      disabled={updatingId === id}
                    >
                      {updatingId === id ? "Updating..." : "Following"}
                    </button>
                  ) : (
                    <button
                      className={styles.followBtn}
                      onClick={() => handleFollow(id)}
                      disabled={updatingId === id}
                    >
                      <UserPlus size={14} />
                      {updatingId === id ? "Updating..." : "Follow"}
                    </button>
                  )}
                </div>
              );
            })}

            {/* Infinite scroll trigger */}
            <div ref={loaderRef} className={styles.scrollTrigger}>
              {isFetching && <p className={styles.loadingMore}>Loading more...</p>}
            </div>
          </div>
        )}
      </div>

      {isSortOpen && (
        <div className={styles.sortOverlay} onClick={() => setIsSortOpen(false)}>
          <div className={styles.sortSheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.sheetHandle} />
            <h2 className={styles.sheetTitle}>Sort By</h2>
            <div className={styles.sheetOptions}>
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.label}
                  className={styles.sheetOption}
                  onClick={() => handleSortSelect(option.value)}
                >
                  <span>{option.label}</span>
                  <span
                    className={`${styles.radio} ${
                      sortOrder === option.value ? styles.radioActive : ""
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FollowedAstrologers;
