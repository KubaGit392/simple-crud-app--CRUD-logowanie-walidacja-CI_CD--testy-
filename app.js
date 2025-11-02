const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { runMigrations, db } = require('./db');

const tasksRoutes = require('./entities/tasks/routes');
const usersRoutes = require('./entities/users/routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

runMigrations();

app.use('/api/tasks', tasksRoutes);
app.use('/api/users', usersRoutes);
// alias pod testy, jeśli używają /api/auth/*
app.use('/api/auth', usersRoutes);

app.get('/api/public/stats', (req, res) => {
  try {
    const row = db.prepare('SELECT COUNT(*) AS count FROM users').get();
    res.json({ users: row?.count ?? 0 });
  } catch (err) {
    console.error('Błąd /api/public/stats:', err);
    res.status(500).json({ users: 0 });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('/', (req, res) => {
  res.send('API działa!');
});

module.exports = app;