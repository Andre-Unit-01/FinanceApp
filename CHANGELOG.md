# Conversion notes

## Ledgerly — Business Finance

- Rebranded the personal finance tracker as a business finance workspace.
- Rebuilt the interface with responsive navigation, business-focused auth screens, metric cards, a six-month revenue/expense chart, category spending breakdown, recent ledger activity, and budget snapshots.
- Added transaction edit/create/delete workflows, date/type/category filters, pagination, and visible-page CSV export.
- Refined category management and added an optional one-click starter category setup for new workspaces.
- Updated budget suggestions for common business cost categories and added a revenue prerequisite for suggested allocations.
- Replaced personal demo records with business-oriented seed data for revenue, operating expenses, monthly budgets, and a reserve target.
- Added a configurable `VITE_API_URL`, brand metadata, and a matching favicon.

The existing PostgreSQL/Prisma data model and Express API were retained. Invoicing, payroll execution, direct bank synchronization, tax filing, multi-currency accounting, and business-profile persistence remain out of scope because they are not implemented in the current backend.
