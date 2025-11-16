const cors = require('cors');
const config = require('./index');

const corsOptions = {
  origin: config.NODE_ENV === 'production' 
    ? process.env.CORS_ORIGIN || '*' 
    : '*',
  credentials: true,
  optionsSuccessStatus: 200
};

module.exports = cors(corsOptions);

