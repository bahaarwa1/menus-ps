#!/usr/bin/env bash
# ==============================================================================
# Menus.ps Production Database Backup Script
# Automatically dumps PostgreSQL database, compresses, and rotates daily backups.
# ==============================================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="menus_ps_backup_${TIMESTAMP}.sql.gz"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

mkdir -p "$BACKUP_DIR"

echo "📦 [$(date)] Starting menus.ps database backup..."

if [ -n "${DATABASE_URL:-}" ]; then
  # Direct PostgreSQL dump
  pg_dump "$DATABASE_URL" --format=custom --no-owner --no-acl | gzip > "${BACKUP_DIR}/${FILENAME}"
  echo "✅ Backup successfully saved to: ${BACKUP_DIR}/${FILENAME}"
else
  echo "⚠️ DATABASE_URL not set. In local dev mode, export DATABASE_URL or run with Supabase CLI."
  echo "Example: supabase db dump -f ${BACKUP_DIR}/supabase_dump_${TIMESTAMP}.sql"
fi

# Rotate old backups
echo "🧹 Purging backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -name "menus_ps_backup_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete || true

echo "🎉 Backup process completed."
