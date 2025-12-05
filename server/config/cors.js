const cors = require('cors');
const config = require('./index');

const corsOptions = {
  origin: config.NODE_ENV === 'production' 
    ? process.env.CORS_ORIGIN || 'http://localhost:5173'
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};

module.exports = cors(corsOptions);

