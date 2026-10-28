import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../src/app.js';
import prisma from '../src/lib/prisma.js';

// These integration tests send real HTTP requests through Express and use the
// database, so they verify the complete auth route -> service -> repository flow.
describe('Auth API', () => {
  beforeAll(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it('registers a user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'user1@example.com', password: 'secret123' });

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe('user1@example.com');
  });

  it('rejects duplicate emails', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'user1@example.com', password: 'secret123' });

    expect(response.status).toBe(409);
  });

  it('logs in a valid user', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user1@example.com', password: 'secret123' });

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe('user1@example.com');
    expect(response.body.token).toBeTruthy();
  });

  it('rejects invalid password', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user1@example.com', password: 'wrongpass' });

    expect(response.status).toBe(401);
  });

  it('rejects protected route without token', async () => {
    const response = await request(app).get('/api/auth/me');
    expect(response.status).toBe(401);
  });
});
