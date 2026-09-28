import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { useSharedResultView } from '../../../../context/SharedResultContext';

/** The public, guest-viewable URL for a generated AI-Wow result. */
export const buildSharedResultUrl = (historyId) =>
  historyId ? `${window.location.origin}/shared/${historyId}` : '';

/**
 * Share an AI-Wow result.
 *
 * The link has to point at /shared/:historyId, not at the current URL: the
 * result screens read their data from this browser's session, so a recipient
 * opening a module URL saw the feature with no result in it — the reported bug.
 * /shared/:historyId fetches the shared payload, so it works for guests too.
 *
 * `historyId` comes from the result object for the owner, and from the shared
 * page's context when the report being viewed is already a shared one (the
 * shared payload carries no ids). When neither is available — an old result
 * generated before the backend returned an id — this falls back to the current
 * URL rather than leaving the button dead.
 *
 * @param {Object} options
 * @param {string|null} options.historyId
 * @param {string} options.title - share sheet title
 * @param {string} [options.text] - share sheet body
 */
export const useAIWowShare = ({ historyId, title, text }) => {
  const { isSharedView, historyId: sharedHistoryId } = useSharedResultView();
  const id = (isSharedView ? sharedHistoryId : historyId) || null;

  const share = useCallback(async () => {
    const url = buildSharedResultUrl(id) || window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    } catch {
      // A cancelled share sheet rejects too, so stay silent rather than
      // reporting a failure the user caused deliberately.
    }
  }, [id, title, text]);

  return { share, shareUrl: buildSharedResultUrl(id) };
};

export default useAIWowShare;
