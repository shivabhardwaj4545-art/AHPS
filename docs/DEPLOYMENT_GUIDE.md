# Production Deployment Guide
## Teacher Attendance & Payroll Management System

---

## 1. Overview & Topologies

Depending on your institutional infrastructure, two primary architectures are supported:

### Topology A: Pure On-Premise (Local School Server)
All components (PostgreSQL, Redis, Backend, Frontend, and Biometric Machines) reside on the school's local area network (LAN).
- Ideal for campuses with strict internal data policies.
- Biometric machines push directly to `http://192.168.1.100:5000/api/v1/device-events`.

### Topology B: Hybrid Cloud Deployment (Cloud Backend + Local Biometric Agent)
- Backend and Frontend hosted on AWS / DigitalOcean / Cloud VPS.
- Biometric machines reside behind a school NAT firewall without public IP.
- A lightweight Python/Node.js relay agent or WireGuard/Tailscale VPN connects the local biometric devices to the cloud webhook endpoint securely.

---

## 2. Docker Compose Deployment (Recommended)

### Prerequisites
- Docker Engine 24.0+
- Docker Compose v2.20+
- Minimum Server Specs: 2 vCPU, 4GB RAM, 40GB SSD

### Steps:
1. Clone the repository onto your host:
   ```bash
   git clone <repo-url> /opt/school-attendance
   cd /opt/school-attendance/teacher-attendance-payroll
   ```

2. Generate production secrets:
   ```bash
   openssl rand -hex 32 # for JWT_SECRET
   openssl rand -hex 32 # for JWT_REFRESH_SECRET
   openssl rand -hex 32 # for ENCRYPTION_KEY
   ```

3. Configure `/opt/school-attendance/teacher-attendance-payroll/.env`:
   ```env
   NODE_ENV=production
   DB_USER=school_pg_admin
   DB_PASSWORD=SecurePassword987!
   DB_NAME=teacher_attendance_payroll
   JWT_SECRET=<generated_key>
   JWT_REFRESH_SECRET=<generated_key>
   ENCRYPTION_KEY=<generated_32_char_hex>
   TIMEZONE=Asia/Kolkata
   ```

4. Build and start services in background:
   ```bash
   docker-compose up --build -d
   ```

5. Verify running containers:
   ```bash
   docker ps
   ```

6. Run initial database migration and seeding inside backend container:
   ```bash
   docker-compose exec backend npx prisma migrate deploy
   docker-compose exec backend npm run seed
   ```

---

## 3. Production Nginx Reverse Proxy & SSL Configuration

Install Certbot and configure Nginx on the host machine:

```nginx
server {
    listen 80;
    server_name portal.school.edu;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name portal.school.edu;

    ssl_certificate /etc/letsencrypt/live/portal.school.edu/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/portal.school.edu/privkey.pem;

    # SSL Security Headers
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-XSS-Protection "1; mode=block";

    # Frontend Single Page App
    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend REST API
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
        proxy_read_timeout 90;
    }

    # Biometric Push Webhook Receiver (Higher payload limit for log batches)
    location /api/v1/device-events {
        proxy_pass http://127.0.0.1:5000;
        client_max_body_size 25M;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
    }
}
```

---

## 4. On-Premise Biometric Relay Agent (for Firewalled LAN Machines)

If biometric terminals cannot directly initiate HTTPS connections outside the campus LAN:
1. Run an on-premise relay daemon on a small local campus mini-PC (or Raspberry Pi).
2. The relay polls local terminals via TCP (port 4370) and flushes the logs as an authorized batch POST to:
   `https://portal.school.edu/api/v1/device-events`
   carrying the header `x-device-token: <biometric-device-secret>`.
3. In case of campus internet outage, the biometric terminal holds up to 100,000 raw punch logs in local flash memory; once connectivity is restored, the sync service ingests the backlog without duplicates.

