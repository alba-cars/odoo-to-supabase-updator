/**
 * Validates the X-API-Key header against the API_KEY environment variable.
 * Rejects with 401 if missing, 403 if incorrect.
 */
function requireApiKey(req, res, next) {
  const expectedKey = process.env.API_KEY;

  if (!expectedKey) {
    console.error('API_KEY environment variable is not set');
    return res.status(500).json({ error: 'Server misconfiguration: API_KEY not set' });
  }

  const providedKey = req.headers['x-api-key'];

  if (!providedKey) {
    return res.status(401).json({ error: 'Missing X-API-Key header' });
  }

  if (providedKey !== expectedKey) {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  next();
}

module.exports = { requireApiKey };
