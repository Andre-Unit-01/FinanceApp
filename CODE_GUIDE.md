# Beginner Code Guide

This guide explains how to read Ledgerly Business Finance without needing to understand the whole project at once.

## Where To Start

Start with these files in this order:

1. `client/src/main.jsx` - starts the React application.
2. `client/src/App.jsx` - defines the routes and the visible pages.
3. `client/src/services/apiService.js` - shows how the UI asks the server for data.
4. `client/src/repositories/httpRepository.js` - shows how browser HTTP requests are sent.
5. `server/src/app.js` - shows how Express connects routes and error handling.
6. `server/src/routes/transactionRoutes.js` - shows the transaction URLs.
7. `server/src/controllers/transactionController.js` - adapts an HTTP request to a service call.
8. `server/src/services/transactionService.js` - contains transaction validation and business rules.
9. `server/src/repositories/transactionRepository.js` - contains the Prisma transaction queries.
10. `server/prisma/schema.prisma` - describes the database tables and relationships.

Read one feature from the browser to the database before trying to understand every page.

## The Architecture In One Picture

```text
UI
  ↓
Client Service
  ↓
Client Repository
  ↓
HTTP API
  ↓
Controller
  ↓
Server Service
  ↓
Server Repository
  ↓
Database
```

### UI

`App.jsx` displays forms, tables, buttons, loading messages, and errors. It remembers temporary browser state such as the current form values and selected budget month.

### Services

Services decide what the application is allowed to do. They validate input, check ownership, calculate financial values, and coordinate repositories.

### Repositories

Repositories perform data access. The browser repository sends HTTP requests. The server repositories call Prisma. Repositories should not decide financial rules or display UI.

### Database

PostgreSQL stores persistent data. Prisma gives the server JavaScript methods for reading and writing the tables described in `schema.prisma`.

## How A User Action Moves Through The Application

### Example: Add A Transaction

```text
User clicks Create transaction
        ↓
TransactionsPage.handleSubmit
        ↓
apiService.apiFetch
        ↓
httpRepository.sendApiRequest
        ↓
POST /api/transactions
        ↓
transactionController.create
        ↓
transactionService.createTransaction
        ↓
transactionRepository.createTransaction
        ↓
Prisma writes the Transaction row
        ↓
The saved transaction returns through each layer
        ↓
TransactionsPage reloads the table
```

The important idea is that each layer has a different job. The form does not need to know SQL or Prisma, and the database does not need to know how a button looks.

## Important Files

| File | Purpose |
| --- | --- |
| `client/src/main.jsx` | Creates the React root and renders `App`. |
| `client/src/App.jsx` | Defines routes and page-level UI for auth, dashboard, transactions, categories, and budgets. |
| `client/src/services/apiService.js` | Gives UI code a simple API request function. |
| `client/src/services/budgetService.js` | Contains the optional suggested-budget policy. |
| `client/src/repositories/httpRepository.js` | Sends HTTP requests, adds the token, and converts failed responses into errors. |
| `client/src/utils/formatting.js` | Keeps money values formatted consistently. |
| `server/src/app.js` | Configures Express middleware and mounts routes. |
| `server/src/routes/transactionRoutes.js` | Maps transaction URLs to controller functions. |
| `server/src/controllers/transactionController.js` | Reads request values and returns service results as HTTP responses. |
| `server/src/services/transactionService.js` | Validates transactions, checks ownership, and prepares filters. |
| `server/src/repositories/transactionRepository.js` | Contains Prisma transaction queries. |
| `server/src/services/budgetPlannerService.js` | Calculates monthly income, spending, progress, remaining money, and budget status. |
| `server/src/repositories/budgetRepository.js` | Reads and writes category and monthly budget records. |
| `server/src/services/analyticsService.js` | Builds the dashboard's monthly analytics response. |
| `server/src/repositories/analyticsRepository.js` | Retrieves raw sums and grouped category totals. |
| `server/src/services/authService.js` | Validates credentials, hashes passwords, and creates login tokens. |
| `server/src/repositories/userRepository.js` | Reads and creates user records. |
| `server/prisma/schema.prisma` | Defines `User`, `Category`, `Transaction`, `Budget`, and `MonthlyBudget`. |
| `server/src/middleware/authMiddleware.js` | Verifies a token before protected routes run. |
| `server/src/middleware/errorHandler.js` | Converts thrown errors into consistent JSON responses. |

## Important Functions

### `createTransaction(userId, input)`

Receives the values entered in the transaction form. It checks that the amount is positive, the type is valid, required fields exist, and the category belongs to the current user. It then asks the transaction repository to save the row.

### `listTransactions(userId, filters, page, limit)`

Builds a user-scoped query from the table filters. It asks the repository for the total count and current page, then returns both the rows and pagination metadata.

### `getBudgetPlanner(userId, year, month)`

Loads monthly targets, category budgets, categories, and transactions. It combines those inputs into the complete planner response used by the Budgets page.

### `calculateMonthlyIncome(transactions)`

Filters for `INCOME` transactions and adds their amounts. Income is calculated separately because expenses must not increase income.

### `calculateMonthlyExpenses(transactions)`

Filters for `EXPENSE` transactions and adds their amounts. The result represents money spent in the selected month.

### `calculateCategorySpending(transactions)`

Groups expense amounts by category ID. This lets the planner compare a category's planned budget with what transactions actually recorded.

### `calculateBudgetPercentage(spent, budget)`

Calculates the percentage of a category budget used. The UI caps the visual bar at 100%, but the text can still show an over-budget value such as `130% used`.

### `calculateBudgetStatus(percentageUsed)`

