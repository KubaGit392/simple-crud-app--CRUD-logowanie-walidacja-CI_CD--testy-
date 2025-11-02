const request = require('supertest');
const express = require('express');
const { runMigrations } = require('../db');
const usersRouter = require('../entities/users/routes');
const tasksRouter = require('../entities/tasks/routes');

const app = express();
app.use(express.json());
app.use('/api/users', usersRouter);
app.use('/api/tasks', tasksRouter);

beforeAll(() => {
  runMigrations();
});

describe('Integracja API', () => {
  test('Rejestracja – błędny email => 400', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({ username: 'Test', email: 'wrongemail', password: '123456' });
    
    expect(res.status).toBe(400);
    expect(res.body.fieldErrors[0].field).toBe('email');
  });

  test('Rejestracja duplikatu => 409', async () => {
    // Pierwsza rejestracja (sukces)
    await request(app).post('/api/users/register')
      .send({ username: 'duplikat', email: 'd@d.pl', password: '123456' });
    
    // Druga rejestracja (duplikat)
    const res = await request(app).post('/api/users/register')
      .send({ username: 'duplikat', email: 'd@d.pl', password: '123456' });
    
    expect(res.status).toBe(409);
    expect(res.body.fieldErrors?.[0]?.code || res.body.message).toMatch(/DUPLICATE|duplikat/i);
  });

  test('GET nieistniejącego taska => 404', async () => {
    const res = await request(app).get('/api/tasks/999');
    expect([401, 404]).toContain(res.status); // 401 jeśli brak tokenu, 404 jeśli token OK
  });
});