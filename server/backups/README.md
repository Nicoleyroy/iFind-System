# Backup Management

## Current Status
This directory contains automated database backups created by the application.

## Files
- **Backup files**: `backup-YYYY-MM-DDTHH-mm-ss-mmmZ.json`
- All backup JSON files are ignored by git
- Only the directory structure is tracked via `.gitkeep`

## Backup Retention Policy

### Recommended Approach
Implement automated cleanup to maintain only recent backups:

```javascript
// Example: Keep only last 10 backups
const MAX_BACKUPS = 10;

// In your backup controller/service:
async function cleanupOldBackups() {
  const backupFiles = await fs.readdir(BACKUP_DIR);
  const backups = backupFiles
    .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
    .sort()
    .reverse();
  
  if (backups.length > MAX_BACKUPS) {
    const toDelete = backups.slice(MAX_BACKUPS);
    for (const file of toDelete) {
      await fs.unlink(path.join(BACKUP_DIR, file));
    }
  }
}
```

### Suggested Retention Tiers
1. **Last 10 backups** - Keep all recent backups
2. **Daily for 30 days** - Keep one backup per day for the last month
3. **Monthly forever** - Keep monthly snapshots long-term

### External Backup Storage
For production:
- Upload backups to cloud storage (AWS S3, Google Cloud Storage, etc.)
- Encrypt sensitive backups before storage
- Test restore procedures regularly

## Manual Cleanup
To manually clean up old backups:
```bash
# From server directory
cd backups
# Keep only last 10 backups
ls -t backup-*.json | tail -n +11 | xargs rm
```
