import { useCallback, useRef, useState } from "react";

/**
 * Two-stage recommendation popup.
 *
 * Pressing Call or Chat opens the plain list first — astrologers at their normal
 * rate. Only when the user dismisses that does the discounted version appear, as
 * a last offer on the way out. Leading with the discount would give it away to
 * people who were going to connect at full price anyway.
 *
 * Two different exits, and the difference matters:
 *
 *   dismiss()  the user closed the popup       -> may escalate to the offer
 *   finish()   a connection is under way       -> close, never show the offer
 *
 * Without that split, starting a call from the plain list would drop a
 * "before you go" popup on top of the connecting screen.
 *
 * The offer is shown at most once per mount, so closing it does not simply
 * reopen it, and reopening the plain list later does not nag again.
 *
 * @returns {{
 *   isOpen: boolean,
 *   stage: 'plain' | 'offer' | null,
 *   type: string | null,
 *   open: (type: string) => void,
 *   dismiss: () => void,
 *   finish: () => void,
 * }}
 */
export const useRecommendationOffer = () => {
  const [state, setState] = useState({ open: false, stage: null, type: null });
  const offerSpentRef = useRef(false);

  const open = useCallback((type) => {
    setState({ open: true, stage: "plain", type });
  }, []);

  // Open straight on the discounted offer stage. Used by the report's back
  // button as an exit-intent offer: leaving the report shows the discounted
  // astrologers instead of the plain list. Marks the offer spent so it isn't
  // shown a second time on the same mount.
  const openOffer = useCallback((type = "chat") => {
    offerSpentRef.current = true;
    setState({ open: true, stage: "offer", type });
  }, []);

  const finish = useCallback(() => {
    setState((prev) => ({ open: false, stage: null, type: prev.type }));
  }, []);

  const dismiss = useCallback(() => {
    setState((prev) => {
      if (prev.stage === "plain" && !offerSpentRef.current) {
        offerSpentRef.current = true;
        return { ...prev, stage: "offer" };
      }
      return { open: false, stage: null, type: prev.type };
    });
  }, []);

  return {
    isOpen: state.open,
    stage: state.stage,
    type: state.type,
    open,
    openOffer,
    dismiss,
    finish,
  };
};

export default useRecommendationOffer;