Converts a number into `On Track`, `Near Limit`, or `Over Budget`. The thresholds are kept together in `BUDGET_STATUS_THRESHOLDS` so they are easy to understand and change.

### `calculateAvailableToSpend(currentBalance, upcomingBills)`

Subtracts future bills from the current balance. This gives a more useful spending amount than showing the bank balance alone.

## Important Data Structures

### Transaction

A transaction represents something that actually happened:

```js
{
  amount: 100,
  type: 'EXPENSE',
  categoryId: 'category-id',
  description: 'Water',
  transactionDate: '2026-09-07'
}
```

`type` is either `INCOME` or `EXPENSE`. Both types use the same table, which is why the calculation functions filter by type.

### Budget

A category budget represents a plan for one category and month:

```js
{
  categoryId: 'category-id',
  month: 9,
  year: 2026,
  amount: 200
}
```

The budget does not store `spent`. Actual spending is calculated from transactions so edits and deletes are reflected automatically.

### MonthlyBudget

A monthly budget header stores targets that are not category rows:

```js
{
  month: 9,
  year: 2026,
  incomeTarget: 4000,
  savingsTarget: 600
}
```

### Planner response

The planner API returns summary values, category rows, and upcoming transactions so the page can display one complete monthly view.

## Programming Concepts To Notice

### Imports and Exports

Files share functionality through `export` and `import`. For example, `App.jsx` imports `apiFetch` instead of defining HTTP behavior itself.

### State

React state remembers values that can change while the user interacts with a page. Examples include the login form, selected month, transaction filters, and budget form.

### Props

Props pass values into components. `DashboardPage({ token })` receives the login token from `App` so it can request protected analytics.

### Events

Functions such as `handleSubmit` run because the user triggers an event, such as submitting a form or clicking a button.

### Async and Await

HTTP and database operations take time. `await` pauses the current async function until the Promise finishes, then gives the function its result. `try/catch` handles a rejected Promise.

### `filter`

`filter` creates a new array containing only matching items. The budget calculations use it to separate income from expenses.

### `map`

`map` creates a new array by transforming each item. The UI uses it to turn category and transaction data into table rows.

### `reduce`

`reduce` combines many values into one value. It is used to add transaction amounts into a total.

### Destructuring

Destructuring extracts named values from an object. For example, a service can receive `{ email, password }` and work with those two input values directly.

### Error Handling

A service can throw an `AppError` when input or ownership is invalid. Controllers pass the error to Express, and `errorHandler` returns a consistent response for the browser.

## JSX And React

`App.jsx` contains the route composition and the current page components.

- `App` owns the login token and chooses protected or public routes.
- `LoginPage` and `RegisterPage` collect credentials and report the token back to `App` through props.
- `DashboardPage` loads monthly analytics in `useEffect` and renders summary cards and lists.
- `TransactionsPage` stores form values, filters, sorting, pagination, loading state, and error state. Form submit and button clicks trigger API requests.
- `CategoriesPage` handles category CRUD operations and refreshes the list after changes.
- `BudgetPage` stores the selected month and displays the planner response, budget forms, progress bars, and status badges.

React state is used for values that change while the page is open. `useEffect` runs a request when a token or selected month changes. `useMemo` builds the transaction query string from the current filters and pagination values.

JSX uses conditional rendering for loading, error, empty-list, and authenticated states. It uses `map()` to create one list item or table row for each returned record. Each rendered row has a stable `key`, usually the database ID, so React can track it when data changes.

## CSS And Layout

The main stylesheet files are:

- `client/src/index.css` provides global typography, root sizing, base colors, and browser dark-mode fallbacks.
- `client/src/App.css` styles the application shell, navigation, forms, panels, tables, transaction layout, budget planner, buttons, statuses, and the existing narrow-screen rules.

The project uses CSS variables such as `--teal`, `--navy`, `--line`, and `--canvas` so related components share the same theme values. `box-sizing: border-box` makes width calculations include padding and borders, which helps table and panel layouts stay inside their parents.

Flexbox is used for one-dimensional groups such as the header, navigation, action buttons, and pagination. CSS Grid is used for page sections and forms because it can distribute several controls or panels into columns with consistent gaps.

The transaction table uses explicit column widths and constrained parent width so all columns remain inside the panel. The budget progress bar uses `overflow: hidden`; the filled child can be capped at 100% visually even when the text reports that spending is over budget.

The `:hover`, `:focus`, and `:disabled` rules explain interaction states visually. The media queries change spacing and stacking below the existing screen-width thresholds; they do not change application data or behavior.

## JavaScript Configuration Files

- `client/vite.config.js` configures the Vite development server and production bundler.
- `client/eslint.config.js` checks client JavaScript and JSX for common mistakes.
- `server/eslint.config.js` checks server JavaScript.
- `server/vitest.config.js` configures the backend test runner.

## How To Read A Financial Calculation

When you see a calculation, ask four questions:

1. Which transactions are included?
2. Which transactions are intentionally excluded?
3. What does the resulting number represent?
4. Which UI value receives the result?

For example, remaining money is calculated from total income, total expenses, and savings:

```text
remaining = totalIncome - totalExpenses - savingsTarget
```

This is not the same as available-to-spend money. Available-to-spend also subtracts upcoming bills from the current balance.

## Suggested Next Steps For Learning

1. Trace one transaction request using the flow above.
2. Read the validation branches in `transactionService.js`.
3. Read the matching repository query.
4. Change a small service calculation and run the server tests.
5. Practice adding a new repository method without putting its query in a controller.
6. Learn React testing before extracting more page components from `App.jsx`.

The best way to learn this codebase is to follow one piece of data through every layer instead of opening every file at once.
