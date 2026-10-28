import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../src/app.js';
import prisma from '../src/lib/prisma.js';

// This suite exercises transaction, analytics, and ownership behavior through
// the public API rather than calling service functions directly.
let userToken = '';
let categoryId = '';
let transactionId = '';

describe('Finance flow', () => {
  beforeAll(async () => {
    await prisma.transaction.deleteMany();
    await prisma.budget.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();

    const authRes = await request(app)
      .post('/api/auth/register')
      .send({ email: 'finance@example.com', password: 'secret123' });

    userToken = authRes.body.token;

    const categoryRes = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Groceries', type: 'EXPENSE' });

    categoryId = categoryRes.body.id;
  });

  afterAll(async () => {
    await prisma.transaction.deleteMany();
    await prisma.budget.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it('creates a transaction and returns pagination metadata', async () => {
    const response = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        amount: 65.5,
        type: 'EXPENSE',
        categoryId,
        description: 'Weekly groceries',
        transactionDate: '2026-09-07',
      });

    expect(response.status).toBe(201);
    transactionId = response.body.id;

    const listResponse = await request(app)
      .get('/api/transactions?page=1&limit=10')
      .set('Authorization', `Bearer ${userToken}`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.pagination.total).toBeGreaterThan(0);
    expect(Array.isArray(listResponse.body.data)).toBe(true);
  });

  it('filters transactions by type and category', async () => {
    const response = await request(app)
      .get(`/api/transactions?type=EXPENSE&categoryId=${categoryId}&page=1&limit=10`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.every((item) => item.type === 'EXPENSE')).toBe(true);
    expect(response.body.data.every((item) => item.categoryId === categoryId)).toBe(true);
  });

  it('supports sorting transactions by amount', async () => {
    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        amount: 90,
        type: 'EXPENSE',
        categoryId,
        description: 'Premium grocery run',
        transactionDate: '2026-09-09',
      });

    const response = await request(app)
      .get('/api/transactions?sortBy=amount&sortOrder=desc&page=1&limit=10')
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(1);
    expect(Number(response.body.data[0].amount)).toBeGreaterThanOrEqual(Number(response.body.data[1].amount));
  });

  it('returns monthly analytics and budget status', async () => {
    await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ categoryId, month: 9, year: 2026, amount: 150 });

    const response = await request(app)
      .get('/api/analytics/monthly?year=2026&month=9')
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.month).toBe(9);
    expect(typeof response.body.income).toBe('number');
    expect(typeof response.body.expenses).toBe('number');
    expect(Array.isArray(response.body.byCategory)).toBe(true);
    expect(Array.isArray(response.body.budgetStatus)).toBe(true);
  });

  it('prevents users from altering another user category', async () => {
    const otherUser = await request(app)
      .post('/api/auth/register')
      .send({ email: 'finance2@example.com', password: 'secret123' });

    const otherCategory = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${otherUser.body.token}`)
      .send({ name: 'Rent', type: 'EXPENSE' });

    const response = await request(app)
      .patch(`/api/transactions/${transactionId}`)
      .set('Authorization', `Bearer ${otherUser.body.token}`)
      .send({ categoryId: otherCategory.body.id });

    expect(response.status).toBe(403);
  });
});
