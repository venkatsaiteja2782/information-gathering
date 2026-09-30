// Render deployment update

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const sessions = new Map();

app.use(cors());
app.use(express.json({ limit: '3mb' }));
app.use(express.static('public'));

function makeId() {
  return crypto.randomBytes(5).toString('hex');
}

app.post('/api/generate-link', (req, res) => {
  const id = makeId();

  sessions.set(id, {
    id: id,
    createdAt: new Date().toISOString(),
    status: 'Waiting for recipient',
    ip: null,
    location: null,
    camera: 'Not requested',
    snapshot: null,
    consent: false,
    lastUpdated: null
  });

  // No backticks used here
  const base = req.protocol + '://' + req.get('host');

  res.json({
    id: id,
    link: base + '/r/' + id
  });
});

app.post('/api/consent/:id', (req, res) => {
  const s = sessions.get(req.params.id);

  if (!s) {
    return res.status(404).json({
      error: 'Session not found'
    });
  }

  const locationAllowed = req.body.locationAllowed || false;
  const cameraAllowed = req.body.cameraAllowed || false;

  s.consent = true;
  s.ip = req.ip || req.socket.remoteAddress || 'Unavailable';

  if (locationAllowed && req.body.location) {
    s.location = req.body.location;
  } else {
    s.location = null;
  }

  if (cameraAllowed) {
    s.camera = 'Access Granted (local preview only)';
  } else {
    s.camera = 'Denied / Not granted';
  }

  s.status = 'Information received with consent';
  s.lastUpdated = new Date().toISOString();

  res.json({
    ok: true
  });
});

app.post('/api/snapshot/:id', (req, res) => {
  const s = sessions.get(req.params.id);

  if (!s) {
    return res.status(404).json({
      error: 'Session not found'
    });
  }

  if (s.camera !== 'Access Granted (local preview only)') {
    return res.status(403).json({
      error: 'Camera permission not granted'
    });
  }

  const image = req.body && req.body.image;

  if (
    typeof image !== 'string' ||
    !image.startsWith('data:image/jpeg;base64,')
  ) {
    return res.status(400).json({
      error: 'Invalid snapshot'
    });
  }

  if (image.length > 2500000) {
    return res.status(413).json({
      error: 'Snapshot too large'
    });
  }

  s.snapshot = image;
  s.camera = 'Access Granted + Snapshot submitted';
  s.lastUpdated = new Date().toISOString();

  res.json({
    ok: true
  });
});

app.get('/api/session/:id', (req, res) => {
  const s = sessions.get(req.params.id);

  if (!s) {
    return res.status(404).json({
      error: 'Session not found'
    });
  }

  res.json(s);
});

app.get('/api/sessions', (req, res) => {
  const result = Array.from(sessions.values()).sort(function(a, b) {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  res.json(result);
});

app.get('/r/:id', (req, res) => {
  res.sendFile(__dirname + '/public/recipient.html');
});

app.get('/dashboard', (req, res) => {
  res.sendFile(__dirname + '/public/dashboard.html');
});

app.listen(PORT, '0.0.0.0', function() {
  console.log(
    'Consent Information Gathering Demo running on port ' + PORT
  );
});
