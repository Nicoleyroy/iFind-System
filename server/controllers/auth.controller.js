const UserModel = require('../src/models/user');
const { OAuth2Client, oauth2Client, GOOGLE_CLIENT_ID } = require('../config/oauth');

const register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }
  
  try {
    const existingUser = await UserModel.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    
    const user = await UserModel.create({ name, email, password });
    res.json({ data: user, message: 'User created successfully' });
  } catch(err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email already registered' });
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
    return res.status(400).json({ message: 'Email and password required' });
  }
  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Check if user has a password (not Google-only account)
    if (!user.password) {
      return res.status(401).json({ message: 'Please login with Google' });
    }
    
    // Compare password using bcrypt
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    res.json({ message: 'Login successful', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const verifyGoogleToken = async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: 'Missing credential (id_token)' });
  
  try {
    if (!GOOGLE_CLIENT_ID) return res.status(500).json({ error: 'Server GOOGLE_CLIENT_ID not set' });
    if (!OAuth2Client) return res.status(501).json({ error: 'Server missing google-auth-library dependency' });
    
    const client = new OAuth2Client(GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    
    const { sub: googleId, email, name, picture } = payload;
    
    if (!email) {
      return res.status(400).json({ error: 'Email not provided by Google' });
    }
    
    let user = await UserModel.findOne({ email: email.toLowerCase().trim() });
    
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
    
    return res.status(400).json({ error: 'Invalid Google credential', details: err.message });
  }
};

const exchangeGoogleCode = async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Missing code' });

  try {
    const r = await oauth2Client.getToken({ code, redirect_uri: 'postmessage' });
    const { id_token } = r.tokens;

    if (!id_token) return res.status(400).json({ error: 'No ID token received from Google' });

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

    const userObj = user.toObject();
    delete userObj.password;

    res.json({ ok: true, user: userObj, message: 'Google login successful' });
  } catch (err) {
    console.error('Error exchanging Google code:', err);
    res.status(400).json({ error: 'Code exchange failed', details: err.message });
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

