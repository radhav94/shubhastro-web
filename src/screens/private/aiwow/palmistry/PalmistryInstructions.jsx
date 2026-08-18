import { Navigate } from 'react-router-dom';

/**
 * The "Before you start" instructions are now part of the palmistry entry
 * screen (PalmistryLanding), alongside the hand choice and the Upload / Use
 * Camera actions — they were two separate steps before.
 *
 * The route is kept as a redirect so links already shared and any Back stack
 * entry pointing at /instructions still land somewhere useful.
 */
const PalmistryInstructions = () => (
  <Navigate to="/ai-wow/ai-palmistry-scanner" replace />
);

export default PalmistryInstructions;
