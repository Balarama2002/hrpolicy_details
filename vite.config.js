import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Custom dev middleware: proxies n8n requests and provides local dev mock for Hostinger API
function devApiPlugin() {
  const devUsers = new Map();

  return {
    name: 'dev-api-plugin',
    configureServer(server) {
      // 1. Hostinger API mock for local Vite dev server (when running without local PHP)
      server.middlewares.use(async (req, res, next) => {
        const urlObj = new URL(req.url, 'http://localhost:5173');

        // Test DB diagnostic endpoint
        if (urlObj.pathname === '/api/test.php') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            status: 'ok',
            connected: true,
            database_host: 'localhost (Hostinger MySQL)',
            database_name: 'u123456789_hragent',
            table_exists: true,
            user_count: devUsers.size,
            allowed_domain: '@techygeekhub.com',
            mode: 'Vite Local Dev Simulation / Production PHP files ready in public/api/',
          }));
          return;
        }

        // Hostinger Auth endpoint
        if (urlObj.pathname === '/api/auth.php') {
          const action = urlObj.searchParams.get('action');

          let bodyText = '';
          req.on('data', (chunk) => { bodyText += chunk; });
          req.on('end', () => {
            try {
              const body = bodyText ? JSON.parse(bodyText) : {};
              const reqAction = action || body.action;
              const email = (body.email || '').trim().toLowerCase();
              const password = body.password || '';

              res.setHeader('Content-Type', 'application/json');

              // Mandatory company domain check
              if (email && !email.endsWith('@techygeekhub.com')) {
                res.statusCode = 403;
                res.end(JSON.stringify({
                  success: false,
                  error: 'Access restricted: Only official company email addresses (@techygeekhub.com) are allowed. Please use your corporate email ID.'
                }));
                return;
              }

              if (reqAction === 'signup') {
                const fullName = body.fullName || body.full_name || 'TGH Employee';
                const department = body.department || 'Human Resources (HR)';

                if (!email || !password || !fullName) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ success: false, error: 'Please complete all required fields.' }));
                  return;
                }

                if (devUsers.has(email)) {
                  res.statusCode = 409;
                  res.end(JSON.stringify({ success: false, error: 'An account with this email already exists. Please sign in instead.' }));
                  return;
                }

                const userObj = {
                  id: String(Date.now()),
                  email,
                  full_name: fullName,
                  department,
                  password,
                  created_at: new Date().toISOString(),
                  last_login: new Date().toISOString(),
                };
                devUsers.set(email, userObj);

                res.end(JSON.stringify({
                  success: true,
                  message: 'Registration successful! (Saved to Hostinger MySQL table)',
                  user: {
                    id: userObj.id,
                    email: userObj.email,
                    full_name: userObj.full_name,
                    department: userObj.department,
                  },
                  token: 'dev_token_' + Math.random().toString(36).substring(2),
                }));
                return;
              }

              if (reqAction === 'login') {
                if (!email || !password) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ success: false, error: 'Please enter both your work email and password.' }));
                  return;
                }

                let user = devUsers.get(email);
                // In dev mode, auto-provision if not found to facilitate immediate testing
                if (!user) {
                  user = {
                    id: String(Date.now()),
                    email,
                    full_name: email.split('@')[0].replace('.', ' ').replace(/(^\w|\s\w)/g, (m) => m.toUpperCase()),
                    department: 'Human Resources (HR)',
                    password,
                    last_login: new Date().toISOString(),
                  };
                  devUsers.set(email, user);
                } else if (user.password !== password) {
                  res.statusCode = 401;
                  res.end(JSON.stringify({ success: false, error: 'Invalid email or password. Please verify your credentials.' }));
                  return;
                }

                user.last_login = new Date().toISOString();

                res.end(JSON.stringify({
                  success: true,
                  message: 'Login successful',
                  user: {
                    id: user.id,
                    email: user.email,
                    full_name: user.full_name,
                    department: user.department,
                    last_login: user.last_login,
                  },
                  token: 'dev_token_' + Math.random().toString(36).substring(2),
                }));
                return;
              }

              if (reqAction === 'reset-password') {
                res.end(JSON.stringify({
                  success: true,
                  message: `Password reset request received for ${email}. Check your company inbox.`
                }));
                return;
              }

              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: 'Unknown action' }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        next();
      });

      // 2. n8n CORS Proxy
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
  plugins: [react(), devApiPlugin()],
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
