#!/bin/bash
# ============================================================
# SchoolPro Database Backup Script
# Backup PostgreSQL → Compress → Upload ke Google Drive
# ============================================================
# Cara pakai:
#   chmod +x scripts/backup-db.sh
#   ./scripts/backup-db.sh           # Manual
#   crontab -e → tambahkan jadwal    # Otomatis
# ============================================================

set -e

# --- KONFIGURASI ---
COMPOSE_DIR="/home/ubuntu/schoolpro-prod"
if [ -f "${COMPOSE_DIR}/.env" ]; then
  source "${COMPOSE_DIR}/.env"
fi
BACKUP_DIR="${COMPOSE_DIR}/backups"
GDRIVE_FOLDER="${BACKUP_FOLDER_NAME:-SchoolPro-Backups}"
GDRIVE_REMOTE="gdrive:${GDRIVE_FOLDER}"
RETENTION_LOCAL=7    # Simpan 7 hari di VPS
RETENTION_GDRIVE=30  # Simpan 30 hari di Google Drive
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="schoolpro_db_${TIMESTAMP}.sql.gz"
LOG_FILE="${BACKUP_DIR}/backup.log"

# --- SETUP ---
mkdir -p "${BACKUP_DIR}"

DB_USER=${POSTGRES_USER:-postgres}
DB_NAME=${POSTGRES_DB:-saasmasterpro}

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

log "========== BACKUP STARTED =========="

# --- STEP 1: Dump Database ---
log "Step 1: Dumping database..."
cd "${COMPOSE_DIR}"

docker compose exec -T db pg_dump \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --no-owner \
  --no-privileges \
  --format=plain \
  | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"

FILESIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
log "Step 1: Done. File: ${BACKUP_FILE} (${FILESIZE})"

# --- STEP 2: Upload ke Google Drive ---
if command -v rclone &> /dev/null; then
  log "Step 2: Uploading to Google Drive..."
  rclone copy "${BACKUP_DIR}/${BACKUP_FILE}" "${GDRIVE_REMOTE}/" --log-level INFO
  log "Step 2: Done. Uploaded to ${GDRIVE_REMOTE}/${BACKUP_FILE}"

  # Hapus backup lama di Google Drive (lebih dari 30 hari)
  log "Step 2b: Cleaning old backups from Google Drive..."
  rclone delete "${GDRIVE_REMOTE}/" --min-age "${RETENTION_GDRIVE}d" --log-level INFO
  log "Step 2b: Done."
else
  log "Step 2: SKIPPED - rclone not installed. Backup saved locally only."
  log "         Install rclone: curl https://rclone.org/install.sh | sudo bash"
fi

# --- STEP 3: Hapus backup lama di lokal ---
log "Step 3: Cleaning old local backups (>${RETENTION_LOCAL} days)..."
find "${BACKUP_DIR}" -name "schoolpro_db_*.sql.gz" -mtime +${RETENTION_LOCAL} -delete
log "Step 3: Done."

# --- STEP 4: Verifikasi ---
BACKUP_COUNT_LOCAL=$(find "${BACKUP_DIR}" -name "schoolpro_db_*.sql.gz" | wc -l)
log "Step 4: Verification"
log "  - Latest backup: ${BACKUP_FILE} (${FILESIZE})"
log "  - Local backups: ${BACKUP_COUNT_LOCAL} files"
if command -v rclone &> /dev/null; then
  BACKUP_COUNT_GDRIVE=$(rclone ls "${GDRIVE_REMOTE}/" 2>/dev/null | wc -l)
  log "  - GDrive backups: ${BACKUP_COUNT_GDRIVE} files"
fi

log "========== BACKUP COMPLETED =========="
