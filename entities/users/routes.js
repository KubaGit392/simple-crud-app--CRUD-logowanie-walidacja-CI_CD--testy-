const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { authMiddleware, JWT_SECRET } = require('../../middleware/auth');
const {
  createUser,
  getUserByUsername,
  getUserByEmail,
  getUserById,
  addTokenToBlacklist,
  isTokenBlacklisted,
} = require('./db');
const { errorResponse } = require('../../utils/validation');

const router = express.Router();

// Pobieranie tokenu z cookie lub Bearer
function getTokenFromReq(req) {
  const bearer = req.headers.authorization || '';
  const headerToken = bearer.startsWith('Bearer ') ? bearer.slice(7) : null;
  const cookieToken = req.cookies?.token || null;
  return cookieToken || headerToken || null;
}

// POST /api/users/register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body || {};

  if (!username || typeof username !== 'string' || username.length < 3 || username.length > 50) {
    return res.status(400).json(errorResponse(400, [{
      field: 'username',
      code: 'INVALID_LENGTH',
      message: 'Nazwa użytkownika musi mieć 3-50 znaków'
    }]));
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json(errorResponse(400, [{
      field: 'email',
      code: 'INVALID_FORMAT',
      message: 'Niepoprawny format adresu email'
    }]));
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json(errorResponse(400, [{
      field: 'password',
      code: 'INVALID_LENGTH',
      message: 'Hasło musi mieć minimum 6 znaków'
    }]));
  }

  try {
    const existingUsername = getUserByUsername(username);
    if (existingUsername) {
      return res.status(409).json(errorResponse(409, [{
        field: 'username',
        code: 'DUPLICATE',
        message: 'Nazwa użytkownika jest już zajęta'
      }]));
    }

    const existingEmail = getUserByEmail(email);
    if (existingEmail) {
      return res.status(409).json(errorResponse(409, [{
        field: 'email',
        code: 'DUPLICATE',
        message: 'Email jest już zarejestrowany'
      }]));
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = createUser({
      username,
      email,
      password_hash: passwordHash,
      rola: 'USER'
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        rola: user.rola
      },
      token
    });
  } catch (err) {
    console.error('Błąd rejestracji:', err);
    if (String(err.message).includes('UNIQUE') ||
        String(err.code) === 'SQLITE_CONSTRAINT' ||
        String(err.message).includes('CONSTRAINT')) {
      return res.status(409).json(errorResponse(409, [], 'Duplikat danych - użytkownik już istnieje'));
    }
    return res.status(500).json(errorResponse(500, [], 'Błąd serwera'));
  }
});

// POST /api/users/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json(errorResponse(400, [], 'Podaj nazwę użytkownika i hasło'));
  }

  try {
    const user = getUserByUsername(username);
    if (!user) {
      return res.status(401).json(errorResponse(401, [], 'Nieprawidłowe dane logowania'));
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json(errorResponse(401, [], 'Nieprawidłowe dane logowania'));
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        rola: user.rola
      },
      token
    });
  } catch (err) {
    console.error('Błąd logowania:', err);
    return res.status(500).json(errorResponse(500, [], 'Błąd serwera'));
  }
});

// POST /api/users/logout
router.post('/logout', authMiddleware, (req, res) => {
  try {
    const token = getTokenFromReq(req);
    if (token) addTokenToBlacklist(token);
    res.clearCookie('token');
    return res.json({ message: 'Wylogowano pomyślnie' });
  } catch (err) {
    console.error('Błąd wylogowania:', err);
    return res.status(500).json(errorResponse(500, [], 'Błąd serwera'));
  }
});

// GET /api/users/me
router.get('/me', authMiddleware, (req, res) => {
  try {
    const token = getTokenFromReq(req);
    if (token && isTokenBlacklisted(token)) {
      return res.status(401).json(errorResponse(401, [], 'Sesja wygasła'));
    }

    const user = getUserById(req.userId);
    if (!user) {
      return res.status(404).json(errorResponse(404, [], 'Użytkownik nie znaleziony'));
    }

    return res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      rola: user.rola
    });
  } catch (err) {
    console.error('Błąd pobierania użytkownika:', err);
    return res.status(500).json(errorResponse(500, [], 'Błąd serwera'));
  }
});

module.exports = router;