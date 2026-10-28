import prisma from '../src/lib/prisma.js';

// Seed provides business-oriented sample data so a new workspace immediately
// demonstrates revenue, operating expenses, cash flow, and budget tracking.
// WARNING: this script clears existing users and finance records in this DB.
const passwordHash = '$2b$12$2afB.UZZrtsHmwEk2gjUSeVaPZ0UurxRKBQ7w82raD6cTrmyfhu/C';

function dateInCurrentMonth(day) {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return new Date(now.getFullYear(), now.getMonth(), Math.min(day, lastDay), 12, 0, 0);
}

async function main() {
  await prisma.transaction.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const demo = await prisma.user.create({ data: { email: 'demo@example.com', passwordHash } });

  const categoryDefinitions = [
    ['Client projects', 'INCOME'],
    ['Retainer revenue', 'INCOME'],
    ['Product sales', 'INCOME'],
    ['Payroll & contractors', 'EXPENSE'],
    ['Office rent', 'EXPENSE'],
    ['Software & cloud', 'EXPENSE'],
    ['Marketing', 'EXPENSE'],
    ['Professional services', 'EXPENSE'],
    ['Insurance', 'EXPENSE'],
    ['Travel & mileage', 'EXPENSE'],
    ['Taxes & fees', 'EXPENSE'],
    ['Office supplies', 'EXPENSE'],
  ];
  const categoryRows = await Promise.all(categoryDefinitions.map(([name, type]) => prisma.category.create({ data: { userId: demo.id, name, type } })));
  const categoryIds = Object.fromEntries(categoryRows.map((category) => [category.name, category.id]));

  const transactions = [
    { day: 2, category: 'Office rent', amount: 1250, type: 'EXPENSE', description: 'Monthly studio rent' },
    { day: 3, category: 'Client projects', amount: 6200, type: 'INCOME', description: 'Website development milestone' },
    { day: 4, category: 'Software & cloud', amount: 214.75, type: 'EXPENSE', description: 'Cloud hosting and software tools' },
    { day: 7, category: 'Payroll & contractors', amount: 1850, type: 'EXPENSE', description: 'Contractor payment' },
    { day: 9, category: 'Retainer revenue', amount: 2400, type: 'INCOME', description: 'Monthly client retainer' },
    { day: 12, category: 'Marketing', amount: 385, type: 'EXPENSE', description: 'Digital marketing campaign' },
    { day: 15, category: 'Insurance', amount: 172.5, type: 'EXPENSE', description: 'Business insurance premium' },
    { day: 17, category: 'Professional services', amount: 325, type: 'EXPENSE', description: 'Bookkeeping and accounting' },
    { day: 19, category: 'Office supplies', amount: 86.4, type: 'EXPENSE', description: 'Workspace supplies' },
    { day: 22, category: 'Client projects', amount: 3200, type: 'INCOME', description: 'Product design delivery' },
    { day: 24, category: 'Travel & mileage', amount: 146.2, type: 'EXPENSE', description: 'Client meeting travel' },
    { day: 29, category: 'Taxes & fees', amount: 650, type: 'EXPENSE', description: 'Estimated tax set-aside' },
  ];

  await prisma.transaction.createMany({
    data: transactions.map((item) => ({
      userId: demo.id,
      categoryId: categoryIds[item.category],
      amount: item.amount,
      type: item.type,
      description: item.description,
      transactionDate: dateInCurrentMonth(item.day),
    })),
  });

  const currentDate = new Date();
  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();
  const allocations = [
    ['Payroll & contractors', 2500],
    ['Office rent', 1300],
    ['Software & cloud', 300],
    ['Marketing', 500],
    ['Professional services', 400],
    ['Insurance', 220],
    ['Travel & mileage', 250],
    ['Taxes & fees', 700],
    ['Office supplies', 160],
  ];

  await prisma.budget.createMany({
    data: allocations.map(([category, amount]) => ({ userId: demo.id, categoryId: categoryIds[category], month, year, amount })),
  });
  await prisma.monthlyBudget.create({
    data: { userId: demo.id, month, year, incomeTarget: 12500, savingsTarget: 1250 },
  });

  const secondDemo = await prisma.user.create({ data: { email: 'demo2@example.com', passwordHash } });
  await prisma.category.create({ data: { userId: secondDemo.id, name: 'Consulting revenue', type: 'INCOME' } });

  console.log('Seed complete. Demo login: demo@example.com / secret123');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
