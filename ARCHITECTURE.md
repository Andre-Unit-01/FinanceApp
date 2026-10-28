# Ledgerly Business Finance Architecture

This document explains how the existing Ledgerly Business Finance is organized. 

## 1. What The Application Does

Ledgerly Business Finance lets a user create an account, record income and expenses, organize transactions into categories, create monthly budgets, and compare planned amounts with real spending.

The client is a React application. The server is an Express application. PostgreSQL stores the data through Prisma.

## 2. The Request Flow

The main architecture is:

```text
User
  -> React page
  -> client service
  -> client repository
  -> HTTP API
  -> controller
  -> server service
  -> server repository
  -> Prisma / PostgreSQL
  -> server repository
  -> server service
  -> controller response
  -> React page
  -> User
```

### Example: Adding A Transaction

1. The user fills in amount, type, category, description, and date in the Transactions page.
2. The page sends that form data through `apiService`.
3. `httpRepository` sends the HTTP request and adds the login token.
4. The transaction route sends the request to `transactionController`.
5. `transactionService` validates the amount, type, description, date, and category ownership.
6. `transactionRepository` saves the valid transaction through Prisma.
7. The result travels back through the service and controller.
8. The page reloads its transaction list and displays the new row.

The UI does not write to the database. The service decides whether the operation is allowed, and the repository decides how the record is stored.

## 3. Project Structure

```text
client/src/
  App.jsx                         React routes and page composition
  App.css                         Existing application styles
  index.css                       Global styles and variables
  services/
    apiService.js                 Client-facing API service
    budgetService.js              Budget recommendation policy
  repositories/
    httpRepository.js             Browser HTTP data access
  utils/
    formatting.js                 Shared money formatting

server/src/
  app.js                          Express application setup
  server.js                       Process startup and shutdown
  controllers/                    HTTP request and response adapters
  services/                       Business rules and calculations
  repositories/                   Prisma data access
  middleware/                     Request middleware such as authentication
  routes/                         URL-to-controller mappings
  lib/prisma.js                   Shared Prisma database client
  utils/                          Shared server helpers and errors

server/prisma/
  schema.prisma                   Database models and relationships
  migrations/                     Versioned database changes
  seed.js                         Local demo data
```

The current React pages remain in `App.jsx` because preserving the working UI was the safest first refactor step. The file is the composition layer: it defines routes and renders page sections. Network transport, budget recommendation policy, and money formatting have moved out. A later small step can move each page into `client/src/pages/` without changing the API or database.

## 4. What Each Layer Does

### UI / Components

The React code displays forms, tables, loading states, errors, and buttons. It stores temporary screen state such as the current form values or selected month.

The UI should not contain Prisma queries, database details, or complicated financial rules. It should collect input, call a service, and show the result.

### Services

Services contain decisions and business rules.

Examples:

- `transactionService.js` validates transaction input and checks ownership.
- `budgetService.js` validates monthly category budgets.
- `budgetPlannerService.js` calculates income, spending, remaining money, progress, and budget status.
- `analyticsService.js` turns raw totals into dashboard analytics.
- `authService.js` normalizes email, hashes passwords, and creates tokens.

Services are the best place to test rules because they can be tested without rendering a page.

### Repositories

Repositories contain data access only. They know Prisma method names such as `findMany`, `create`, `update`, and `delete`.

For example, `transactionRepository.findTransactions()` retrieves rows. It does not decide whether the user is allowed to view them or whether a transaction amount is valid. Those decisions stay in `transactionService.js`.

### Database

The database is persistent storage. Data remains after the server stops or the browser refreshes.

The Prisma schema defines `User`, `Category`, `Transaction`, `Budget`, and `MonthlyBudget`. Migrations describe how the database changes over time.

## 5. Feature Data Flows

### Transactions

```text
Form input
  -> transaction service
  -> amount/type/date/category validation
  -> transaction repository
  -> Transaction table
  -> transaction list returned to UI
```

Filtering, sorting, and pagination are service-level decisions. The repository receives the finished database query options.

### Budgets

```text
Budget form
  -> budget service
  -> validate month, year, category, and amount
  -> budget repository
  -> Budget table
  -> planner service combines budget rows with transactions
  -> UI shows budget, spent, remaining, percentage, and status
```

