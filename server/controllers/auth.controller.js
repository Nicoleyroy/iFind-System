const UserModel = require('../src/models/user');
const SystemSettings = require('../src/models/systemSettings');
const { OAuth2Client, oauth2Client, GOOGLE_CLIENT_ID } = require('../config/oauth');

const register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please fill out all required fields.' });
  }

  // Check if registration is allowed
  try {
    const settings = await SystemSettings.getSettings();
    if (settings && !settings.allowRegistration) {
      return res.status(403).json({ message: 'Registration is currently disabled.' });
    }
  } catch (err) {
    console.error('Error checking system settings:', err);
    // Continue with registration if settings check fails
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const emailPattern = /^\S+@\S+\.\S+$/;
  if (!emailPattern.test(normalizedEmail)) {
    return res.status(400).json({ message: 'Please enter a valid email address.' });
  }

  if (String(password).length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }
  
  try {
    const existingUser = await UserModel.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'This email address is already associated with an account.' });
    }
    
    const user = await UserModel.create({ name, email: normalizedEmail, password });
    res.json({ data: user, message: 'Account Created Successfully!' });
  } catch(err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'This email address is already associated with an account.' });
    }
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message).join(', ');
      return res.status(400).json({ message: errors });
    }
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Please fill out all required fields.' });
  }
  try {
    // Check maintenance mode
    const settings = await SystemSettings.getSettings();
    if (settings && settings.maintenanceMode) {
      // Allow admin and moderator to login during maintenance
      const normalizedEmail = String(email).toLowerCase().trim();
      const user = await UserModel.findOne({ email: normalizedEmail });
      if (!user || !['admin', 'moderator'].includes(user.role)) {
        return res.status(503).json({ 
          message: 'System is currently under maintenance. Please try again later.',
          maintenanceMode: true
        });
      }
    }
    
    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await UserModel.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const status = String(user.accountStatus || '').toLowerCase();
    if (['disabled', 'suspended', 'blocked', 'banned'].includes(status)) {
      return res.status(403).json({ message: 'Account is disabled. Contact admin.' });
    }
    
    // Check if user has a password (not Google-only account)
    if (!user.password) {
      return res.status(401).json({ message: 'Please login with Google', googleOnly: true });
    }
    
    // Compare password using bcrypt
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      if (['admin', 'moderator'].includes(user.role)) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      return res.status(401).json({ message: 'Incorrect password. Please try again.' });
    }
    
    res.json({ message: 'Login successful', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const verifyGoogleToken = async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: 'Invalid Google Account' });
  
  try {
    if (!GOOGLE_CLIENT_ID) return res.status(500).json({ error: 'Invalid Google Account' });
    if (!OAuth2Client) return res.status(501).json({ error: 'Invalid Google Account' });
    
    const client = new OAuth2Client(GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    
    const { sub: googleId, email, name, picture } = payload;
    
    if (!email) {
      return res.status(400).json({ error: 'Invalid Google Account' });
    }
    
    let user = await UserModel.findOne({ email: email.toLowerCase().trim() });
    
    // Check maintenance mode for existing users
    const settings = await SystemSettings.getSettings();
    if (settings && settings.maintenanceMode) {
      if (user && !['admin', 'moderator'].includes(user.role)) {
        return res.status(503).json({ 
          error: 'System is currently under maintenance. Please try again later.',
          maintenanceMode: true
        });
      }
    }
    
    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        if (!user.profilePicture && picture) {
          user.profilePicture = picture;
        }
        await user.save();
      }
      const userObj = user.toObject();
      delete userObj.password;
      return res.json({ ok: true, user: userObj, message: 'Account linked successfully' });
    } else {
      user = await UserModel.create({
        name: name || 'Google User',
        email: email.toLowerCase().trim(),
        googleId: googleId,
        profilePicture: picture || null,
      });
      
      const userObj = user.toObject();
      delete userObj.password;
      return res.json({ ok: true, user: userObj, message: 'Account created successfully' });
    }
  } catch (err) {
    console.error('Failed to verify Google credential', err);
    
    if (err.code === 11000 && err.keyPattern?.googleId) {
      return res.status(400).json({ error: 'This Google account is already linked to another user' });
    }
    
    return res.status(400).json({ error: 'Invalid Google Account', details: err.message });
  }
};

const exchangeGoogleCode = async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Invalid Google Account' });

  try {
    const r = await oauth2Client.getToken({ code, redirect_uri: 'postmessage' });
    const { id_token } = r.tokens;

    if (!id_token) return res.status(400).json({ error: 'Invalid Google Account' });

    const client = new OAuth2Client(GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await UserModel.findOne({ email });
    
    // Check maintenance mode for existing users
    const settings = await SystemSettings.getSettings();
    if (settings && settings.maintenanceMode) {
      if (user && !['admin', 'moderator'].includes(user.role)) {
        return res.status(503).json({ 
          error: 'System is currently under maintenance. Please try again later.',
          maintenanceMode: true
        });
      }
    }
    
    if (!user) {
      user = await UserModel.create({
        name,
        email,
        googleId,
        profilePicture: picture,
      });
    }

    const userObj = user.toObject();
    delete userObj.password;

    res.json({ ok: true, user: userObj, message: 'Google login successful' });
  } catch (err) {
    console.error('Error exchanging Google code:', err);
    res.status(400).json({ error: 'Invalid Google Account', details: err.message });
  }
};
const exchangeGoogleCodeGet = async (req, res) =>{
   const { code } = req.query;
  if (!code) return res.status(400).json({ error: 'Missing code' });

  try {
    const r = await oauth2Client.getToken({
      code,
      redirect_uri: 'http://localhost:4000/auth/google/code', // must match your Google Console redirect
    });

    const { id_token } = r.tokens;
    const client = new OAuth2Client(GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await UserModel.findOne({ email });
    if (!user) {
      user = await UserModel.create({
        name,
        email,
        googleId,
        profilePicture: picture,
      });
    }

    res.json({ ok: true, user, message: 'Google login successful' });
  } catch (err) {
    console.error('Error exchanging code:', err);
    res.status(400).json({ error: 'Code exchange failed', details: err.message });
  }
};


module.exports = {
  register,
  login,
  verifyGoogleToken,
  exchangeGoogleCode,
  exchangeGoogleCodeGet
};

