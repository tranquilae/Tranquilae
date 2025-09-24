#!/bin/bash
# Restore script for Neon database
# Usage: ./scripts/restore_neon_db.sh <backup_file>

set -e

if [ $# -eq 0 ]; then
    echo "Usage: $0 <backup_file>"
    echo "Example: $0 backups/neon_backup_20250924_132000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file '$BACKUP_FILE' not found"
    exit 1
fi

# Check if NEON_DATABASE_URL is set
if [ -z "$NEON_DATABASE_URL" ]; then
    echo "Error: NEON_DATABASE_URL environment variable is not set"
    exit 1
fi

echo "⚠️  WARNING: This will REPLACE the current database content!"
echo "Backup file: $BACKUP_FILE"
echo "Target database: $NEON_DATABASE_URL"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

echo "Starting database restore..."

# Determine if file is compressed
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "Restoring from compressed backup..."
    gunzip -c "$BACKUP_FILE" | psql "$NEON_DATABASE_URL"
else
    echo "Restoring from uncompressed backup..."
    psql "$NEON_DATABASE_URL" < "$BACKUP_FILE"
fi

if [ $? -eq 0 ]; then
    echo "✅ Database restored successfully from $BACKUP_FILE"
else
    echo "❌ Restore failed!"
    exit 1
fi

echo "Restore process completed!"
