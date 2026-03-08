const cors = require('cors');

const productionOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : [];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Render health checks)
    if (!origin) return callback(null, true);
    // Allow localhost for development
    if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return callback(null, true);
    // Allow all Vercel deployments (production + preview)
    if (/\.vercel\.app$/.test(origin)) return callback(null, true);
    // Allow any explicitly listed origins from env var
    if (productionOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200
};

module.exports = cors(corsOptions);

