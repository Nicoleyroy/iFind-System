const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

// Models
const User = require('../src/models/user');
const Item = require('../src/models/item');
const LostItem = require('../src/models/lostItem');
const FoundItem = require('../src/models/foundItem');
const ClaimRequest = require('../src/models/claimRequest');
const AuditLog = require('../src/models/auditLog');

// Backup directory
const BACKUP_DIR = path.join(__dirname, '..', 'backups');

// Ensure backup directory exists
const ensureBackupDir = async () => {
  try {
    await fs.access(BACKUP_DIR);
  } catch {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
  }
};

// Create backup
exports.createBackup = async (req, res) => {
  try {
    await ensureBackupDir();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-${timestamp}.json`;
    const backupPath = path.join(BACKUP_DIR, backupFileName);

    const startTime = Date.now();

    // Fetch all data from collections
    const [users, items, lostItems, foundItems, claimRequests, auditLogs] = await Promise.all([
      User.find({}).lean(),
      Item.find({}).lean(),
      LostItem.find({}).lean(),
      FoundItem.find({}).lean(),
      ClaimRequest.find({}).lean(),
      AuditLog.find({}).lean(),
    ]);

    // Create backup object
    const backupData = {
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0',
        databaseName: mongoose.connection.name,
        createdBy: req.user ? req.user.id : 'system',
      },
      collections: {
        users,
        items,
        lostItems,
        foundItems,
        claimRequests,
        auditLogs,
      },
      stats: {
        usersCount: users.length,
        itemsCount: items.length,
        lostItemsCount: lostItems.length,
        foundItemsCount: foundItems.length,
        claimRequestsCount: claimRequests.length,
        auditLogsCount: auditLogs.length,
      },
    };

    // Write backup to file
    await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));

    // Get file size
    const stats = await fs.stat(backupPath);
    const fileSizeInBytes = stats.size;
    const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    res.json({
      success: true,
      message: 'Backup created successfully',
      backup: {
        id: timestamp,
        fileName: backupFileName,
        date: new Date().toISOString(),
        size: `${fileSizeInMB} MB`,
        duration: `${duration}s`,
        status: 'success',
        stats: backupData.stats,
      },
    });
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create backup',
      error: error.message,
    });
  }
};

// Get backup history
exports.getBackupHistory = async (req, res) => {
  try {
    await ensureBackupDir();

    const files = await fs.readdir(BACKUP_DIR);
    const backupFiles = files.filter(file => file.startsWith('backup-') && file.endsWith('.json'));

    const backups = await Promise.all(
      backupFiles.map(async (file, index) => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = await fs.stat(filePath);
        const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

        // Extract timestamp from filename
        const timestamp = file.replace('backup-', '').replace('.json', '');

        return {
          id: backupFiles.length - index,
          fileName: file,
          date: stats.mtime.toISOString(),
          size: `${fileSizeInMB} MB`,
          status: 'success',
          duration: 'N/A',
        };
      })
    );

    // Sort by date (newest first)
    backups.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      success: true,
      backups,
      totalBackups: backups.length,
    });
  } catch (error) {
    console.error('Error fetching backup history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch backup history',
      error: error.message,
    });
  }
};

// Restore from backup
exports.restoreBackup = async (req, res) => {
  try {
    const { fileName } = req.body;

    if (!fileName) {
      return res.status(400).json({
        success: false,
        message: 'Backup file name is required',
      });
    }

    const backupPath = path.join(BACKUP_DIR, fileName);

    // Check if backup file exists
    try {
      await fs.access(backupPath);
    } catch {
      return res.status(404).json({
        success: false,
        message: 'Backup file not found',
      });
    }

    // Read backup file
    const backupContent = await fs.readFile(backupPath, 'utf-8');
    const backupData = JSON.parse(backupContent);

    const startTime = Date.now();

    // Clear existing collections
    await Promise.all([
      User.deleteMany({}),
      Item.deleteMany({}),
      LostItem.deleteMany({}),
      FoundItem.deleteMany({}),
      ClaimRequest.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    // Restore data
    const collections = backupData.collections;
    await Promise.all([
      collections.users?.length > 0 ? User.insertMany(collections.users) : Promise.resolve(),
      collections.items?.length > 0 ? Item.insertMany(collections.items) : Promise.resolve(),
      collections.lostItems?.length > 0 ? LostItem.insertMany(collections.lostItems) : Promise.resolve(),
      collections.foundItems?.length > 0 ? FoundItem.insertMany(collections.foundItems) : Promise.resolve(),
      collections.claimRequests?.length > 0 ? ClaimRequest.insertMany(collections.claimRequests) : Promise.resolve(),
      collections.auditLogs?.length > 0 ? AuditLog.insertMany(collections.auditLogs) : Promise.resolve(),
    ]);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    // Log the restore action
    await AuditLog.create({
      userId: req.user ? req.user.id : null,
      action: 'SYSTEM_RESTORE',
      details: `System restored from backup: ${fileName}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      timestamp: new Date(),
    });

    res.json({
      success: true,
      message: 'Backup restored successfully',
      restore: {
        fileName,
        date: backupData.metadata.timestamp,
        duration: `${duration}s`,
        stats: backupData.stats,
      },
    });
  } catch (error) {
    console.error('Restore error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore backup',
      error: error.message,
    });
  }
};

// Delete backup
exports.deleteBackup = async (req, res) => {
  try {
    const { fileName } = req.params;

    if (!fileName) {
      return res.status(400).json({
        success: false,
        message: 'Backup file name is required',
      });
    }

    const backupPath = path.join(BACKUP_DIR, fileName);

    // Check if backup file exists
    try {
      await fs.access(backupPath);
    } catch {
      return res.status(404).json({
        success: false,
        message: 'Backup file not found',
      });
    }

    // Delete the backup file
    await fs.unlink(backupPath);

    res.json({
      success: true,
      message: 'Backup deleted successfully',
      fileName,
    });
  } catch (error) {
    console.error('Delete backup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete backup',
      error: error.message,
    });
  }
};

// Get backup stats
exports.getBackupStats = async (req, res) => {
  try {
    await ensureBackupDir();

    const files = await fs.readdir(BACKUP_DIR);
    const backupFiles = files.filter(file => file.startsWith('backup-') && file.endsWith('.json'));

    let totalSize = 0;
    let lastBackupDate = null;

    for (const file of backupFiles) {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = await fs.stat(filePath);
      totalSize += stats.size;

      if (!lastBackupDate || stats.mtime > lastBackupDate) {
        lastBackupDate = stats.mtime;
      }
    }

    const totalSizeInMB = (totalSize / (1024 * 1024)).toFixed(2);

    // Calculate next scheduled backup (tomorrow at 2:00 AM)
    const nextBackup = new Date();
    if (nextBackup.getHours() >= 2) {
      nextBackup.setDate(nextBackup.getDate() + 1);
    }
    nextBackup.setHours(2, 0, 0, 0);

    res.json({
      success: true,
      stats: {
        totalBackups: backupFiles.length,
        totalSize: `${totalSizeInMB} MB`,
        lastBackup: lastBackupDate ? lastBackupDate.toISOString() : null,
        nextScheduled: nextBackup.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching backup stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch backup stats',
      error: error.message,
    });
  }
};
