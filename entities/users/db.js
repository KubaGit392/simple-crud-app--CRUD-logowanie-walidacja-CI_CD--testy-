// entities/users/db.js
const { db } = require('../../db');

// Statementy
const createUserStmt = db.prepare(
  'INSERT INTO users (username, email, password_hash, rola) VALUES (?, ?, ?, ?)'
);
const getUserByUsernameStmt = db.prepare('SELECT * FROM users WHERE username = ?');
const getUserByEmailStmt = db.prepare('SELECT * FROM users WHERE email = ?');
const getUserByIdStmt = db.prepare('SELECT * FROM users WHERE id = ?');

// Prosty blacklist (in-memory)
const blacklistedTokens = new Set();

module.exports = {
  createUser: (u) => {
    const info = createUserStmt.run(u.username, u.email, u.password_hash, u.rola || 'USER');
    return getUserByIdStmt.get(info.lastInsertRowid);
  },
  getUserByUsername: (username) => getUserByUsernameStmt.get(username),
  getUserByEmail: (email) => getUserByEmailStmt.get(email),
  getUserById: (id) => getUserByIdStmt.get(id),

  addTokenToBlacklist: (token) => { if (token) blacklistedTokens.add(token); },
  isTokenBlacklisted: (token) => blacklistedTokens.has(token),
};