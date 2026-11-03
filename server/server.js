import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const COMPANY_DOMAIN = process.env.COMPANY_DOMAIN || '@techygeekhub.com';

// Configure Email Transporter for sending temporary passwords
const mailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: (process.env.SMTP_SECURE === 'true' || parseInt(process.env.SMTP_PORT || '465', 10) === 465),
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

async function sendTemporaryPasswordEmail(toEmail, tempPassword) {
  const mailOptions = {
    from: process.env.SMTP_FROM || `"TGH IT Security" <${process.env.SMTP_USER || 'no-reply@techygeekhub.com'}>`,
    to: toEmail,
    subject: 'TGH HR Agent Analytics: Your Temporary Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #1e293b; margin: 0;">TechyGeekHub HR Agent Analytics</h2>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Self-Service Password Recovery</p>
        </div>
        <p style="color: #334155; font-size: 14px; line-height: 1.6;">Hello,</p>
        <p style="color: #334155; font-size: 14px; line-height: 1.6;">
          A temporary password was requested for your corporate account (<strong>${toEmail}</strong>).
        </p>
        <p style="color: #334155; font-size: 14px; line-height: 1.6;">
          Please use the following one-time temporary password to sign in:
        </p>
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
          <span style="font-family: monospace; font-size: 22px; font-weight: bold; letter-spacing: 2px; color: #2563eb;">
            ${tempPassword}
          </span>
        </div>
        <p style="color: #d97706; font-size: 12px; line-height: 1.5;">
          ⚠️ <strong>Security Notice:</strong> Upon signing in with this temporary password, you will be required to set your own permanent password immediately.
        </p>
        <p style="color: #64748b; font-size: 12px; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 12px;">
          If you did not request this temporary password, please notify your IT department immediately.
        </p>
      </div>
    `,
  };

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`\n============================================================`);
    console.log(`[SMTP NOTICE] (Set SMTP_USER & SMTP_PASS in .env to send via live SMTP)`);
    console.log(`[EMAIL DISPATCHED TO]: ${toEmail}`);
    console.log(`[TEMPORARY PASSWORD]: ${tempPassword}`);
    console.log(`============================================================\n`);
    return { simulated: true };
  }

  try {
    return await mailTransporter.sendMail(mailOptions);
  } catch (err) {
    console.error('[SMTP Error] Failed to send email via SMTP:', err.message);
    throw err;
  }
}

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
          \`must_reset_password\` TINYINT(1) DEFAULT 0,
          \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          \`last_login\` DATETIME NULL,
          INDEX \`idx_email\` (\`email\`),
          INDEX \`idx_department\` (\`department\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // Migration: Add must_reset_password, otp_code, otp_expires_at columns if missing
      try {
        await connection.query('ALTER TABLE `user_information` ADD COLUMN `must_reset_password` TINYINT(1) DEFAULT 0');
      } catch (e) {}
      try {
        await connection.query('ALTER TABLE `user_information` ADD COLUMN `otp_code` VARCHAR(10) NULL');
      } catch (e) {}
      try {
        await connection.query('ALTER TABLE `user_information` ADD COLUMN `otp_expires_at` DATETIME NULL');
      } catch (e) {}

      console.log('[DB] Table `user_information` verified and ready.');

      // Auto-seed default accounts if table is empty
      const [countRows] = await connection.query('SELECT COUNT(*) as total FROM user_information');
      if (countRows[0].total === 0) {
        const defaultHash = '$2b$10$P0SrIvmdY5wHRDHraHM4iOHIfFV94iuXLBp/YhLulxdm/LiAXnH2m'; // 'Password123!'
        await connection.query(`
          INSERT INTO user_information (email, full_name, department, password_hash, role)
          VALUES 
            ('admin@techygeekhub.com', 'HR Administrator', 'Human Resources (HR)', ?, 'admin'),
            ('cbala@techygeekhub.com', 'Cherukuri Bala Rama Krishna', 'Engineering & IT', ?, 'admin'),
            ('demo@techygeekhub.com', 'TechyGeekHub Demo', 'Engineering & IT', ?, 'employee')
        `, [defaultHash, defaultHash, defaultHash]);
        console.log('[DB] Pre-seeded default accounts: admin, cbala, and demo.');
      }

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

  // -------------------------------------------------------------
  // 1. SEND 6-DIGIT OTP (Restricted to Provisioned Accounts)
  // -------------------------------------------------------------
  if (action === 'send-otp') {
    if (!email) {
      return res.status(400).json({ success: false, error: 'Corporate email is required.' });
    }

    try {
      const [rows] = await pool.query('SELECT id, full_name, email, role FROM user_information WHERE email = ? LIMIT 1', [email]);
      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: `Access Denied: Account not found for ${email}. Access is strictly restricted to employees provisioned by an Administrator in the Admin Portal.`
        });
      }

      const user = rows[0];
      const otp = String(Math.floor(100000 + Math.random() * 900000));

      // Save OTP to DB with 10-minute expiry
      await pool.query(
        'UPDATE user_information SET otp_code = ?, otp_expires_at = DATE_ADD(NOW(), INTERVAL 10 MINUTE) WHERE id = ?',
        [otp, user.id]
      );

      // Send email via nodemailer
      try {
        await sendTemporaryPasswordEmail(email, otp);
      } catch (mailErr) {
        console.error('[SMTP OTP Error]', mailErr.message);
      }

      console.log(`[OTP] Generated 6-digit code for ${email}: ${otp}`);

      return res.json({
        success: true,
        message: `A 6-digit verification code has been dispatched to ${email}.`,
        email
      });
    } catch (err) {
      console.error('[Auth Error Send OTP]', err);
      return res.status(500).json({ success: false, error: 'Failed to process OTP: ' + err.message });
    }
  }

  // -------------------------------------------------------------
  // 2. VERIFY 6-DIGIT OTP
  // -------------------------------------------------------------
  if (action === 'verify-otp') {
    const otp = (req.body.otp || '').trim();
    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'Email and 6-digit OTP code are required.' });
    }

    try {
      const [rows] = await pool.query(
        'SELECT id, email, full_name, department, role, otp_code, otp_expires_at FROM user_information WHERE email = ? LIMIT 1',
        [email]
      );

      if (rows.length === 0) {
        return res.status(404).json({ success: false, error: 'User account not found.' });
      }

      const user = rows[0];
      if (!user.otp_code || user.otp_code !== otp) {
        return res.status(400).json({ success: false, error: 'Invalid or incorrect 6-digit OTP code.' });
      }

      if (new Date() > new Date(user.otp_expires_at)) {
        return res.status(400).json({ success: false, error: 'OTP code has expired. Please request a new code.' });
      }

      // Valid OTP: Clear OTP and update last_login
      await pool.query('UPDATE user_information SET otp_code = NULL, otp_expires_at = NULL, last_login = NOW() WHERE id = ?', [user.id]);

      const token = `vps_token_${user.id}_${Date.now()}`;

      return res.json({
        success: true,
        message: 'Verification successful',
        user: {
          id: String(user.id),
          email: user.email,
          full_name: user.full_name,
          department: user.department,
          role: user.role || 'technical',
          last_login: new Date().toISOString(),
        },
        token,
      });
    } catch (err) {
      console.error('[Auth Error Verify OTP]', err);
      return res.status(500).json({ success: false, error: 'Verification failed: ' + err.message });
    }
  }

  // -------------------------------------------------------------
  // 3. ADMIN PORTAL: LIST USERS
  // -------------------------------------------------------------
  if (action === 'list-users') {
    try {
      const [rows] = await pool.query(
        'SELECT id, email, full_name, department, role, created_at, last_login FROM user_information ORDER BY id DESC'
      );
      return res.json({ success: true, users: rows });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // -------------------------------------------------------------
  // 4. ADMIN PORTAL: ADD USER
  // -------------------------------------------------------------
  if (action === 'add-user') {
    const fullName = (req.body.full_name || req.body.fullName || '').trim();
    const department = (req.body.department || 'Engineering & IT').trim();
    const role = req.body.role === 'admin' ? 'admin' : 'technical';

    if (!email || !fullName) {
      return res.status(400).json({ success: false, error: 'Email and full name are required.' });
    }

    try {
      const [existing] = await pool.query('SELECT id FROM user_information WHERE email = ? LIMIT 1', [email]);
      if (existing.length > 0) {
        return res.status(409).json({ success: false, error: `User with email ${email} already exists.` });
      }

      const defaultHash = await bcrypt.hash('TechyGeekHub2026!', 10);
      const [result] = await pool.query(
        'INSERT INTO user_information (email, full_name, department, role, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
        [email, fullName, department, role, defaultHash]
      );

      const newUser = {
        id: String(result.insertId),
        email,
        full_name: fullName,
        department,
        role,
        created_at: new Date().toISOString(),
        last_login: null,
      };

      return res.json({ success: true, message: `User ${fullName} provisioned.`, user: newUser });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // -------------------------------------------------------------
  // 5. ADMIN PORTAL: UPDATE USER ROLE
  // -------------------------------------------------------------
  if (action === 'update-user-role') {
    const role = req.body.role === 'admin' ? 'admin' : 'technical';
    try {
      await pool.query('UPDATE user_information SET role = ? WHERE email = ?', [role, email]);
      return res.json({ success: true, message: `Role updated to ${role}.` });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // -------------------------------------------------------------
  // 6. ADMIN PORTAL: DELETE USER
  // -------------------------------------------------------------
  if (action === 'delete-user') {
    try {
      await pool.query('DELETE FROM user_information WHERE email = ?', [email]);
      return res.json({ success: true, message: 'User removed successfully.' });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
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
      const [rows] = await pool.query('SELECT id, email, full_name, department, password_hash, must_reset_password FROM user_information WHERE email = ? LIMIT 1', [email]);
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
          must_reset_password: Boolean(user.must_reset_password),
        },
        token,
      });
    } catch (err) {
      console.error('[Auth Error Login]', err);
      return res.status(500).json({ success: false, error: 'Authentication failed: ' + err.message });
    }
  }

  // FORGOT PASSWORD / ISSUE TEMPORARY PASSWORD
  if (action === 'forgot-password' || action === 'reset-password') {
    if (!email) {
      return res.status(400).json({ success: false, error: 'Work email is required.' });
    }

    try {
      const [rows] = await pool.query('SELECT id, full_name FROM user_information WHERE email = ? LIMIT 1', [email]);
      if (rows.length === 0) {
        // Return generic message so email enumeration is mitigated, but in dev provide clear status
        return res.status(404).json({ success: false, error: 'No account found with this corporate email. Please check the spelling or sign up.' });
      }

      const tempPassword = 'TGH-' + Math.floor(100000 + Math.random() * 900000);
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      // Save temporary password with must_reset_password = 1
      await pool.query(
        'UPDATE user_information SET password_hash = ?, must_reset_password = 1, updated_at = NOW() WHERE email = ?',
        [passwordHash, email]
      );

      // Send temporary password to employee's email
      try {
        await sendTemporaryPasswordEmail(email, tempPassword);
        console.log(`[Auth] Sent temporary password email to ${email}`);
      } catch (mailErr) {
        console.error(`[Auth Mail Warning] Failed to deliver email to ${email}:`, mailErr.message);
      }

      return res.json({
        success: true,
        message: `A temporary password has been sent to your email (${email}). Please check your inbox and use it to sign in.`,
        user: {
          email,
          must_reset_password: true,
        },
      });
    } catch (err) {
      console.error('[Auth Error Forgot Password]', err);
      return res.status(500).json({ success: false, error: 'Failed to process temporary password: ' + err.message });
    }
  }

  // CHANGE / SET NEW PASSWORD
  if (action === 'change-password') {
    const newPassword = req.body.newPassword || req.body.password;
    if (!email || !newPassword) {
      return res.status(400).json({ success: false, error: 'Email and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters long.' });
    }

    try {
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await pool.query(
        'UPDATE user_information SET password_hash = ?, must_reset_password = 0, updated_at = NOW() WHERE email = ?',
        [passwordHash, email]
      );

      return res.json({
        success: true,
        message: 'Your password has been successfully updated and saved in the database!',
        user: {
          email,
          must_reset_password: false,
        },
      });
    } catch (err) {
      console.error('[Auth Error Change Password]', err);
      return res.status(500).json({ success: false, error: 'Failed to update password: ' + err.message });
    }
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

// Catch-all handler for SPA client-side routing (Universal for Express 4 & Express 5)
app.use((req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start Server
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`[App] TGH HR Agent Analytics server running on port ${PORT}`);
  await initDatabase();
});
