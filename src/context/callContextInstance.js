import { createContext } from "react";

/*
 * Same reasoning as waitingQueueContextInstance.js: keeping the context object
 * in a module with no component exports stops React Refresh from re-evaluating
 * it and handing out a fresh context identity mid-session, which surfaces as
 * "must be used within a Provider" on a component that plainly is inside one.
 *
 * CallContext.jsx exports both CallProvider and useCall, so it had the same
 * hazard as the WaitingQueue one that actually broke the astrologer profile page.
 */
export const CallContext = createContext();
