#!/bin/bash
# ============================================================
# SchoolPro Database Backup Script (Server Version)
# Backup PostgreSQL -> Compress -> Upload ke Google Drive
# ============================================================
set -e

BACKUP_DIR="/opt/schoolpro-prod/backups"
GDRIVE_FOLDER="SchoolPro-Backups"
GDRIVE_REMOTE="gdrive:${GDRIVE_FOLDER}"
RETENTION_LOCAL=7
RETENTION_GDRIVE=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="schoolpro_db_${TIMESTAMP}.sql.gz"
LOG_FILE="${BACKUP_DIR}/backup.log"

mkdir -p "${BACKUP_DIR}"

DB_USER="db_admin_schoolpro"
DB_NAME="saasmasterpro"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

log "========== BACKUP STARTED =========="

# --- STEP 1: Dump Database ---
log "Step 1: Dumping database..."

docker exec compose-program-neural-port-6gtmbm-db-1 pg_dump \
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

  log "Step 2b: Cleaning old backups from Google Drive..."
  rclone delete "${GDRIVE_REMOTE}/" --min-age "${RETENTION_GDRIVE}d" --log-level INFO
  log "Step 2b: Done."
else
  log "Step 2: SKIPPED - rclone not installed. Backup saved locally only."
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
