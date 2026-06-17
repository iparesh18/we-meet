import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev server runs on port 3000 as required.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    strictPort: true,
  },
  preview: {
    port: 3000,
    strictPort: true,
  },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          livekit: ['livekit-client', '@livekit/components-react'],
          react: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
});
