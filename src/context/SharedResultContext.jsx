import { createContext, useContext, useMemo } from "react";

/*
 * Marks the subtree as "someone else's result, opened from a share link".
 *
 * The AI-Wow result screens are reused verbatim on /shared/:historyId so a
 * shared reading looks exactly like the owner's. What must not be reused are the
 * owner-only actions on those screens — PDF download (charges the wallet),
 * subscription upsells and the wallet/charges/history queries behind them. A
 * guest has no wallet and no history, and those calls would 401.
 *
 * Passing a prop down would mean threading a flag through every result screen
 * and every component it renders, so this is context: the shared page provides
 * it, and `useSharedResultView()` returns a harmless default everywhere else.
 *
 * `historyId` is here because the shared payload deliberately has no ids in it
 * (the backend strips them), yet the share button on the page still needs one to
 * build the link it copies.
 */
const NOT_SHARED = { isSharedView: false, historyId: null };

const SharedResultContext = createContext(NOT_SHARED);

export const SharedResultProvider = ({ historyId, children }) => {
  const value = useMemo(() => ({ isSharedView: true, historyId: historyId || null }), [historyId]);
  return <SharedResultContext.Provider value={value}>{children}</SharedResultContext.Provider>;
};

/** @returns {{ isSharedView: boolean, historyId: string|null }} */
export const useSharedResultView = () => useContext(SharedResultContext);
