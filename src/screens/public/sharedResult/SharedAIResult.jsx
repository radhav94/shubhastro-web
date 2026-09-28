import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useStore } from 'react-redux';
import CircleSpinner from '../../../component/UI/CircleSpinner';
import { updateMeta } from '../../../utils/updateMeta';
import { useGetSharedAiResultQuery } from '../../../redux/api/aiwow/aiwowApi';
import { setModuleImage, setModuleResult } from '../../../redux/aiwow/aiwowSlice';
import { SharedResultProvider } from '../../../context/SharedResultContext';
import styles from './SharedAIResult.module.scss';

/*
 * Guest-viewable page for a shared AI-Wow result: /shared/:historyId
 *
 * A share link used to point at the module's own result URL. Those screens read
 * the result out of this browser's session (redux, persisted to sessionStorage),
 * so a recipient opened the feature with nothing in it. This page fetches the
 * result from the public endpoint instead, then renders the module's real result
 * screen on top of it — same report the owner sees, minus the owner-only actions
 * (see SharedResultContext).
 *
 * The result screens are reused rather than reimplemented: they are large, and a
 * parallel set of "shared" renderers would drift from the originals with every
 * design change. They take their data from the aiwow slice, so this page
 * hydrates the matching module before rendering them, and puts the visitor's own
 * stored result back on unmount.
 */

const FaceReadingResult = lazy(() => import('../../private/aiwow/facereading/FaceReadingResult'));
const AuraResult = lazy(() => import('../../private/aiwow/aura/AuraResult'));
const GemstoneResult = lazy(() => import('../../private/aiwow/gemstone/GemstoneResult'));
const PalmistryResult = lazy(() => import('../../private/aiwow/palmistry/PalmistryResult'));
const SignatureResult = lazy(() => import('../../private/aiwow/signature/SignatureResult'));
const ClothColorResult = lazy(() => import('../../private/aiwow/clothcolor/ClothColorResult'));
const BusinessPathfinderResult = lazy(() => import('../../private/aiwow/businesspathfinder/BusinessPathfinderResult'));

/*
 * featureType (as sent by the backend) -> how to render it.
 *
 * `module` is the aiwow slice key to hydrate. Business Pathfinder is the one
 * screen that never used redux — it reads location.state — so it takes the
 * payload as a prop instead.
 */
const FEATURE_VIEWS = {
  'face-analysis': { module: 'faceReading', Component: FaceReadingResult, label: 'Face Reading' },
  aura: { module: 'aura', Component: AuraResult, label: 'Aura Reading' },
  'gemstone-scanner': { module: 'gemstone', Component: GemstoneResult, label: 'Gemstone Report' },
  palmistry: { module: 'palmistry', Component: PalmistryResult, label: 'Palmistry Reading' },
  signature: { module: 'signature', Component: SignatureResult, label: 'Signature Analysis' },
  'clothes-color': { module: 'clothColor', Component: ClothColorResult, label: 'Colour Analysis' },
  'business-pathfinder': { resultProp: true, Component: BusinessPathfinderResult, label: 'Business Pathfinder' },
};

/*
 * The same feature is named differently across the app (route slugs, the
 * `featureName` the screens send for charges/history) and the backend may key a
 * record by any of them. Normalising here keeps a naming difference from
 * degrading into a "result not available" page.
 */
const FEATURE_ALIASES = {
  'face-reading': 'face-analysis',
  'astro-face-reading': 'face-analysis',
  'aura-photography': 'aura',
  'aura-analysis': 'aura',
  gemstone: 'gemstone-scanner',
  'gemstone-authenticity': 'gemstone-scanner',
  'ai-palmistry-scanner': 'palmistry',
  'palmistry-scanner': 'palmistry',
  'signature-analysis': 'signature',
  'clothes-colour': 'clothes-color',
  'clothes-colour-analysis': 'clothes-color',
  'color-analysis': 'clothes-color',
};

const resolveView = (featureType) => {
  if (!featureType) return null;
  const key = String(featureType).trim().toLowerCase();
  return FEATURE_VIEWS[key] || FEATURE_VIEWS[FEATURE_ALIASES[key]] || null;
};

const Message = ({ title, body }) => (
  <div className={styles.stateWrap}>
    <div className={styles.stateCard}>
      <h1 className={styles.stateTitle}>{title}</h1>
      <p className={styles.stateBody}>{body}</p>
      <Link to="/ai-wow" className={styles.stateCta}>
        Explore AI Wow
      </Link>
    </div>
  </div>
);

const SharedAIResult = () => {
  const { historyId } = useParams();
  const dispatch = useDispatch();
  const store = useStore();

  const { data, isLoading, isError } = useGetSharedAiResultQuery(historyId, {
    skip: !historyId,
  });

  const shared = data?.data;
  const view = resolveView(shared?.featureType);
  const payload = shared?.data;

  // The app updates the existing tags in index.html rather than mounting a head
  // manager (see utils/updateMeta), so the title is set from an effect.
  useEffect(() => {
    if (!view?.label) return;
    updateMeta({
      title: `Shared ${view.label} | ShubhAstro`,
      description: `A ${view.label} generated with ShubhAstro AI. Create your own in seconds.`,
    });
  }, [view?.label]);

  // Render the module screen only once the slice holds the shared payload —
  // every result screen bounces to its landing page when it finds no result.
  const [hydrated, setHydrated] = useState(false);
  const restoreRef = useRef(null);

  useEffect(() => {
    const moduleName = view?.module;
    if (!moduleName || !payload) return;

    // Remember what the visitor had so their own report is not lost by reading
    // someone else's link, then swap in the shared payload.
    const previous = store.getState().aiwow?.[moduleName];
    restoreRef.current = { moduleName, result: previous?.result ?? null, image: previous?.image ?? null };

    dispatch(setModuleResult({ module: moduleName, result: payload }));
    /*
     * Clear the image. The shared payload has no photo (the backend strips it),
     * and these screens fall back to the image in the slice — which would show
     * the visitor's own face/palm/gemstone next to a stranger's reading.
     */
    dispatch(setModuleImage({ module: moduleName, image: null }));
    setHydrated(true);

    return () => {
      const saved = restoreRef.current;
      if (!saved) return;
      dispatch(setModuleResult({ module: saved.moduleName, result: saved.result }));
      dispatch(setModuleImage({ module: saved.moduleName, image: saved.image }));
      restoreRef.current = null;
    };
  }, [view?.module, payload, dispatch, store]);

  if (!historyId || isError || (!isLoading && !shared)) {
    return (
      <Message
        title="This result is no longer available"
        body="The link may have expired or the report was removed. You can still create your own reading in seconds."
      />
    );
  }

  if (isLoading) {
    return (
      <div className={styles.loaderWrap}>
        <CircleSpinner />
      </div>
    );
  }

  if (!view || !payload) {
    return (
      <Message
        title="This result can't be shown here"
        body="This reading isn't viewable on the web yet. Open it in the ShubhAstro app to see the full report."
      />
    );
  }

  const { Component, resultProp } = view;

  return (
    <SharedResultProvider historyId={historyId}>
      <Suspense
        fallback={
          <div className={styles.loaderWrap}>
            <CircleSpinner />
          </div>
        }
      >
        {resultProp ? <Component result={payload} /> : hydrated ? <Component /> : (
          <div className={styles.loaderWrap}>
            <CircleSpinner />
          </div>
        )}
      </Suspense>
    </SharedResultProvider>
  );
};

export default SharedAIResult;
