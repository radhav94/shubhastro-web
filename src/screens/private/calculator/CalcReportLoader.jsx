import RouteLoader from "../../../component/UI/RouteLoader";

/**
 * Loading state for a calculator report route.
 *
 * Every report screen under this folder opened with a bare
 * `return <PrimaryLoader isLoading={true} />`. PrimaryLoader defaults to
 * `fullscreen`, which is `position: fixed` — so while the calculation request was
 * in flight the route contributed no height to the document flow, HomeLayout's
 * footer rode up into the viewport, and the finished report (back button, title,
 * subtitle, result table, ConnectCard) then landed in one commit and shoved it
 * back down. All after first paint, so all of it counted toward CLS.
 *
 * Thin wrapper over the shared RouteLoader so the calculator screens keep a name
 * that says what they are, and so the default copy stays report-specific, while
 * the height reservation lives in exactly one place for the whole app.
 *
 * @param {string} [message] Optional copy shown under the spinner.
 */
const CalcReportLoader = ({ message = "Preparing your report…" }) => (
  <RouteLoader message={message} />
);

export default CalcReportLoader;
