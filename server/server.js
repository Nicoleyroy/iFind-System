const express = require('express');
const cors = require('cors');
const connectToDB = require('./mongodb');
const UserModel = require('./src/models/user');

const app = express();
const PORT = 5000;

// connect to MongoDB
connectToDB();

// middlewares
app.use(cors());
app.use(express.json());

// REGISTER
app.post('/user', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Body input is invalid' });
    }

    // check if email already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const user = await UserModel.create({ name, email, password });

    res.status(201).json({ data: user, message: 'User created successfully' });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// LOGIN
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    res.json({ message: 'Login successful', user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// START SERVER
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
