#!/bin/bash
# Backup script for Neon database before migration
# Usage: ./scripts/backup_neon_db.sh

set -e

# Configuration
BACKUP_DIR="backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/neon_backup_$TIMESTAMP.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Check if NEON_DATABASE_URL is set
if [ -z "$NEON_DATABASE_URL" ]; then
    echo "Error: NEON_DATABASE_URL environment variable is not set"
    echo "Please set it to your Neon database connection string"
    exit 1
fi

echo "Starting backup of Neon database..."
echo "Backup file: $BACKUP_FILE"

# Create backup using pg_dump
pg_dump "$NEON_DATABASE_URL" \
    --verbose \
    --clean \
    --if-exists \
    --create \
    --format=plain \
    > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Backup completed successfully: $BACKUP_FILE"
    echo "Backup size: $(du -h "$BACKUP_FILE" | cut -f1)"
    
    # Compress backup for storage efficiency
    gzip "$BACKUP_FILE"
    echo "✅ Backup compressed: ${BACKUP_FILE}.gz"
else
    echo "❌ Backup failed!"
    exit 1
fi

# Keep only last 10 backups
echo "Cleaning up old backups (keeping last 10)..."
ls -t "$BACKUP_DIR"/neon_backup_*.sql.gz | tail -n +11 | xargs -r rm
echo "✅ Cleanup completed"

echo "Backup process finished successfully!"
echo "To restore: gunzip -c ${BACKUP_FILE}.gz | psql \"\$NEON_DATABASE_URL\""
