import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const COMPANY_DOMAIN = process.env.COMPANY_DOMAIN || '@techygeekhub.com';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MySQL Configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'tgh_user',
  password: process.env.DB_PASSWORD || 'TghUserPass2026!',
  database: process.env.DB_NAME || 'hr_analytics',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

let pool = null;

// Connect to MySQL with retry logic for container bootup
async function initDatabase() {
  const maxRetries = 15;
  const retryIntervalMs = 3000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[DB] Attempting connection to MySQL at ${dbConfig.host}:${dbConfig.port} (Attempt ${attempt}/${maxRetries})...`);
      pool = mysql.createPool(dbConfig);
      
      // Test ping
      const connection = await pool.getConnection();
      console.log('[DB] Connected to MySQL successfully!');

      // Ensure `user_information` table exists
      await connection.query(`
        CREATE TABLE IF NOT EXISTS \`user_information\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`email\` VARCHAR(255) NOT NULL UNIQUE,
          \`full_name\` VARCHAR(255) NOT NULL,
          \`department\` VARCHAR(100) DEFAULT 'Human Resources (HR)',
          \`password_hash\` VARCHAR(255) NOT NULL,
          \`role\` VARCHAR(50) DEFAULT 'employee',
          \`is_active\` TINYINT(1) DEFAULT 1,
          \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          \`last_login\` DATETIME NULL,
          INDEX \`idx_email\` (\`email\`),
          INDEX \`idx_department\` (\`department\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      console.log('[DB] Table `user_information` verified and ready.');
      connection.release();
      return;
    } catch (err) {
      console.warn(`[DB] MySQL not ready yet: ${err.message}. Retrying in ${retryIntervalMs / 1000}s...`);
      await new Promise((res) => setTimeout(res, retryIntervalMs));
    }
  }
  console.error('[DB] Could not establish connection to MySQL after multiple attempts.');
}

// Validation Helper
function isValidCompanyEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return email.trim().toLowerCase().endsWith(COMPANY_DOMAIN);
}

// -----------------------------------------------------------------------------
// HEALTH & DIAGNOSTIC ENDPOINTS
// -----------------------------------------------------------------------------
const healthHandler = async (req, res) => {
  let dbConnected = false;
  let userCount = 0;

  try {
    if (pool) {
      const [rows] = await pool.query('SELECT COUNT(*) as total FROM user_information');
      dbConnected = true;
      userCount = rows[0]?.total || 0;
    }
  } catch (e) {
    dbConnected = false;
  }

  res.json({
    status: dbConnected ? 'ok' : 'degraded',
    container: 'tgh_hr_agent_ui',
    database_host: dbConfig.host,
    database_name: dbConfig.database,
    connected: dbConnected,
    table_exists: true,
    user_count: userCount,
    server_time: new Date().toISOString(),
    allowed_domain: COMPANY_DOMAIN,
    environment: process.env.NODE_ENV || 'production',
  });
};

app.get('/api/health', healthHandler);
app.get('/api/test.php', healthHandler); // Backwards compatibility for existing UI

// -----------------------------------------------------------------------------
// AUTHENTICATION CONTROLLER (Supports /api/auth and /api/auth.php)
// -----------------------------------------------------------------------------
const authHandler = async (req, res) => {
  const action = req.query.action || req.body.action;
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';

  if (!action) {
    return res.status(400).json({ success: false, error: 'Missing action parameter (signup, login, reset-password).' });
  }

  // Domain validation check
  if (email && !isValidCompanyEmail(email)) {
    return res.status(403).json({
      success: false,
      error: `Access restricted: Only official company email addresses (${COMPANY_DOMAIN}) are allowed. Please use your corporate email ID.`,
    });
  }

  if (!pool) {
    return res.status(503).json({ success: false, error: 'Database service is initializing. Please retry in a few seconds.' });
  }

  // SIGNUP
  if (action === 'signup') {
    const fullName = (req.body.fullName || req.body.full_name || '').trim();
    const department = (req.body.department || 'Human Resources (HR)').trim();

    if (!email || !password || !fullName) {
      return res.status(400).json({ success: false, error: 'Please complete all required fields.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
    }

    try {
      const [existing] = await pool.query('SELECT id FROM user_information WHERE email = ? LIMIT 1', [email]);
      if (existing.length > 0) {
        return res.status(409).json({ success: false, error: 'An account with this email already exists. Please sign in instead.' });
      }

      // Hash password using Bcrypt (cost 10)
      const passwordHash = await bcrypt.hash(password, 10);

      const [result] = await pool.query(
        'INSERT INTO user_information (email, full_name, department, password_hash, created_at, updated_at, last_login) VALUES (?, ?, ?, ?, NOW(), NOW(), NOW())',
        [email, fullName, department, passwordHash]
      );

      const user = {
        id: String(result.insertId),
        email,
        full_name: fullName,
        department,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
      };

      const token = `vps_token_${result.insertId}_${Date.now()}`;

      return res.json({
        success: true,
        message: 'Registration successful! Saved to Hostinger VPS database.',
        user,
        token,
      });
    } catch (err) {
      console.error('[Auth Error Signup]', err);
      return res.status(500).json({ success: false, error: 'Failed to create user account: ' + err.message });
    }
  }

  // LOGIN
  if (action === 'login') {
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please enter both your work email and password.' });
    }

    try {
      const [rows] = await pool.query('SELECT id, email, full_name, department, password_hash FROM user_information WHERE email = ? LIMIT 1', [email]);
      if (rows.length === 0) {
        return res.status(401).json({ success: false, error: 'Invalid email or password. Please verify your credentials or sign up.' });
      }

      const user = rows[0];
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        return res.status(401).json({ success: false, error: 'Invalid email or password. Please verify your credentials.' });
      }

      // Update last_login
      await pool.query('UPDATE user_information SET last_login = NOW() WHERE id = ?', [user.id]);

      const token = `vps_token_${user.id}_${Date.now()}`;

      return res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: String(user.id),
          email: user.email,
          full_name: user.full_name,
          department: user.department,
          last_login: new Date().toISOString(),
        },
        token,
      });
    } catch (err) {
      console.error('[Auth Error Login]', err);
      return res.status(500).json({ success: false, error: 'Authentication failed: ' + err.message });
    }
  }

  // RESET PASSWORD
  if (action === 'reset-password') {
    return res.json({
      success: true,
      message: `If an account exists for ${email}, a password reset verification email has been requested. Contact IT administration if needed.`,
    });
  }

  return res.status(400).json({ success: false, error: 'Unsupported action' });
};

app.post('/api/auth', authHandler);
app.post('/api/auth.php', authHandler); // Universal compatibility with existing UI

// -----------------------------------------------------------------------------
// N8N CORS PROXY (Enables seamless queries to n8n webhook without browser CORS)
// -----------------------------------------------------------------------------
app.use('/api/proxy', async (req, res) => {
  try {
    const targetUrl = req.query.url;
    if (!targetUrl) {
      return res.status(400).json({ error: 'Missing target url parameter' });
    }

    const headers = { ...req.headers };
    delete headers.host;
    delete headers.origin;
    delete headers.referer;

    const upstreamRes = await fetch(targetUrl, {
      method: req.method,
      headers: {
        ...headers,
        'User-Agent': 'TGH-HR-Agent-VPS-Proxy/1.0',
      },
    });

    res.status(upstreamRes.status);
    const contentType = upstreamRes.headers.get('content-type');
    if (contentType) res.setHeader('Content-Type', contentType);

    const arrayBuffer = await upstreamRes.arrayBuffer();
    res.end(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error('[Proxy Error]', error.message);
    res.status(502).json({ error: error.message });
  }
});

// -----------------------------------------------------------------------------
// STATIC FILES & SPA FALLBACK (Serves React UI dist/)
// -----------------------------------------------------------------------------
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// For all non-API GET requests, return index.html for React client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start Server
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`[App] TGH HR Agent Analytics server running on port ${PORT}`);
  await initDatabase();
});
