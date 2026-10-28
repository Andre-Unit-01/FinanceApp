/*
 * Monthly dashboard calculations.
 *
 * The repository returns raw sums and grouped rows. This service combines
 * them into the response shape consumed by DashboardPage, including net
 * balance and budget status for the selected UTC calendar month.
 */
import { sumTransactions, groupExpensesByCategory, findCategories, findBudgetsForMonth } from '../repositories/analyticsRepository.js';

export const getMonthlyAnalytics = async (userId, year, month) => {
  const targetYear = Number(year || new Date().getFullYear());
  const targetMonth = Number(month || new Date().getMonth() + 1);
  const start = new Date(Date.UTC(targetYear, targetMonth - 1, 1));
  const end = new Date(Date.UTC(targetYear, targetMonth, 0, 23, 59, 59, 999));

  // Income and expenses are separate queries because they have opposite
  // meanings: income increases cash flow, while expenses reduce it.
  const [income, expenses, byCategory, budgets] = await Promise.all([
    sumTransactions({ userId, type: 'INCOME', transactionDate: { gte: start, lte: end } }),
    sumTransactions({ userId, type: 'EXPENSE', transactionDate: { gte: start, lte: end } }),
    groupExpensesByCategory({ userId, type: 'EXPENSE', transactionDate: { gte: start, lte: end } }),
    findBudgetsForMonth(userId, targetMonth, targetYear),
  ]);

  const categoryMap = await findCategories(userId);

  const categoryLookup = Object.fromEntries(categoryMap.map((c) => [c.id, c.name]));
  const byCategoryRows = await Promise.all(
    byCategory.map(async (item) => ({
      categoryId: item.categoryId,
      category: categoryLookup[item.categoryId] || 'Unknown',
      amount: Number(item._sum.amount || 0),
    })),
  );

  const budgetStatus = budgets.map((budget) => {
    const spent = byCategoryRows.find((row) => row.categoryId === budget.categoryId)?.amount || 0;
    const budgetAmount = Number(budget.amount);
    const remaining = budgetAmount - spent;
    return {
      category: categoryLookup[budget.categoryId] || 'Unknown',
      budget: budgetAmount,
      spent,
      remaining,
      percentageUsed: budgetAmount > 0 ? Math.round((spent / budgetAmount) * 100) : 0,
    };
  });

  return {
    year: targetYear,
    month: targetMonth,
    income: Number(income._sum.amount || 0),
    expenses: Number(expenses._sum.amount || 0),
    net: Number(income._sum.amount || 0) - Number(expenses._sum.amount || 0),
    byCategory: byCategoryRows,
    budgetStatus,
  };
};
