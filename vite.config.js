import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import profileProgressHandler from './api/profile-progress.js';

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    {
      name: 'local-api-profile-progress',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url && req.url.startsWith('/api/profile-progress')) {
            const urlObj = new URL(req.url, 'http://localhost');
            const fakeReq = {
              method: req.method,
              query: Object.fromEntries(urlObj.searchParams.entries()),
              body: null,
            };
            const fakeRes = {
              statusCode: 200,
              setHeader(k, v) {
                res.setHeader(k, v);
              },
              status(code) {
                this.statusCode = code;
                return this;
              },
              json(data) {
                res.statusCode = this.statusCode;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
              },
            };
            try {
              await profileProgressHandler(fakeReq, fakeRes);
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, message: err.message }));
            }
            return;
          }
          next();
        });
      },
    },
  ],
  server: {
    port: 5173,
  },
});
