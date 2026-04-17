require('dotenv').config();

const express = require('express');
const { log, getLogs, initDB } = require('./src/logger');
const { requireApiKey } = require('./src/auth');
const activitiesRouter = require('./routes/activities');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ------------------------------------------------------------
// Request logging middleware
// ------------------------------------------------------------
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    log({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration_ms: Date.now() - start,
      body: req.method !== 'GET' ? req.body : undefined,
      error: res.statusCode >= 400 ? res.locals.errorMessage : undefined,
    }).catch(console.error);
  });

  next();
});

// ------------------------------------------------------------
// Routes
// ------------------------------------------------------------
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/activities', requireApiKey, activitiesRouter);
app.get('/logs', requireApiKey, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 100, 500);
  const since = req.query.since; // ISO datetime string
  const entries = await getLogs({ limit, since });
  res.json({ count: entries.length, logs: entries });
});

// ------------------------------------------------------------
// Error handler
// ------------------------------------------------------------
app.use((err, req, res, _next) => {
  console.error(err);
  res.locals.errorMessage = err.message;
  res.status(500).json({ error: 'Internal server error' });
});

// ------------------------------------------------------------
// Start
// ------------------------------------------------------------
initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Activities API listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialise database:', err);
    process.exit(1);
  });
