const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const USERS_PATH = path.join(__dirname, '..', 'data', 'users.json');
const HISTORY_PATH = path.join(__dirname, '..', 'data', 'history.json');
const OVERRIDES_PATH = path.join(__dirname, '..', 'data', 'statsOverrides.json');
const ADMIN_PASSWORD = 'administrator';
const GUEST_NAME = 'ゲスト';

function authMiddleware(req, res, next) {
  const password = req.headers['x-admin-password'];
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

function loadUsers() {
  try {
    return JSON.parse(fs.readFileSync(USERS_PATH, 'utf-8'));
  } catch {
    return [];
  }
}

function saveUsers(users) {
  fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
}

function loadHistory() {
  try {
    return JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf-8'));
  } catch {
    return [];
  }
}

function loadOverrides() {
  try {
    return JSON.parse(fs.readFileSync(OVERRIDES_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

function saveOverrides(overrides) {
  fs.writeFileSync(OVERRIDES_PATH, JSON.stringify(overrides, null, 2));
}

router.get('/users', (req, res) => {
  res.json(loadUsers());
});

router.post('/users', authMiddleware, (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Invalid name' });
  }
  const users = loadUsers();
  const trimmed = name.trim();
  if (users.includes(trimmed)) {
    return res.status(409).json({ error: 'User already exists' });
  }
  users.push(trimmed);
  saveUsers(users);
  res.json({ success: true, users });
});

router.delete('/users/:name', authMiddleware, (req, res) => {
  const users = loadUsers();
  const filtered = users.filter(u => u !== req.params.name);
  if (filtered.length === users.length) {
    return res.status(404).json({ error: 'User not found' });
  }
  saveUsers(filtered);
  res.json({ success: true, users: filtered });
});

router.get('/history', (req, res) => {
  res.json(loadHistory());
});

router.get('/stats', (req, res) => {
  const history = loadHistory();
  const users = loadUsers();
  const overrides = loadOverrides();
  const stats = {};

  for (const user of users) {
    if (user === GUEST_NAME) continue;
    const ov = overrides[user] || { wins: 0, losses: 0, draws: 0 };
    stats[user] = { wins: ov.wins, losses: ov.losses, draws: ov.draws, games: ov.wins + ov.losses + ov.draws, opponents: {} };
  }

  for (const game of history) {
    const { blackPlayer, whitePlayer, winnerName, loserName } = game;

    // Skip games involving guest
    if (blackPlayer === GUEST_NAME || whitePlayer === GUEST_NAME) continue;

    for (const player of [blackPlayer, whitePlayer]) {
      if (!stats[player]) {
        const ov = overrides[player] || { wins: 0, losses: 0, draws: 0 };
        stats[player] = { wins: ov.wins, losses: ov.losses, draws: ov.draws, games: ov.wins + ov.losses + ov.draws, opponents: {} };
      }
    }

    stats[blackPlayer].games++;
    stats[whitePlayer].games++;

    if (!winnerName) {
      stats[blackPlayer].draws++;
      stats[whitePlayer].draws++;
    } else {
      stats[winnerName].wins++;
      stats[loserName].losses++;
    }

    // Head-to-head
    if (!stats[blackPlayer].opponents[whitePlayer]) {
      stats[blackPlayer].opponents[whitePlayer] = { wins: 0, losses: 0, draws: 0 };
    }
    if (!stats[whitePlayer].opponents[blackPlayer]) {
      stats[whitePlayer].opponents[blackPlayer] = { wins: 0, losses: 0, draws: 0 };
    }

    if (!winnerName) {
      stats[blackPlayer].opponents[whitePlayer].draws++;
      stats[whitePlayer].opponents[blackPlayer].draws++;
    } else {
      stats[winnerName].opponents[loserName].wins++;
      stats[loserName].opponents[winnerName].losses++;
    }
  }

  res.json(stats);
});

router.put('/stats/:name', authMiddleware, (req, res) => {
  const { name } = req.params;
  const { wins, losses, draws } = req.body;
  if (typeof wins !== 'number' || typeof losses !== 'number' || typeof draws !== 'number') {
    return res.status(400).json({ error: 'wins, losses, draws must be numbers' });
  }
  const overrides = loadOverrides();
  overrides[name] = { wins, losses, draws };
  saveOverrides(overrides);
  res.json({ success: true });
});

router.post('/stats/reset', authMiddleware, (req, res) => {
  fs.writeFileSync(HISTORY_PATH, JSON.stringify([], null, 2));
  res.json({ success: true });
});

module.exports = { router, loadHistory, HISTORY_PATH, GUEST_NAME };
