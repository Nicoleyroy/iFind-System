const cors = require('cors');
const config = require('./index');

const allowedOrigins = config.NODE_ENV === 'production'
  ? (process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()) : [])
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'];

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  optionsSuccessStatus: 200
};

module.exports = cors(corsOptions);

