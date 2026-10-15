import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Custom middleware plugin to proxy any n8n request and eliminate CORS
function corsProxyPlugin() {
  return {
    name: 'cors-proxy-plugin',
    configureServer(server) {
      server.middlewares.use('/api/proxy', async (req, res) => {
        try {
          const urlObj = new URL(req.url, 'http://localhost:5173');
          const targetUrl = urlObj.searchParams.get('url');

          if (!targetUrl) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Missing target url parameter' }));
            return;
          }

          // Forward headers from client, notably X-N8N-API-KEY
          const headers = { ...req.headers };
          delete headers.host;
          delete headers.origin;
          delete headers.referer;

          // Perform server-side fetch without any CORS restrictions
          const upstreamRes = await fetch(targetUrl, {
            method: req.method,
            headers: {
              ...headers,
              'User-Agent': 'HR-Agent-UI-Proxy/1.0',
            },
          });

          // Set CORS headers so the local browser client is 100% satisfied
          res.statusCode = upstreamRes.status;
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', '*');
          
          const contentType = upstreamRes.headers.get('content-type');
          if (contentType) {
            res.setHeader('Content-Type', contentType);
          }

          const arrayBuffer = await upstreamRes.arrayBuffer();
          res.end(Buffer.from(arrayBuffer));
        } catch (error) {
          console.error('[CORS Proxy Error]', error.message);
          res.statusCode = 502;
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: error.message }));
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), corsProxyPlugin()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/n8n-proxy': {
        target: 'https://n8n.srv1901759.hstgr.cloud',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/n8n-proxy/, ''),
      },
    },
  },
});
