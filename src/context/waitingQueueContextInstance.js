import { createContext } from "react";

/*
 * The context object lives here, on its own, deliberately.
 *
 * It used to be created at module scope inside WaitingQueueContext.jsx, which
 * also exports the WaitingQueueProvider component. React Refresh treats a module
 * with component exports as hot-swappable, so editing that file (or anything it
 * imports) re-evaluated it and ran `createContext()` again — producing a NEW
 * context identity. Components already mounted kept providing the OLD object
 * while freshly re-evaluated consumers read the new one, so `useContext`
 * returned undefined and `useWaitingQueue` threw
 * "useWaitingQueue must be used within a WaitingQueueProvider" on pages that
 * were clearly inside the provider (StickyChatFooter in HomeLayout, and
 * TalkToAstrologer). The only recovery was a full page reload.
 *
 * This file exports no components, so React Refresh will not hot-replace it and
 * the identity stays stable for the life of the page. That is the same thing the
 * `react-refresh/only-export-components` lint rule is asking for.
 *
 * Dev-only failure — a production build has no HMR — but it costs real debugging
 * time and looks exactly like a missing provider.
 */
export const WaitingQueueContext = createContext();
