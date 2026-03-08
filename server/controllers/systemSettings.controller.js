const SystemSettings = require('../models/systemSettings');
const AuditLog = require('../models/auditLog');

/**
 * Get system settings
 * Public endpoint - needed for maintenance mode check on login
 */
exports.getSystemSettings = async (req, res) => {
  try {
    const settings = await SystemSettings.getSettings();
    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error fetching system settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system settings',
      error: error.message,
    });
  }
};

/**
 * Update system settings
 * Admin only
 */
exports.updateSystemSettings = async (req, res) => {
  try {
    const { siteName, siteDescription, maintenanceMode, allowRegistration, requireEmailVerification } = req.body;

    // Validate required fields
    if (!siteName || !siteDescription) {
      return res.status(400).json({
        success: false,
        message: 'Site name and description are required',
      });
    }

    const updates = {
      siteName,
      siteDescription,
      maintenanceMode: maintenanceMode === true,
      allowRegistration: allowRegistration === true,
      requireEmailVerification: requireEmailVerification === true,
    };

    const userId = req.user ? req.user._id : null;
    const settings = await SystemSettings.updateSettings(updates, userId);

    // Log the settings update (only if audit logging is available)
    try {
      await AuditLog.create({
        userId: userId,
        action: 'UPDATE_SYSTEM_SETTINGS',
        details: {
          updates,
          previousSettings: req.body.previousSettings || {},
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    } catch (auditError) {
      console.log('Audit log failed:', auditError.message);
      // Continue even if audit log fails
    }

    res.json({
      success: true,
      message: 'System settings updated successfully',
      data: settings,
    });
  } catch (error) {
    console.error('Error updating system settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update system settings',
      error: error.message,
    });
  }
};
