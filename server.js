const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const sessions = new Map();

app.use(cors());
app.use(express.json({ limit: '3mb' }));
app.use(express.static('public'));

function makeId() { return crypto.randomBytes(5).toString('hex'); }

app.post('/api/generate-link', (req, res) => {
  const id = makeId();
  sessions.set(id, {
    id,
    createdAt: new Date().toISOString(),
    status: 'Waiting for recipient',
    ip: null,
    location: null,
    camera: 'Not requested',
    snapshot: null,
    consent: false,
    lastUpdated: null
  });
  const base = `${req.protocol}://${req.get('host')}`;
  res.json({ id, link: `${base}/r/${id}` });
});

app.post('/api/consent/:id', (req, res) => {
  const s = sessions.get(req.params.id);
  if (!s) return res.status(404).json({ error: 'Session not found' });
  const { locationAllowed = false, cameraAllowed = false } = req.body || {};
  s.consent = true;
  s.ip = req.ip || req.socket.remoteAddress || 'Unavailable';
  s.location = locationAllowed && req.body.location ? req.body.location : null;
  s.camera = cameraAllowed ? 'Access Granted (local preview only)' : 'Denied / Not granted';
  s.status = 'Information received with consent';
  s.lastUpdated = new Date().toISOString();
  res.json({ ok: true });
});


app.post('/api/snapshot/:id', (req, res) => {
  const s = sessions.get(req.params.id);
  if (!s) return res.status(404).json({ error: 'Session not found' });
  if (s.camera !== 'Access Granted (local preview only)') return res.status(403).json({ error: 'Camera permission not granted' });
  const image = req.body && req.body.image;
  if (typeof image !== 'string' || !image.startsWith('data:image/jpeg;base64,')) return res.status(400).json({ error: 'Invalid snapshot' });
  if (image.length > 2_500_000) return res.status(413).json({ error: 'Snapshot too large' });
  s.snapshot = image;
  s.camera = 'Access Granted + Snapshot submitted';
  s.lastUpdated = new Date().toISOString();
  res.json({ ok: true });
});

app.get('/api/session/:id', (req, res) => {
  const s = sessions.get(req.params.id);
  if (!s) return res.status(404).json({ error: 'Session not found' });
  res.json(s);
});

app.get('/api/sessions', (req, res) => {
  res.json(Array.from(sessions.values()).sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt)));
});

app.get('/r/:id', (req, res) => res.sendFile(__dirname + '/public/recipient.html'));
app.get('/dashboard', (req, res) => res.sendFile(__dirname + '/public/dashboard.html'));

app.listen(PORT, () => console.log(`Consent Information Gathering Demo running at http://localhost:${PORT}`));
