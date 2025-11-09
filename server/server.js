require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

let OAuth2Client = null;
try {
  OAuth2Client = require('google-auth-library').OAuth2Client;
} catch (err) {
  console.warn('google-auth-library not installed. Google OAuth endpoints will be disabled until you run `npm install`.');
}

let nodemailer = null;
try {
  nodemailer = require('nodemailer');
} catch (err) {
  console.warn('nodemailer not installed. Email sending will be disabled until you run `npm install`.');
}

const app = express();
const server = http.createServer(app);

// ✅ Create Socket.IO instance
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const connectToDB = require('./mongodb');
const UserModel = require('./src/models/user');
const ItemModel = require('./src/models/item');
connectToDB();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ extended: true }));



// ===== SOCKET.IO CONNECTION =====
io.on("connection", (socket) => {
  console.log("🟢 A client connected:", socket.id);
  socket.on("disconnect", () => console.log("🔴 Client disconnected:", socket.id));
});

// Utility: broadcast latest users
async function emitUsersUpdate() {
  try {
    const users = await UserModel.find().sort({ createdAt: -1 }).lean();
    io.emit("usersUpdated", users);
  } catch (err) {
    console.error("Error emitting users update:", err.message);
  }
}

// ========================== ROUTES ==========================

// Create User
app.post('/user', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'body input is invalid' });
  }
  try {
    const user = await UserModel.create({ name, email, password });
    await emitUsersUpdate(); // 🔄 notify clients
    res.json({ data: user, message: 'User created' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Items API
app.post('/items', async (req, res) => {
  try {
    const { name, location, date, contactInfo, description, type, imageUrl } = req.body || {};
    if (!name || !type || !['lost', 'found'].includes(type)) {
      return res.status(400).json({ message: 'Missing or invalid fields' });
    }
    let parsedDate;
    if (date) {
      const d = new Date(date);
      if (!isNaN(d.getTime())) parsedDate = d;
    }
    const item = await ItemModel.create({
      name,
      location,
      date: parsedDate,
      contactInfo,
      description,
      type,
      imageUrl,
    });
    return res.json({ data: item });
  } catch (err) {
    console.error('POST /items failed', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.get('/items', async (req, res) => {
  try {
    const { type } = req.query;
    const filter = {};
    if (type && ['lost', 'found'].includes(type)) filter.type = type;
    const items = await ItemModel.find(filter).sort({ createdAt: -1 }).lean();
    return res.json({ data: items });
  } catch (err) {
    console.error('GET /items failed', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }
  try {
    const user = await UserModel.findOne({ email, password });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    res.json({ message: 'Login successful', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ====================== ADMIN ROUTES ======================

// Get all users
app.get('/users', async (req, res) => {
  try {
    const users = await UserModel.find().sort({ createdAt: -1 }).lean();
    res.json({ data: users });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update role
app.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) return res.status(400).json({ message: "Missing role" });

    const user = await UserModel.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });

    await emitUsersUpdate(); // notify clients
    res.json({ message: "Role updated", data: user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Update status
app.put('/users/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: "Missing status" });

    const user = await UserModel.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });

    await emitUsersUpdate(); // notify clients
    res.json({ message: "Status updated", data: user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Delete user
app.delete('/users/:id', async (req, res) => {
  try {
    const user = await UserModel.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await emitUsersUpdate(); // notify clients
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

app.put('/items/:id/resolve', async (req, res) => {
  try {
    const item = await ItemModel.findByIdAndUpdate(req.params.id, { status: "Resolved" }, { new: true });
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json({ message: "Item marked as resolved", data: item });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});


// ==========================================================

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
