const request = require('supertest');
const app = require('../app');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

describe('Testy autoryzacji', () => {
  let testToken;

  beforeAll(async () => {
    // Rejestracja użytkownika testowego
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@test.pl',
        password: 'test123',
      });

    // Logowanie i pobranie tokena
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'test123' });

    testToken = res.body.token;
  });

  it('Rejestracja nowego użytkownika → 201', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'newuser',
        email: 'new@test.pl',
        password: 'newpass123',
      });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.username).toBe('newuser');
  });

  it('Logowanie zwraca token i cookie', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'test123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('Dostęp do /api/tasks z tokenem', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('Dostęp do /api/tasks bez tokena → 401', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(401);
  });

  it('Duplikat username → 409', async () => {
    // Najpierw zarejestruj użytkownika
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'duplikat',
        email: 'duplikat1@test.pl',
        password: 'test123',
      });

    // Próba ponownej rejestracji z tym samym username
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'duplikat',
        email: 'duplikat2@test.pl',
        password: 'test123',
      });

    expect(res.status).toBe(409); // ← ZMIENIONE z 400 na 409
    expect(res.body.message || res.body.fieldErrors?.[0]?.message).toMatch(/zajęta|DUPLICATE/i);
  });

  it('Hasło za krótkie → 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'shortpass',
        email: 'short@test.pl',
        password: '123', // za krótkie
      });

    expect(res.status).toBe(400);
    // Sprawdź message lub fieldErrors
    const errorMsg = res.body.message || res.body.fieldErrors?.[0]?.message || '';
    expect(errorMsg).toMatch(/min|6|krótkie/i);
  });
});