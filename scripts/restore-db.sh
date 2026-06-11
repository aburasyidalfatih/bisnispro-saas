#!/bin/bash
# ============================================================
# SchoolPro Database Restore Script
# Download dari Google Drive → Decompress → Restore ke PostgreSQL
# ============================================================
# Cara pakai:
#   ./scripts/restore-db.sh                              # Restore backup terbaru dari lokal
#   ./scripts/restore-db.sh schoolpro_db_20260511.sql.gz  # Restore file spesifik
#   ./scripts/restore-db.sh --from-gdrive                # Lihat & pilih dari Google Drive
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_DIR="$(dirname "$SCRIPT_DIR")"
if [ -f "${COMPOSE_DIR}/.env" ]; then
  source "${COMPOSE_DIR}/.env"
fi
BACKUP_DIR="${COMPOSE_DIR}/backups"
GDRIVE_FOLDER="${BACKUP_FOLDER_NAME:-SchoolPro-Backups}"
GDRIVE_REMOTE="gdrive:${GDRIVE_FOLDER}"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# --- Pilih file backup ---
if [ "$1" == "--from-gdrive" ]; then
  log "Listing backups from Google Drive..."
  rclone ls "${GDRIVE_REMOTE}/" | sort -k2 | tail -10
  echo ""
  read -p "Masukkan nama file yang ingin di-restore: " SELECTED_FILE
  log "Downloading ${SELECTED_FILE} from Google Drive..."
  rclone copy "${GDRIVE_REMOTE}/${SELECTED_FILE}" "${BACKUP_DIR}/"
  BACKUP_FILE="${BACKUP_DIR}/${SELECTED_FILE}"
elif [ -n "$1" ]; then
  BACKUP_FILE="${BACKUP_DIR}/$1"
else
  # Ambil backup terbaru dari lokal
  BACKUP_FILE=$(ls -t ${BACKUP_DIR}/schoolpro_db_*.sql.gz 2>/dev/null | head -1)
fi

if [ -z "${BACKUP_FILE}" ] || [ ! -f "${BACKUP_FILE}" ]; then
  echo "❌ Error: File backup tidak ditemukan!"
  echo "   Cek folder: ${BACKUP_DIR}"
  echo "   Atau gunakan: $0 --from-gdrive"
  exit 1
fi

FILESIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
log "File backup: $(basename ${BACKUP_FILE}) (${FILESIZE})"

# --- Konfirmasi ---
echo ""
echo "⚠️  PERINGATAN: Ini akan MENGHAPUS semua data saat ini dan menggantinya dengan backup!"
echo "   Database: saasmasterpro"
echo "   File: $(basename ${BACKUP_FILE})"
echo ""
read -p "Ketik 'RESTORE' untuk melanjutkan: " CONFIRM

if [ "${CONFIRM}" != "RESTORE" ]; then
  echo "Dibatalkan."
  exit 0
fi

# --- Restore ---
DB_USER=${POSTGRES_USER:-postgres}
DB_NAME=${POSTGRES_DB:-saasmasterpro}

log "Stopping app containers..."
cd "${COMPOSE_DIR}"
docker compose stop app

log "Restoring database..."
gunzip -c "${BACKUP_FILE}" | docker compose exec -T db psql -U "${DB_USER}" -d "${DB_NAME}" --single-transaction

log "Starting app containers..."
docker compose start app

log "✅ Restore completed! Database telah dikembalikan ke backup $(basename ${BACKUP_FILE})"
