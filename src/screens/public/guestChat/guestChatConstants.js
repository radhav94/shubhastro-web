// Shared key for the guest chat auto-accept handshake.
// When set, the astrologer's chat acceptance is accepted automatically on the
// user's behalf (no accept/reject popup) — used by GuestChatFlow and the global
// WaitingQueueContext. Value is the target astrologer id.
export const GUEST_AUTO_ACCEPT_KEY = "shubhtalk_guest_auto_accept";

// Guest fan-out (first-accept-wins) support.
// When a guest initiates a call/chat we fan out the request to the selected
// astrologer AND the similarOnlineAstrologers returned by preSessionBalanceCheck.
// The first astrologer to accept is auto-accepted; the remaining requests are
// withdrawn. This flag is set (to Date.now()) the moment the first acceptance is
// auto-accepted so that any late "astrologer_accepted" events from the other
// fanned-out astrologers can be auto-rejected instead of showing a ring popup.
export const GUEST_FANOUT_RESOLVED_KEY = "shubhtalk_guest_fanout_resolved";

// Late acceptances are only treated as fan-out stragglers within this window.
// After it elapses the flag is ignored (and cleared) so it can never interfere
// with a later, unrelated session.
export const GUEST_FANOUT_RESOLVED_WINDOW_MS = 90 * 1000;
