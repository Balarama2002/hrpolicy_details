import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Custom dev middleware: proxies n8n requests and provides local dev mock for Hostinger API
function devApiPlugin() {
  const devUsers = new Map([
    ['admin@techygeekhub.com', {
      id: '1',
      email: 'admin@techygeekhub.com',
      full_name: 'HR Administrator',
      department: 'Human Resources (HR)',
      role: 'admin',
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
    }],
    ['cbala@techygeekhub.com', {
      id: '2',
      email: 'cbala@techygeekhub.com',
      full_name: 'Cherukuri Bala Rama Krishna',
      department: 'Engineering & IT',
      role: 'admin', // Admin access enabled so user can manage users and switch views
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
    }],
    ['demo@techygeekhub.com', {
      id: '3',
      email: 'demo@techygeekhub.com',
      full_name: 'TechyGeekHub Demo',
      department: 'Engineering & IT',
      role: 'technical',
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
    }],
  ]);

  const devOtps = new Map();
  const devQuotaConfig = {
    dailyMessageLimit: 5,
    dailyTokenLimit: 25000,
    alertIntervalHours: 6,
    teamsWebhookUrl: 'https://n8n.srv1901759.hstgr.cloud/webhook/quota-alert',
    resets: {},
    globalResetAt: null,
  };

  return {
    name: 'dev-api-plugin',
    configureServer(server) {
      // 1. Hostinger API mock for local Vite dev server (when running without local PHP)
      server.middlewares.use(async (req, res, next) => {
        const urlObj = new URL(req.url, 'http://localhost:5173');

        // Test DB diagnostic endpoint
        if (urlObj.pathname === '/api/test.php' || urlObj.pathname === '/api/health' || urlObj.pathname === '/api/test') {
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
        if (urlObj.pathname === '/api/auth.php' || urlObj.pathname === '/api/auth') {
          const action = urlObj.searchParams.get('action');

          let bodyText = '';
          req.on('data', (chunk) => { bodyText += chunk; });
          req.on('end', async () => {
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

              // -------------------------------------------------------------
              // 1. SEND 6-DIGIT OTP (Restricted to Provisioned Accounts)
              // -------------------------------------------------------------
              if (reqAction === 'send-otp') {
                if (!email) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ success: false, error: 'Corporate email is required.' }));
                  return;
                }

                // Strictly verify that user was created by an admin
                const user = devUsers.get(email);
                if (!user) {
                  res.statusCode = 404;
                  res.end(JSON.stringify({
                    success: false,
                    error: `Access Denied: Account not found for ${email}. Access is strictly restricted to employees provisioned by an Administrator in the Admin Portal.`
                  }));
                  return;
                }

                // Generate 6-digit numeric OTP
                const otp = String(Math.floor(100000 + Math.random() * 900000));
                devOtps.set(email, {
                  otp,
                  expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes expiry
                });

                // -----------------------------------------------------------------
                // OTP EMAIL DISPATCH (Supports 1. n8n Webhook, 2. SMTP, 3. Resend)
                // -----------------------------------------------------------------
                const smtpUser = process.env.SMTP_USER;
                const smtpPass = process.env.SMTP_PASS;
                const smtpHost = process.env.SMTP_HOST || 'smtp.hostinger.com';
                const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
                const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;

                const n8nWebhook = process.env.N8N_OTP_WEBHOOK_URL || 'https://n8n.srv1901759.hstgr.cloud/webhook/send-otp-email';
                const resendApiKey = process.env.RESEND_API_KEY;

                let mailSent = false;
                let deliveryMethod = 'none';

                // Method 1: Direct SMTP (Hostinger / Gmail / Outlook)
                if (smtpUser && smtpPass) {
                  try {
                    const transporter = nodemailer.createTransport({
                      host: smtpHost,
                      port: smtpPort,
                      secure: smtpSecure,
                      auth: { user: smtpUser, pass: smtpPass },
                    });

                    await transporter.sendMail({
                      from: process.env.SMTP_FROM || `"TGH IT Security" <${smtpUser}>`,
                      to: email,
                      subject: 'TGH HR Agent Analytics: Your 6-Digit OTP Code',
                      html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                          <h2 style="color: #1e293b; margin: 0; text-align: center;">TechyGeekHub Enterprise Authentication</h2>
                          <p style="color: #64748b; font-size: 14px; text-align: center; margin-top: 4px;">6-Digit OTP Verification</p>
                          <p style="color: #334155; font-size: 14px; line-height: 1.6; margin-top: 20px;">Hello ${user.full_name},</p>
                          <p style="color: #334155; font-size: 14px; line-height: 1.6;">
                            Use the following one-time 6-digit OTP code to sign in to your HR Agent Analytics dashboard:
                          </p>
                          <div style="background-color: #f1f5f9; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0;">
                            <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #2563eb;">
                              ${otp}
                            </span>
                          </div>
                          <p style="color: #64748b; font-size: 12px; line-height: 1.5;">
                            ⏱️ This code is valid for 10 minutes. Do not share this code with anyone.
                          </p>
                        </div>
                      `
                    });
                    mailSent = true;
                    deliveryMethod = 'smtp';
                    console.log(`[SMTP OTP] Sent 6-digit code to ${email}`);
                  } catch (err) {
                    console.error('[SMTP OTP Error]', err.message);
                  }
                }

                // Method 2: Resend REST API (if key provided)
                if (!mailSent && resendApiKey) {
                  try {
                    const resendRes = await fetch('https://api.resend.com/emails', {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${resendApiKey}`,
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        from: process.env.RESEND_FROM || 'TGH Security <onboarding@resend.dev>',
                        to: [email],
                        subject: 'TGH HR Agent Analytics: Your 6-Digit OTP Code',
                        html: `<h2>Your 6-Digit OTP: <strong>${otp}</strong></h2><p>Valid for 10 minutes.</p>`
                      })
                    });
                    if (resendRes.ok) {
                      mailSent = true;
                      deliveryMethod = 'resend';
                      console.log(`[Resend OTP] Sent 6-digit code to ${email}`);
                    }
                  } catch (err) {
                    console.error('[Resend OTP Error]', err.message);
                  }
                }

                // Method 3: n8n Webhook Dispatch (hits n8n which can send via Gmail/Outlook node)
                if (!mailSent && n8nWebhook) {
                  try {
                    const n8nRes = await fetch(n8nWebhook, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        event: 'SEND_OTP',
                        email,
                        fullName: user.full_name,
                        role: user.role,
                        otp,
                        expiresInMinutes: 10,
                        timestamp: new Date().toISOString()
                      })
                    });
                    if (n8nRes.ok) {
                      mailSent = true;
                      deliveryMethod = 'n8n_webhook';
                      console.log(`[n8n OTP Webhook] Dispatched OTP payload for ${email} to n8n`);
                    }
                  } catch (err) {
                    // n8n webhook might not be listening yet, ignore quietly
                  }
                }

                if (!mailSent) {
                  console.log(`\n============================================================`);
                  console.log(`[TGH CORPORATE AUTHENTICATION OTP]`);
                  console.log(`Recipient: ${email} (${user.full_name} - ${user.role.toUpperCase()})`);
                  console.log(`>>> 6-DIGIT OTP CODE: ${otp} <<<`);
                  console.log(`Valid for 10 minutes. (Configure SMTP or n8n in .env for real delivery)`);
                  console.log(`============================================================\n`);
                }

                res.end(JSON.stringify({
                  success: true,
                  message: `A 6-digit verification code has been dispatched to ${email}.`,
                  email,
                  mail_sent: mailSent,
                  delivery_method: deliveryMethod,
                  dev_otp: !mailSent ? otp : undefined,
                }));
                return;
              }

              // -------------------------------------------------------------
              // 2. VERIFY 6-DIGIT OTP
              // -------------------------------------------------------------
              if (reqAction === 'verify-otp') {
                const otp = (body.otp || '').trim();
                if (!email || !otp) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ success: false, error: 'Email and 6-digit OTP are required.' }));
                  return;
                }

                const record = devOtps.get(email);
                const isDevBypass = otp === '123456';

                if (!record && !isDevBypass) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ 
                    success: false, 
                    error: 'No active OTP request found for this email. Please click Resend OTP or use local bypass code 123456.' 
                  }));
                  return;
                }

                if (record && !isDevBypass) {
                  if (Date.now() > record.expiresAt) {
                    devOtps.delete(email);
                    res.statusCode = 400;
                    res.end(JSON.stringify({ success: false, error: 'OTP code has expired. Please request a new code or use 123456.' }));
                    return;
                  }

                  if (record.otp !== otp) {
                    res.statusCode = 400;
                    res.end(JSON.stringify({ 
                      success: false, 
                      error: `Incorrect OTP code. Your active code is ${record.otp} (or enter 123456).` 
                    }));
                    return;
                  }
                }

                // OTP Validated!
                devOtps.delete(email);
                const user = devUsers.get(email);
                user.last_login = new Date().toISOString();

                console.log(`[AUTH SUCCESS] User logged in: ${user.full_name} (${user.email}, Role: ${user.role})`);

                res.end(JSON.stringify({
                  success: true,
                  message: 'Verification successful',
                  user: {
                    id: user.id,
                    email: user.email,
                    full_name: user.full_name,
                    department: user.department,
                    role: user.role || 'technical',
                    last_login: user.last_login,
                  },
                  token: 'dev_token_' + Date.now(),
                }));
                return;
              }

              // -------------------------------------------------------------
              // 3. ADMIN PORTAL: LIST USERS
              // -------------------------------------------------------------
              if (reqAction === 'list-users') {
                const userList = Array.from(devUsers.values()).map(u => ({
                  id: u.id,
                  email: u.email,
                  full_name: u.full_name,
                  department: u.department,
                  role: u.role || 'technical',
                  created_at: u.created_at,
                  last_login: u.last_login,
                }));

                res.end(JSON.stringify({ success: true, users: userList }));
                return;
              }

              // -------------------------------------------------------------
              // 4. ADMIN PORTAL: ADD NEW USER
              // -------------------------------------------------------------
              if (reqAction === 'add-user') {
                const fullName = (body.full_name || body.fullName || '').trim();
                const department = (body.department || 'Engineering & IT').trim();
                const role = body.role === 'admin' ? 'admin' : 'technical';

                if (!email || !fullName) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ success: false, error: 'Email and full name are required.' }));
                  return;
                }

                if (devUsers.has(email)) {
                  res.statusCode = 409;
                  res.end(JSON.stringify({ success: false, error: `User with email ${email} already exists.` }));
                  return;
                }

                const newUser = {
                  id: String(Date.now()),
                  email,
                  full_name: fullName,
                  department,
                  role,
                  created_at: new Date().toISOString(),
                  last_login: null,
                };
                devUsers.set(email, newUser);

                console.log(`[ADMIN PORTAL] Provisioned new user: ${fullName} (${email}, Role: ${role})`);

                res.end(JSON.stringify({
                  success: true,
                  message: `User ${fullName} has been successfully provisioned.`,
                  user: newUser,
                }));
                return;
              }

              // -------------------------------------------------------------
              // 5. ADMIN PORTAL: UPDATE USER ROLE
              // -------------------------------------------------------------
              if (reqAction === 'update-user-role') {
                const targetRole = body.role === 'admin' ? 'admin' : 'technical';
                const user = devUsers.get(email);
                if (!user) {
                  res.statusCode = 404;
                  res.end(JSON.stringify({ success: false, error: 'User not found.' }));
                  return;
                }

                user.role = targetRole;
                devUsers.set(email, user);

                console.log(`[ADMIN PORTAL] Updated role for ${email} to ${targetRole}`);

                res.end(JSON.stringify({
                  success: true,
                  message: `Role for ${user.full_name} updated to ${targetRole}.`,
                  user,
                }));
                return;
              }

              // -------------------------------------------------------------
              // 6. ADMIN PORTAL: DELETE USER
              // -------------------------------------------------------------
              if (reqAction === 'delete-user') {
                if (!devUsers.has(email)) {
                  res.statusCode = 404;
                  res.end(JSON.stringify({ success: false, error: 'User not found.' }));
                  return;
                }

                const deleted = devUsers.get(email);
                devUsers.delete(email);

                console.log(`[ADMIN PORTAL] Deleted user: ${deleted.full_name} (${email})`);

                res.end(JSON.stringify({
                  success: true,
                  message: `User ${deleted.full_name} has been removed.`,
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
                    must_reset_password: false,
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
                    must_reset_password: Boolean(user.must_reset_password),
                  },
                  token: 'dev_token_' + Math.random().toString(36).substring(2),
                }));
                return;
              }

              // Forgot password / Request Temporary Password
              if (reqAction === 'forgot-password' || reqAction === 'reset-password') {
                const tempPassword = 'TGH-' + Math.floor(100000 + Math.random() * 900000);
                let user = devUsers.get(email);
                if (!user) {
                  user = {
                    id: String(Date.now()),
                    email,
                    full_name: email.split('@')[0].replace('.', ' ').replace(/(^\w|\s\w)/g, (m) => m.toUpperCase()),
                    department: 'Human Resources (HR)',
                    password: tempPassword,
                    must_reset_password: true,
                    last_login: new Date().toISOString(),
                  };
                } else {
                  user.password = tempPassword;
                  user.must_reset_password = true;
                }
                devUsers.set(email, user);

                // Check for live SMTP configuration
                const smtpUser = process.env.SMTP_USER;
                const smtpPass = process.env.SMTP_PASS;
                const smtpHost = process.env.SMTP_HOST || 'smtp.hostinger.com';
                const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
                const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;

                let mailSent = false;
                let mailNotice = '';

                if (smtpUser && smtpPass) {
                  try {
                    const transporter = nodemailer.createTransport({
                      host: smtpHost,
                      port: smtpPort,
                      secure: smtpSecure,
                      auth: { user: smtpUser, pass: smtpPass },
                    });

                    await transporter.sendMail({
                      from: process.env.SMTP_FROM || `"TGH IT Security" <${smtpUser}>`,
                      to: email,
                      subject: 'TGH HR Agent Analytics: Your Temporary Password',
                      html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                          <div style="text-align: center; margin-bottom: 20px;">
                            <h2 style="color: #1e293b; margin: 0;">TechyGeekHub HR Agent Analytics</h2>
                            <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Self-Service Password Recovery</p>
                          </div>
                          <p style="color: #334155; font-size: 14px; line-height: 1.6;">Hello,</p>
                          <p style="color: #334155; font-size: 14px; line-height: 1.6;">
                            A temporary password was requested for your corporate account (<strong>${email}</strong>).
                          </p>
                          <p style="color: #334155; font-size: 14px; line-height: 1.6;">
                            Please use the following one-time temporary password to sign in:
                          </p>
                          <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
                            <span style="font-family: monospace; font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #2563eb;">
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
                    });
                    mailSent = true;
                    console.log(`\n[SMTP SUCCESS] Delivered real email to: ${email} via ${smtpHost}`);
                  } catch (err) {
                    console.error(`\n[SMTP ERROR] Could not dispatch to ${email}:`, err.message);
                    mailNotice = ` (SMTP error: ${err.message})`;
                  }
                } else {
                  console.log(`\n============================================================`);
                  console.log(`[SMTP CONFIGURATION REQUIRED FOR REAL EMAIL DELIVERY]`);
                  console.log(`To deliver emails to ${email}, configure SMTP in .env:`);
                  console.log(`  SMTP_HOST=smtp.hostinger.com`);
                  console.log(`  SMTP_PORT=465`);
                  console.log(`  SMTP_USER=your-email@techygeekhub.com`);
                  console.log(`  SMTP_PASS=your-email-password`);
                  console.log(`------------------------------------------------------------`);
                  console.log(`[LOCAL DEV TESTING ONLY - GENERATED CODE]: ${tempPassword}`);
                  console.log(`============================================================\n`);
                }

                res.end(JSON.stringify({
                  success: true,
                  message: mailSent 
                    ? `A temporary password has been delivered to your email (${email}).`
                    : `A temporary password request was processed for ${email}.${mailNotice}`,
                  smtp_live: mailSent,
                  user: {
                    email: user.email,
                    must_reset_password: true,
                  },
                }));
                return;
              }

              // Change / Reset Password after login with temporary password
              if (reqAction === 'change-password') {
                const newPassword = body.newPassword || body.password;
                if (!newPassword || newPassword.length < 6) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ success: false, error: 'New password must be at least 6 characters long.' }));
                  return;
                }

                let user = devUsers.get(email);
                if (user) {
                  user.password = newPassword;
                  user.must_reset_password = false;
                  devUsers.set(email, user);
                }

                res.end(JSON.stringify({
                  success: true,
                  message: 'Your password has been successfully updated and saved in the database!',
                  user: {
                    ...(user || {}),
                    email,
                    must_reset_password: false,
                  },
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

        // Quota Pre-Flight Gate API endpoint (/api/quota.php or /api/quota)
        if (urlObj.pathname === '/api/quota.php' || urlObj.pathname === '/api/quota') {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

          if (req.method === 'OPTIONS') {
            res.statusCode = 200;
            res.end();
            return;
          }

          const action = urlObj.searchParams.get('action') || 'check';

          let bodyText = '';
          req.on('data', (chunk) => { bodyText += chunk; });
          req.on('end', async () => {
            try {
              const body = bodyText ? JSON.parse(bodyText) : {};
              const reqAction = action || body.action || 'check';
              const userParam = (urlObj.searchParams.get('user') || body.user || '').trim().replace(/^["']|["']$/g, '');
              const emailParam = (urlObj.searchParams.get('email') || body.email || '').trim().replace(/^["']|["']$/g, '');

              if (!userParam && !emailParam && (reqAction === 'get-config' || reqAction === 'config' || reqAction === 'tokens' || reqAction === 'get-tokens' || reqAction === 'limits')) {
                res.end(JSON.stringify({
                  success: true,
                  dailyTokenLimit: devQuotaConfig.dailyTokenLimit,
                  dailyMessageLimit: devQuotaConfig.dailyMessageLimit,
                  alertIntervalHours: devQuotaConfig.alertIntervalHours,
                  teamsWebhookUrl: devQuotaConfig.teamsWebhookUrl,
                  config: devQuotaConfig,
                }));
                return;
              }

              if (reqAction === 'set-config') {
                if (body.dailyMessageLimit !== undefined) devQuotaConfig.dailyMessageLimit = Number(body.dailyMessageLimit);
                if (body.dailyTokenLimit !== undefined) devQuotaConfig.dailyTokenLimit = Number(body.dailyTokenLimit);
                if (body.alertIntervalHours !== undefined) devQuotaConfig.alertIntervalHours = Number(body.alertIntervalHours);
                if (body.teamsWebhookUrl) devQuotaConfig.teamsWebhookUrl = String(body.teamsWebhookUrl);
                res.end(JSON.stringify({ success: true, message: 'Quota config saved', config: devQuotaConfig }));
                return;
              }

              if (reqAction === 'reset-user') {
                const emp = (body.employeeName || urlObj.searchParams.get('user') || '').trim();
                if (emp) {
                  devQuotaConfig.resets[emp.toLowerCase()] = {
                    employeeName: emp,
                    resetAt: new Date().toISOString(),
                    timestamp: Date.now(),
                  };
                }
                res.end(JSON.stringify({ success: true, message: `Quota for ${emp} reset to 0` }));
                return;
              }

              if (reqAction === 'reset-all') {
                devQuotaConfig.globalResetAt = new Date().toISOString();
                devQuotaConfig.resets = {};
                res.end(JSON.stringify({ success: true, message: 'All quotas reset to 0' }));
                return;
              }

              // Check action or User tokens usage (Pre-flight gate for n8n/Teams bot)
              if (reqAction === 'check' || reqAction === 'tokens' || reqAction === 'usage' || userParam || emailParam) {
                const emailParam = (urlObj.searchParams.get('email') || body.email || '').trim();

                if (!userParam && !emailParam) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ allowed: true, error: 'User identifier required' }));
                  return;
                }

                // Fetch latest audit logs from n8n live feed
                let logs = [];
                try {
                  const feedRes = await fetch('https://n8n.srv1901759.hstgr.cloud/webhook/hr-agent-analytics-live', {
                    headers: { 'Accept': 'application/json' },
                  });
                  if (feedRes.ok) logs = await feedRes.json();
                } catch (e) {}

                const targetName = userParam.toLowerCase();
                const targetEmail = emailParam.toLowerCase();

                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);
                const todayStartTime = todayStart.getTime();

                let todayQueries = 0;
                let todayTokens = 0;

                const empReset = devQuotaConfig.resets[targetName];
                const empResetTime = empReset ? new Date(empReset.resetAt).getTime() : 0;
                const globalResetTime = devQuotaConfig.globalResetAt ? new Date(devQuotaConfig.globalResetAt).getTime() : 0;

                (logs || []).forEach(log => {
                  const logName = String(log.NAME || log.name || log.EmployeeName || '').toLowerCase();
                  const logEmail = String(log.EMAIL || log.email || '').toLowerCase();
                  const matches = (targetName && (logName.includes(targetName) || targetName.includes(logName))) ||
                                  (targetEmail && logEmail === targetEmail);

                  if (matches) {
                    const logTime = log.createdAt ? new Date(log.createdAt).getTime() : Date.now();
                    if (logTime >= todayStartTime) {
                      if (globalResetTime && logTime <= globalResetTime) return;
                      if (empResetTime && logTime <= empResetTime) return;

                      todayQueries++;
                      const pt = Number(log.PROMPT_TOKENS || log.promptTokens || 0);
                      const ct = Number(log.COMPLETION_TOKENS || log.completionTokens || 0);
                      const tt = Number(log.TOTAL_TOKENS || log.totalTokens || (pt + ct));
                      todayTokens += tt;
                    }
                  }
                });

                const msgLimit = devQuotaConfig.dailyMessageLimit;
                const tknLimit = devQuotaConfig.dailyTokenLimit;

                const queriesExceeded = (msgLimit > 0 && todayQueries >= msgLimit);
                const tokensExceeded = (tknLimit > 0 && todayTokens >= tknLimit);
                const isExceeded = queriesExceeded || tokensExceeded;

                const queryPct = msgLimit > 0 ? Math.round((todayQueries / msgLimit) * 100) : 0;
                const tokenPct = tknLimit > 0 ? Math.round((todayTokens / tknLimit) * 100) : 0;
                const isNearLimit = !isExceeded && (queryPct >= 85 || tokenPct >= 85);

                if (isExceeded) {
                  const limitDesc = queriesExceeded ? `${todayQueries}/${msgLimit} questions` : `${todayTokens.toLocaleString()} / ${tknLimit.toLocaleString()} tokens`;
                  res.end(JSON.stringify({
                    allowed: false,
                    status: 'EXCEEDED',
                    reason: queriesExceeded ? 'DAILY_MESSAGE_LIMIT_REACHED' : 'DAILY_TOKEN_LIMIT_REACHED',
                    employee: userParam || emailParam,
                    todayQueries,
                    queryPercentage: queryPct,
                    dailyMessageLimit: msgLimit,
                    todayTokens,
                    tokenPercentage: tokenPct,
                    dailyTokenLimit: tknLimit,
                    replyMessage: `⚠️ **Daily Quota Exceeded**: You have used your daily allowance (${limitDesc}). Your request was paused to conserve resources. Please contact the HR team for additional access.`,
                    timestamp: new Date().toISOString(),
                  }));
                  return;
                }

                res.end(JSON.stringify({
                  allowed: true,
                  status: isNearLimit ? 'NEAR_LIMIT' : 'NORMAL',
                  nearLimit: isNearLimit,
                  employee: userParam || emailParam,
                  todayQueries,
                  queryPercentage: queryPct,
                  remainingQueries: Math.max(0, msgLimit - todayQueries),
                  dailyMessageLimit: msgLimit,
                  todayTokens,
                  tokenPercentage: tokenPct,
                  remainingTokens: Math.max(0, tknLimit - todayTokens),
                  dailyTokenLimit: tknLimit,
                  timestamp: new Date().toISOString(),
                }));
                return;
              }

              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: 'Unknown quota action' }));
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
