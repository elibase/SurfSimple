const SHARED_SECRET = process.env.SHARED_SECRET;

module.exports = function auth(req, res, next) {
  if (!SHARED_SECRET) {
    console.error('SHARED_SECRET env var is not set');
    return res.status(500).json({ error: 'Server misconfigured — contact support.' });
  }

  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (token !== SHARED_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
};
