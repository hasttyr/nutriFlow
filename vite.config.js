import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// In development /api/ai goes to Pollinations through Vite, the same way api/ai.js does on Vercel:
// without the browser's Origin header, which Pollinations rejects for anonymous calls.
const aiProxy = {
  '/api/ai': {
    target: 'https://text.pollinations.ai',
    changeOrigin: true,
    rewrite: () => '/openai',
    configure: (proxy) => {
      proxy.on('proxyReq', (request) => {
        request.removeHeader('origin');
        request.removeHeader('referer');
      });
    }
  }
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { proxy: aiProxy },
  preview: { proxy: aiProxy },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    // The language is detected from the time zone too; pin it so results do not depend on the machine.
    env: { TZ: 'UTC' },
  },
});
