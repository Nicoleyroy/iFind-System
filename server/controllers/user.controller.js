const UserModel = require('../src/models/user');
const AuditLogModel = require('../src/models/auditLog');
const LostItemModel = require('../src/models/lostItem');
const FoundItemModel = require('../src/models/foundItem');

const getAllUsers = async (req, res) => {
  try {
    const users = await UserModel.find().select('-password').sort({ createdAt: -1 });
    return res.json({ data: users });
  } catch (err) {
    console.error('GET /users failed', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await UserModel.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json({ data: user });
  } catch (err) {
    console.error('GET /user/:id failed', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phoneNumber, profilePicture, accountStatus, role, adminId } = req.body || {};
    
    // Get the user before update to check for role changes
    const oldUser = await UserModel.findById(id);
    if (!oldUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;
    if (accountStatus !== undefined) updateData.accountStatus = accountStatus;
    if (role !== undefined) updateData.role = role;
    
    const user = await UserModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Handle role change notifications and audit logging
    if (role !== undefined && oldUser.role !== role) {
      // Create audit log if adminId is provided
      if (adminId) {
        const oldRole = oldUser.role || 'user'; // Default to 'user' if undefined
        const auditAction = role === 'moderator' ? 'moderator_promoted' : 
                          (oldRole === 'moderator' ? 'moderator_demoted' : 'role_changed');
        
        await AuditLogModel.create({
          moderatorId: adminId,
          action: auditAction,
          targetType: 'User',
          targetId: user._id,
          details: `Changed user role from ${oldRole} to ${role}`,
          metadata: {
            oldRole: oldRole,
            newRole: role,
            userName: user.name || user.email,
          },
        });
      }
    }
    
    return res.json({ data: user, message: 'Profile updated successfully' });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message).join(', ');
      return res.status(400).json({ message: errors });
    }
    console.error('PUT /user/:id failed', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body || {};
    
    if (!newPassword) {
      return res.status(400).json({ message: 'New password is required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }
    
    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // If user has a password set, require current password verification
    if (user.password) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required' });
      }
      
      // Use bcrypt to compare current password
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }
    }
    
    // Set new password - pre-save hook will hash it
    user.password = newPassword;
    await user.save();
    
    return res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('PUT /user/:id/password failed', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await UserModel.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Delete all lost items posted by this user
    await LostItemModel.deleteMany({ userId: id });
    
    // Delete all found items posted by this user
    await FoundItemModel.deleteMany({ userId: id });
    
    return res.json({ message: 'User and all associated posts deleted successfully' });
  } catch (err) {
    console.error('DELETE /user/:id failed', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  changePassword,
  deleteUser,
};

