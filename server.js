// server.js
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const { runMigrations, db } = require('./db');

runMigrations();

const tasksRouter = require('./entities/tasks/routes');
const usersRouter = require('./entities/users/routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/tasks', tasksRouter);
app.use('/api/users', usersRouter);

// Publiczny endpoint do statystyk
app.get('/api/public/stats', (req, res) => {
  const count = db.prepare('SELECT COUNT(*) as count FROM users').get();
  res.json({ users: count.count });
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`);
});