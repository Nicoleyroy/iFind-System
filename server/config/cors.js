const cors = require('cors');
const config = require('./index');

const productionOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : [];

const corsOptions = {
  origin: config.NODE_ENV === 'production'
    ? (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        // Allow production origins from env var
        if (productionOrigins.includes(origin)) return callback(null, true);
        // Allow all Vercel preview deployments
        if (/\.vercel\.app$/.test(origin)) return callback(null, true);
        callback(new Error('Not allowed by CORS'));
      }
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};

module.exports = cors(corsOptions);

