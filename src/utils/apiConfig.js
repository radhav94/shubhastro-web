/**
 * API Configuration - Centralized proxy paths
 * 
 * All API calls are routed through proxy paths to avoid exposing
 * backend URLs and API keys in the browser's network tab.
 * 
 * In development: Vite dev server proxies these paths to actual backends
 * In production: Nginx/reverse proxy handles the routing
 */

// Main backend API (Node.js)
export const BACKEND_PROXY = "/main";

// Python backend API
export const PYTHON_PROXY = "/chart";

// Third-party Astrology API (json.astrologyapi.com)
export const ASTROLOGY_PROXY = "/vedic";

// Sarvam TTS API
export const SARVAM_PROXY = "/voice";

// Helper to get backend API base URL (replaces import.meta.env.VITE_APP_API_BASE_URL)
export const getBackendUrl = () => BACKEND_PROXY;
