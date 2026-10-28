// Business-oriented baseline allocations. These are rough prompts for a
// first draft, not a substitute for a company's actual operating plan.
const suggestedPercentages = Object.freeze({
  payroll: 0.25,
  contractors: 0.15,
  rent: 0.10,
  housing: 0.10,
  software: 0.05,
  cloud: 0.04,
  utilities: 0.03,
  marketing: 0.08,
  advertising: 0.06,
  travel: 0.04,
  mileage: 0.02,
  professional: 0.05,
  accounting: 0.04,
  insurance: 0.03,
  taxes: 0.12,
  fees: 0.02,
  supplies: 0.02,
  office: 0.05,
  food: 0.05,
  transportation: 0.04,
  debt: 0.08,
  personal: 0.04,
  business: 0.05,
});

export const getSuggestedBudgetAmount = (categoryName, income) => {
  const categoryKey = String(categoryName || '').toLowerCase();
  const match = Object.entries(suggestedPercentages).find(([name]) => categoryKey.includes(name));
  return match ? Math.round(Number(income || 0) * match[1] * 100) / 100 : null;
};

// A reserve target of 10% is a simple starting point for a business cash
// buffer. The amount should be changed to match seasonality and obligations.
export const getSuggestedSavingsTarget = (income) => Math.round(Number(income || 0) * 0.10 * 100) / 100;
