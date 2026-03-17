import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { webhookLoggerPlugin } from "./webhook-logger-plugin.js";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), webhookLoggerPlugin()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Disable manual chunks to prevent React 19 internal splitting issues
        // This ensures React and its dependencies stay together
        manualChunks: undefined,
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    chunkSizeWarningLimit: 2000,
  },
  // Optimize dependencies - ensure React stays together
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
});