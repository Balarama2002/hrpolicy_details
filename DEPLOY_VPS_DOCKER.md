# 🚀 Hostinger VPS Container Deployment Guide

This guide walks you through deploying the **TGH HR Agent Analytics UI** and its self-hosted **MySQL Database** as Docker containers on your Hostinger VPS (`srv1901759.hstgr.cloud`).

---

## 🏗️ Architecture

```
Hostinger VPS (srv1901759.hstgr.cloud)
│
├── 🐳 tgh_hr_mysql (MySQL 8.0 Container)
│   ├── Port: 3306 (internal network + external mapped)
│   ├── Volume: tgh_hr_mysql_data (persistent storage)
│   └── Auto-Initializes: user_information table
│
└── 🐳 tgh_hr_agent_ui (App Container)
    ├── Express API + React SPA Dashboard
    ├── Port: 80 (or custom via APP_PORT)
    ├── Connects to: tgh_hr_mysql:3306
    └── Enforces: @techygeekhub.com email & Bcrypt encrypted passwords
```

---

## ⚡ Quick 3-Step Deployment on Hostinger VPS

### Step 1: Connect to your Hostinger VPS via SSH
Open your terminal (PowerShell, Command Prompt, or Mac/Linux Terminal) and connect:
```bash
ssh root@YOUR_HOSTINGER_VPS_IP
```
*(Replace `YOUR_HOSTINGER_VPS_IP` with your VPS IP, e.g., the IP of `srv1901759.hstgr.cloud`)*

---

### Step 2: Clone or Pull the Repository
Navigate to your preferred directory (e.g. `/opt` or `~`):
```bash
cd /opt
git clone https://github.com/Balarama2002/hrpolicy_details.git hr-agent-ui
cd hr-agent-ui
```
*(If already cloned earlier, simply pull latest changes:)*
```bash
git pull origin main
```

---

### Step 3: Configure Environment & Launch with Docker Compose
1. Copy the example Docker environment file:
```bash
cp .env.docker.example .env
```

2. (Optional) Edit `.env` if you want a custom port or passwords:
```bash
nano .env
```
Default ports:
- `APP_PORT=80` (or `8080` if port 80 is already used by an existing reverse proxy or n8n)
- `DB_PORT=3306`

3. Start the containers in the background:
```bash
docker compose up -d --build
```

---

## ✅ Verifying Your Deployment

1. Check that both containers are running healthy:
```bash
docker compose ps
```
You should see:
- `tgh_hr_mysql` (Up - healthy)
- `tgh_hr_agent_ui` (Up - healthy)

2. View live logs:
```bash
docker compose logs -f app
```

3. Open your browser:
👉 **`http://YOUR_HOSTINGER_VPS_IP/`** (or `http://YOUR_HOSTINGER_VPS_IP:8080/` depending on `APP_PORT`)

---

## 🛡️ Key Features Included
- **Zero Cloud Leak**: Database runs entirely on your own Hostinger VPS.
- **Auto-Initialization**: MySQL automatically creates the `user_information` table on first boot.
- **Bcrypt Encryption**: Passwords are cryptographically salted and hashed before entering MySQL.
- **Corporate Restriction**: Only `@techygeekhub.com` emails can register or log in.
- **Auto-Restart**: `restart: unless-stopped` ensures your app boots back up if the VPS reboots.

---

## 🔄 Useful Maintenance Commands

| Action | Command |
| :--- | :--- |
| **Check container status** | `docker compose ps` |
| **View live logs** | `docker compose logs -f` |
| **Restart services** | `docker compose restart` |
| **Stop services** | `docker compose down` |
| **Update with latest code** | `git pull origin main && docker compose up -d --build` |
| **Backup database** | `docker exec -t tgh_hr_mysql mysqldump -u tgh_user -pTghUserPass2026! hr_analytics > backup.sql` |
