import React from "react";

/*
  Error boundary for the lazy chunks the live player is built from.

  Without one, a rejected dynamic import inside /live escalates to the route's
  errorElement (RouteErrorBoundary, "Something went wrong") — a whole-page error
  screen for what is usually a recoverable network hiccup. Worse, React.lazy
  caches the rejection, so going back to /live re-throws the same stored error
  and the page stays broken until a manual reload.

  This catches it locally and offers a real retry: `onRetry` re-creates the lazy
  component (see makeRetryableLazy), which is the only way to get React to try
  the import again — remounting the same lazy object just replays the cached
  rejection.

  A class component because that is still the only way to implement
  componentDidCatch / getDerivedStateFromError.
*/
class LiveChunkBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    // Kept as console.error rather than a toast: this is a developer-facing
    // diagnostic, and the visitor already has the card below.
    console.error("[LiveChunkBoundary] live player chunk failed:", error, info);
  }

  handleRetry = () => {
    this.setState({ failed: false });
    if (this.props.onRetry) this.props.onRetry();
  };

  render() {
    if (!this.state.failed) return this.props.children;

    const { styles = {} } = this.props;

    return (
      <div className={styles.gateWrap}>
        <div className={styles.gateCard}>
          <h1 className={styles.gateTitle}>Couldn&apos;t start the live player</h1>
          <p className={styles.gateText}>
            The video player didn&apos;t finish downloading. This is usually a
            connection hiccup.
          </p>
          <div className={styles.gateActions}>
            <button type="button" className={styles.gatePrimary} onClick={this.handleRetry}>
              Try again
            </button>
            {/*
              A plain <a>, not a react-router <Link>: this component has to work
              when a chunk load has already failed, and Link would be one more
              thing depending on the router being healthy. A document navigation
              also discards the poisoned lazy cache outright.
            */}
            <a href="/astrologers" className={styles.gateSecondary}>
              Browse astrologers
            </a>
          </div>
        </div>
      </div>
    );
  }
}

export default LiveChunkBoundary;
