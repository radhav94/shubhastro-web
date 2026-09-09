// src/components/LiveStreaming/InteractiveLiveStreaming.jsx
import React, { useMemo, useState, useEffect, Suspense } from "react";
import { AgoraRTCProvider } from "agora-rtc-react";
import AgoraRTC from "agora-rtc-react";
import { makeRetryableLazy } from "../../../../../utils/helper/lazyWithRetry";
import LiveChunkBoundary from "./LiveChunkBoundary";
import PrimaryLoader from "../../../../../component/UI/PrimaryLoader";
import styles from "./LivePlayerPage.module.scss";

/*
  LiveStreamingContainer is a separate ~74 kB chunk, and this was a module-scope
  `lazy(() => import("./LiveStreamingContainer"))`.

  Two problems with that, both of which end at the route's "Something went wrong"
  screen:

  1. React.lazy caches a REJECTED import as well as a resolved one, and never
     retries. A single failed chunk fetch therefore re-throws the same stored
     error on every later render — so leaving /live and coming back showed the
     error screen again rather than trying the download again. Only a full page
     reload cleared it, because that is what discards the poisoned lazy object.

  2. Nothing caught the throw. There was no error boundary between here and the
     route, so a recoverable network hiccup took the entire page down.

  `makeRetryableLazy` returns a FACTORY. Calling it produces a brand-new lazy
  object, which is what gives React a genuinely fresh attempt — remounting the
  same lazy object just replays the cached rejection. `chunkKey` below bumps on
  retry so the factory is called again.

  Chunk requests reject for ordinary reasons: navigating away mid-download aborts
  the in-flight request (exactly the "went to /live then pressed Back" report), a
  client on a pre-deploy index.html asks for a hashed filename that is gone, the
  Vite dev server re-optimises and the old URL 404s, or the connection is simply
  poor — which describes most of this traffic.
*/
const createLiveStreamingContainer = makeRetryableLazy(
  () => import("./LiveStreamingContainer")
);

const InteractiveLiveStreaming = () => {
  // Bumped by the error boundary's retry so a fresh lazy component is built.
  const [chunkKey, setChunkKey] = useState(0);

  // `chunkKey` is deliberately the only dependency and eslint calls it
  // "unnecessary" because the factory reads nothing from scope. That is exactly
  // why it is here: bumping the key is the signal to build a NEW lazy object, and
  // a new object is the only way React will re-attempt an import it has already
  // cached as rejected. Removing this dep would make the retry a no-op.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const LiveStreamingContainer = useMemo(() => createLiveStreamingContainer(), [chunkKey]);

  /*
    Create a fresh client per mount so there's no stale Agora state from a
    previous navigation. The old client gets garbage-collected.

    Wrapped because createClient throws synchronously when the browser cannot
    support the SDK at all (no WebRTC — some in-app WebViews and locked-down
    enterprise browsers). Thrown from inside useMemo that lands in render, so it
    took the whole route to "Something went wrong" with nothing explaining why.
    A null client is handled below instead.
  */
  const client = useMemo(() => {
    try {
      return AgoraRTC.createClient({ mode: "live", codec: "vp8" });
    } catch (err) {
      console.error("[InteractiveLiveStreaming] createClient failed:", err);
      return null;
    }
  }, []);

  // Ensure the client leaves on unmount (navigation away)
  useEffect(() => {
    return () => {
      if (client && client.connectionState !== "DISCONNECTED") {
        client.leave().catch(() => {});
      }
    };
  }, [client]);

  if (!client) {
    return (
      <div className={styles.gateWrap}>
        <div className={styles.gateCard}>
          <h1 className={styles.gateTitle}>Live video isn&apos;t supported here</h1>
          <p className={styles.gateText}>
            This browser can&apos;t play live streams. Opening the site in Chrome or
            Safari usually fixes it — or talk to an astrologer directly instead.
          </p>
          <div className={styles.gateActions}>
            <a href="/astrologers" className={styles.gatePrimary}>
              Chat or call an astrologer
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AgoraRTCProvider client={client}>
      {/*
        Its own Suspense as well as the boundary. The parent in LivePlayerPage
        would otherwise swap the entire page back to a loading gate while only
        this inner chunk is pending, and after a retry that reads as the page
        starting over rather than the player recovering.
      */}
      <LiveChunkBoundary styles={styles} onRetry={() => setChunkKey((n) => n + 1)}>
        <Suspense fallback={<PrimaryLoader fullscreen={false} />}>
          <LiveStreamingContainer client={client} />
        </Suspense>
      </LiveChunkBoundary>
    </AgoraRTCProvider>
  );
};

export default InteractiveLiveStreaming;