The application does not store a duplicate `spent` value in a budget. Spent money is calculated from expense transactions for the selected month.

### Authentication

```text
Login form
  -> api service
  -> auth controller
  -> auth service
  -> user repository
  -> password comparison
  -> JWT token
  -> browser localStorage
```

Protected requests send the token. Authentication middleware verifies it and loads the user before the controller runs.

## 6. Important Functions

### `calculateMonthlyIncome(transactions)`

Purpose: adds transactions whose type is `INCOME` for the selected month.

Input: a list of transaction records.

Output: one number, such as `$4,200`.

### `calculateMonthlyExpenses(transactions)`

Purpose: adds transactions whose type is `EXPENSE`.

It does not treat expenses as income.

### `calculateCategorySpending(transactions)`

Purpose: groups expense amounts by category ID so a budget row can compare its planned amount with actual spending.

Example: two Food expenses of `$100` and `$75` become Food spending of `$175`.

### `calculateBudgetPercentage(spent, budget)`

Purpose: calculates how much of a category budget has been used. The progress bar is capped visually at 100%, but the text can still say `130% used`.

### `calculateBudgetStatus(percentageUsed)`

Purpose: gives a readable status:

- 0-79%: `On Track`
- 80-99%: `Near Limit`
- 100% or more: `Over Budget`

The thresholds are centralized in `BUDGET_STATUS_THRESHOLDS`.

### `calculateAvailableToSpend(currentBalance, upcomingBills)`

Purpose: subtracts future bills from the current balance. This avoids pretending that every dollar in a bank balance is available for new spending.

## 7. Beginner Programming Concepts

### Modules

Each file is a module. `export` makes a function available to another file, and `import` uses it. This lets each file have a small responsibility.

### Async and Await

Database and HTTP work takes time. An `async` function can wait for that work with `await` without blocking the entire server.

### Promises

An HTTP request or database query returns a Promise: a value that will exist later. `await` reads the completed value, while `try/catch` handles failures.

### Objects and Arrays

Transactions are objects with named fields such as `amount` and `type`. A list of transactions is an array. Array methods such as `filter`, `map`, and `reduce` help calculate totals.

### Components, Props, and State

React components are reusable UI functions. Props are values passed into a component, such as a token. State is data that changes while the user interacts with a page, such as a form amount.

### Validation

Validation checks input before storage. For example, a transaction amount must be greater than zero and its category must belong to the current user.

### Error Handling

Services throw understandable application errors. Controllers pass errors to Express error middleware. The UI displays a friendly message instead of a raw database stack trace.

## 8. Before And After

### Before

```text
React App
  ├── page UI
  ├── fetch calls
  └── local UI calculations

Server service
  ├── validation
  ├── business rules
  └── Prisma queries
```

### After

```text
React page
  -> apiService
  -> httpRepository
  -> Express controller
  -> server service
  -> server repository
  -> Prisma / PostgreSQL
```

The important change is ownership. UI code displays and collects. Services decide. Repositories store and retrieve. The existing API routes and database technology remain intact.

## 9. How To Add A New Feature

Example feature: recurring transactions.

1. Add a model or fields in `schema.prisma` if recurring transactions need persistent data.
2. Create a migration so the database change is repeatable.
3. Add repository methods for creating and reading recurring transaction records.
4. Add service functions such as `createRecurringTransaction()` and put validation there.
5. Add controller and route methods if the browser needs a new API endpoint.
6. Add a React form or page that collects input and calls `apiService`.
7. Add tests for validation, persistence, permissions, and the user workflow.

At each step, keep the direction pointing downward: the UI calls a service, the service calls a repository, and the repository talks to the database.

## 10. Suggested Learning Path

1. Read `client/src/App.jsx` to understand routes, components, state, and form events.
2. Read `client/src/services/apiService.js` and `client/src/repositories/httpRepository.js` to understand API requests.
3. Follow one transaction request through `transactionController.js`, `transactionService.js`, and `transactionRepository.js`.
4. Read `schema.prisma` and the migration files to understand persistent data.
5. Study `budgetPlannerService.js` and practice changing one calculation with a focused test.
6. Learn React testing and service unit testing before extracting more pages from `App.jsx`.