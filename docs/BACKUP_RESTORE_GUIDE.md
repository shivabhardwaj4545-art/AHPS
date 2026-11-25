# Database Backup & Disaster Recovery Guide
## Teacher Attendance & Payroll Management System

---

## 1. Backup Strategy Overview

To safeguard payroll registers, biometric punch history, and attendance records, the system employs a multi-tiered backup approach:
1. **Daily Full Logical Backups**: Automated SQL dump generated nightly at 01:00 AM.
2. **Write-Ahead Log (WAL) Archiving**: Continuous transaction logging for Point-In-Time Recovery (PITR).
3. **Offsite Cloud Sync**: Encrypted snapshots uploaded to Amazon S3 / Cloudflare R2 / Azure Blob Storage.
4. **Retention Policy**:
   - Hourly WALs: Retained 7 days
   - Daily Dumps: Retained 30 days
   - Monthly Locked Payroll Dumps: Retained 7 years (statutory audit requirement)

---

## 2. Automated Daily Backup Script

Save as `/usr/local/bin/backup_school_db.sh`:

```bash
#!/bin/bash
set -e

# Configuration
BACKUP_DIR="/var/backups/school_db"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="teacher_attendance_payroll"
DB_USER="postgres"
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"
ENCRYPTION_PASSPHRASE="YourStrongBackupPassphrase2026"
S3_BUCKET="s3://school-secure-db-backups/daily"

mkdir -p "$BACKUP_DIR"

echo "=== [1/4] Starting PostgreSQL Backup: ${DB_NAME} ==="
docker exec -t school_attendance_postgres pg_dump -U "$DB_USER" -d "$DB_NAME" -F c | gzip > "$BACKUP_FILE"

echo "=== [2/4] Encrypting Snapshot with OpenSSL AES-256 ==="
openssl enc -aes-256-cbc -salt -pbkdf2 -in "$BACKUP_FILE" -out "${BACKUP_FILE}.enc" -k "$ENCRYPTION_PASSPHRASE"
rm "$BACKUP_FILE" # Remove unencrypted raw gzip

echo "=== [3/4] Syncing to Offsite Cloud S3 Bucket ==="
aws s3 cp "${BACKUP_FILE}.enc" "${S3_BUCKET}/" --storage-class STANDARD_IA

echo "=== [4/4] Pruning Local Backups Older Than 30 Days ==="
find "$BACKUP_DIR" -type f -name "*.enc" -mtime +30 -exec rm {} \;

echo "Backup and sync completed successfully: ${BACKUP_FILE}.enc"
```

Make executable and register with Cron:
```bash
chmod +x /usr/local/bin/backup_school_db.sh
# Add to root crontab:
# 0 1 * * * /usr/local/bin/backup_school_db.sh >> /var/log/db_backup.log 2>&1
```

---

## 3. Database Restoration Procedure

### Scenario: Disaster Recovery from Encrypted S3 Snapshot

1. Stop application traffic to prevent concurrent writes:
   ```bash
   docker stop school_attendance_backend
   ```

2. Download and decrypt the snapshot:
   ```bash
   aws s3 cp s3://school-secure-db-backups/daily/teacher_attendance_payroll_YYYYMMDD_HHMMSS.sql.gz.enc ./
   
   openssl enc -d -aes-256-cbc -pbkdf2 -in teacher_attendance_payroll_YYYYMMDD_HHMMSS.sql.gz.enc \
       -out restore.sql.gz -k "YourStrongBackupPassphrase2026"
   
   gunzip restore.sql.gz
   ```

3. Terminate active database sessions and drop/recreate database:
   ```bash
   docker exec -i school_attendance_postgres psql -U postgres -c "
     SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'teacher_attendance_payroll';
     DROP DATABASE IF EXISTS teacher_attendance_payroll;
     CREATE DATABASE teacher_attendance_payroll;
   "
   ```

4. Restore database dump using `pg_restore`:
   ```bash
   cat restore.sql | docker exec -i school_attendance_postgres pg_restore -U postgres -d teacher_attendance_payroll --clean --if-exists
   ```

5. Restart the backend service:
   ```bash
   docker start school_attendance_backend
   ```

6. Verify restoration health:
   ```bash
   curl http://localhost:5000/health
   ```

