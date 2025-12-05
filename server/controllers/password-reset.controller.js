const UserModel = require('../src/models/user');
const resetCodeService = require('../services/reset-code.service');
const emailService = require('../services/email.service');
const config = require('../config');

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });
  
  try {
    const user = await UserModel.findOne({ email });
    if (!user) return res.status(404).json({ error: 'No user with that email' });

    const { code, expires } = resetCodeService.createCode(email);

    const emailResult = await emailService.sendPasswordResetEmail(email, code, req.hostname);
    
    if (!emailResult.sent) {
      if (config.NODE_ENV !== 'production') {
        return res.json({ ok: true, message: 'Code generated (email not sent in dev)', devCode: code });
      }
      return res.json({ ok: true, message: 'Code generated (email not sent in dev)' });
    }
    
    return res.json({ ok: true });
  } catch (err) {
    console.error('Error in /forgot', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

const verifyCode = async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: 'Missing params' });
  
  const entry = resetCodeService.getCode(email);
  if (!entry) return res.status(400).json({ error: 'No code for this email' });
  if (Date.now() > entry.expires) return res.status(400).json({ error: 'Code expired' });
  if (entry.code !== String(code)) return res.status(400).json({ error: 'Invalid code' });
  
  const isValid = resetCodeService.validateCode(email, code);
  if (!isValid) return res.status(400).json({ error: 'Invalid code' });
  
  return res.json({ ok: true });
};

const resetPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) return res.status(400).json({ error: 'Missing params' });
  
  const isValid = resetCodeService.verifyCode(email, code);
  if (!isValid) {
    const entry = resetCodeService.getCode(email);
    if (!entry) return res.status(400).json({ error: 'No code for this email' });
    if (Date.now() > entry.expires) return res.status(400).json({ error: 'Code expired' });
    if (entry.code !== String(code)) return res.status(400).json({ error: 'Invalid code' });
    return res.status(400).json({ error: 'Code not verified' });
  }

  try {
    const user = await UserModel.findOne({ email });
    if (!user) return res.status(404).json({ error: 'No user with that email' });
    user.password = newPassword;
    await user.save();
    resetCodeService.deleteCode(email);
    return res.json({ ok: true });
  } catch (err) {
    console.error('Error in /reset-password', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  forgotPassword,
  verifyCode,
  resetPassword,
};

