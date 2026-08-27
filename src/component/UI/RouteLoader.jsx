import PrimaryLoader from "./PrimaryLoader";
import styles from "./RouteLoader.module.scss";

/**
 * Loading state for a route that renders nothing else while it waits on data.
 *
 * Use this instead of `return <PrimaryLoader isLoading />` at the top of a screen.
 * PrimaryLoader defaults to `fullscreen`, i.e. `position: fixed`, so such a route
 * contributes no height to the document flow at all — which lets HomeLayout's
 * footer ride up into the viewport and then get shoved back down when the content
 * arrives. That is layout shift, and it is measured after first paint, so it
 * counts in full. Clarity has reported 1.335 and 0.805 CLS on routes with exactly
 * this shape.
 *
 * `fullscreen={false}` also keeps the spinner inside the reserved box rather than
 * raising a z-index 999999 overlay over the global header, which is what stops a
 * visitor leaving the page while it loads.
 *
 * @param {string} [message] Optional copy shown under the spinner.
 */
const RouteLoader = ({ message }) => (
  <div className={styles.wrap}>
    <PrimaryLoader isLoading={true} fullscreen={false} message={message} />
  </div>
);

export default RouteLoader;
