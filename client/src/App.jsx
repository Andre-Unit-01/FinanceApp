import { BrowserRouter, Link, Navigate, NavLink, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { apiFetch } from './services/apiService.js';
import { getSuggestedBudgetAmount, getSuggestedSavingsTarget } from './services/budgetService.js';
import { formatMoney } from './utils/formatting.js';

const todayInput = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const formatDate = (value, options = { month: 'short', day: 'numeric', year: 'numeric' }) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString(undefined, options);
};

const monthName = (year, month) => new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: 'short' });

const STARTER_CATEGORIES = [
  { name: 'Client payments', type: 'INCOME' },
  { name: 'Retainer revenue', type: 'INCOME' },
  { name: 'Payroll & contractors', type: 'EXPENSE' },
  { name: 'Office rent', type: 'EXPENSE' },
  { name: 'Software & cloud', type: 'EXPENSE' },
  { name: 'Marketing', type: 'EXPENSE' },
  { name: 'Professional services', type: 'EXPENSE' },
  { name: 'Taxes & fees', type: 'EXPENSE' },
];

function Icon({ name, size = 18, strokeWidth = 1.8 }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const drawings = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
    transactions: <><path d="M4 7h15M15 3l4 4-4 4"/><path d="M20 17H5m4-4-4 4 4 4"/></>,
    budget: <><path d="M4 19V5M4 19h17"/><path d="m7 15 4-5 3 2 5-7"/></>,
    categories: <><path d="m12 3 9 9-9 9-9-9 9-9Z"/><circle cx="12" cy="12" r="2"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    arrowUp: <><path d="M7 17 17 7M7 7h10v10"/></>,
    arrowDown: <><path d="m7 7 10 10M7 17h10V7"/></>,
    wallet: <><rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 9h18M16 14h2"/><path d="M6 5V3h12v2"/></>,
    arrowLeft: <><path d="m14 6-6 6 6 6"/></>,
    arrowRight: <><path d="m10 6 6 6-6 6"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    download: <><path d="M12 3v12m-5-5 5 5 5-5"/><path d="M5 17v4h14v-4"/></>,
    edit: <><path d="m4 16-.7 4.7L8 20l11-11-4-4L4 16Z"/><path d="m13.5 6.5 4 4"/></>,
    trash: <><path d="M4 7h16M10 11v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/></>,
    briefcase: <><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V4h8v3M3 12h18M10 12v2h4v-2"/></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/></>,
    spark: <><path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z"/><path d="m19 16 .9 2.1L22 19l-2.1.9L19 22l-.9-2.1L16 19l2.1-.9L19 16Z"/></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4 4"/></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" {...common}>{drawings[name] || drawings.grid}</svg>;
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('financeToken') || '');
  const logout = () => {
    localStorage.removeItem('financeToken');
    setToken('');
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/dashboard" replace /> : <AuthPage mode="login" onAuthenticated={setToken} />} />
        <Route path="/register" element={token ? <Navigate to="/dashboard" replace /> : <AuthPage mode="register" onAuthenticated={setToken} />} />
        <Route element={token ? <WorkspaceLayout onLogout={logout} /> : <Navigate to="/login" replace />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage token={token} />} />
          <Route path="/transactions" element={<TransactionsPage token={token} />} />
          <Route path="/budgets" element={<BudgetPage token={token} />} />
          <Route path="/categories" element={<CategoriesPage token={token} />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function AuthPage({ mode, onAuthenticated }) {
  const isLogin = mode === 'login';
  const [email, setEmail] = useState(isLogin ? 'demo@example.com' : '');
  const [password, setPassword] = useState(isLogin ? 'secret123' : '');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (!isLogin && password !== confirmPassword) {
      setError('Your passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await apiFetch(isLogin ? '/auth/login' : '/auth/register', '', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      });
      localStorage.setItem('financeToken', response.token);
      onAuthenticated(response.token);
    } catch (requestError) {
      setError(requestError.message || 'Unable to authenticate. Check the server and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-layout">
      <aside className="auth-story">
        <Link className="brand brand-light" to="/login" aria-label="Ledgerly home">
          <span className="brand-symbol"><Icon name="wallet" size={21} /></span>
          <span className="brand-name">ledgerly<span>.</span></span>
        </Link>
        <div className="auth-story-content">
          <span className="eyebrow eyebrow-light">FINANCIAL CLARITY FOR TEAMS</span>
          <h1>Make every<br />dollar <em>work harder.</em></h1>
          <p>Know what’s coming in, what’s going out, and where your business stands — all in one clear view.</p>
          <div className="auth-proof-row">
            <span className="proof-icon"><Icon name="shield" size={18} /></span>
            <span><strong>Your numbers, organized.</strong><small>A more confident way to manage cash flow.</small></span>
          </div>
        </div>
        <div className="auth-story-foot"><span>BUSINESS FINANCE, SIMPLIFIED</span><span>© {new Date().getFullYear()} Ledgerly</span></div>
      </aside>
      <main className="auth-main">
        <div className="auth-topline"><span>{isLogin ? 'Welcome back' : 'Get started'}</span><span className="secure-label"><Icon name="shield" size={14} /> Secure workspace</span></div>
        <section className="auth-card">
          <span className="eyebrow">{isLogin ? 'YOUR WORKSPACE AWAITS' : 'SET UP YOUR WORKSPACE'}</span>
          <h2>{isLogin ? 'Sign in to Ledgerly' : 'Create your account'}</h2>
          <p className="auth-subtitle">{isLogin ? 'Pick up where you left off with your business finances.' : 'Start bringing your business finances into focus.'}</p>
          <form className="auth-form" onSubmit={handleSubmit}>
            <label>Email address<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" required /></label>
            <label>Password<input type="password" autoComplete={isLogin ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} minLength={isLogin ? undefined : 8} placeholder="Enter your password" required /></label>
            {!isLogin && <label>Confirm password<input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Re-enter your password" required /></label>}
            {error && <div className="inline-alert" role="alert">{error}</div>}
            <button className="button button-primary auth-submit" type="submit" disabled={submitting}>{submitting ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}<Icon name="arrowRight" size={17} /></button>
          </form>
          {isLogin && <div className="demo-hint"><strong>Demo access</strong><span>demo@example.com <i>·</i> secret123</span><small>Demo access requires the local database to be seeded.</small></div>}
          <p className="auth-switch">{isLogin ? 'New to Ledgerly?' : 'Already have an account?'} <Link to={isLogin ? '/register' : '/login'}>{isLogin ? 'Create an account' : 'Sign in instead'}</Link></p>
        </section>
        <div className="auth-bottom-note">By continuing, you agree to use this workspace responsibly and keep your account credentials private.</div>
      </main>
    </div>
  );
}

const navigation = [
  { to: '/dashboard', label: 'Overview', icon: 'grid' },
  { to: '/transactions', label: 'Transactions', icon: 'transactions' },
  { to: '/budgets', label: 'Budget planner', icon: 'budget' },
  { to: '/categories', label: 'Categories', icon: 'categories' },
];

function WorkspaceLayout({ onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const activePage = navigation.find((item) => item.to === location.pathname)?.label || 'Overview';
  const isOverview = location.pathname === '/dashboard';
  return (
    <div className="workspace">
      <aside className="sidebar">
        <Link className="brand" to="/dashboard" aria-label="Ledgerly overview">
          <span className="brand-symbol"><Icon name="wallet" size={21} /></span>
          <span className="brand-name">ledgerly<span>.</span></span>
        </Link>
        <div className="workspace-chip"><span className="workspace-avatar">B</span><span><strong>Business workspace</strong><small>Finance overview</small></span><span className="workspace-dots">•••</span></div>
        <div className="sidebar-section-label">WORKSPACE</div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          {navigation.map((item) => <NavLink end key={item.to} to={item.to} className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}><Icon name={item.icon} size={18} /><span>{item.label}</span>{item.to === '/transactions' && <span className="nav-arrow">↗</span>}</NavLink>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card"><span className="help-mark"><Icon name="spark" size={17} /></span><strong>Stay in control</strong><p>Review your cash flow regularly to spot opportunities early.</p><Link to="/budgets">Review budget <Icon name="arrowRight" size={14} /></Link></div>
          <div className="sidebar-user"><span className="user-avatar">LS</span><span className="sidebar-user-copy"><strong>Ledgerly user</strong><small>Business account</small></span><button type="button" className="icon-button logout-icon" onClick={onLogout} aria-label="Sign out" title="Sign out"><Icon name="logout" size={17} /></button></div>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="topbar">
          <div className="topbar-title"><span>WORKSPACE / {activePage.toUpperCase()}</span><strong>{activePage}</strong></div>
          <div className="topbar-actions"><div className="topbar-date"><Icon name="calendar" size={16} /><span>{new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span></div><span className="topbar-divider"/><span className="avatar-small">LS</span><span className="topbar-user-name">Ledgerly user</span><button className="button button-primary topbar-add" type="button" onClick={() => navigate('/transactions?new=1')}><Icon name="plus" size={16} />New transaction</button></div>
        </header>
        <main className={`content-area${isOverview ? ' overview-content' : ''}`}><Outlet /></main>
        <footer className="workspace-footer"><span>Ledgerly Business Finance</span><span>Clear numbers. Better decisions.</span></footer>
      </div>
    </div>
  );
}

function PageHeading({ eyebrow, title, description, actions }) {
  return <div className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{actions && <div className="page-heading-actions">{actions}</div>}</div>;
}

function DashboardPage({ token }) {
  const now = new Date();
  const [months, setMonths] = useState([]);
  const [recent, setRecent] = useState([]);
  const [categoryCount, setCategoryCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      const periods = Array.from({ length: 6 }, (_, index) => {
        const date = new Date(year, month - 1 - (5 - index), 1);
        return { year: date.getFullYear(), month: date.getMonth() + 1 };
      });
      try {
        const [analytics, transactionPayload, categoryPayload] = await Promise.all([
          Promise.all(periods.map((period) => apiFetch(`/analytics/monthly?year=${period.year}&month=${period.month}`, token))),
          apiFetch('/transactions?page=1&limit=6&sortBy=transactionDate&sortOrder=desc', token),
          apiFetch('/categories', token),
        ]);
        if (!cancelled) {
          setMonths(analytics.map((item, index) => ({ ...item, ...periods[index] })));
          setRecent(transactionPayload.data || []);
          setCategoryCount((categoryPayload || []).length);
        }
      } catch (requestError) {
        if (!cancelled) setError(requestError.message || 'Unable to load the finance overview.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [token, month, year]);

  const current = months[months.length - 1] || { income: 0, expenses: 0, net: 0, byCategory: [], budgetStatus: [] };
  const previous = months[months.length - 2] || { income: 0, expenses: 0, net: 0, byCategory: [], budgetStatus: [] };
  const budgetRows = current.budgetStatus.map((item) => ({ ...item, percentageUsed: Number(item.budget) > 0 ? Math.round((Number(item.spent || 0) / Number(item.budget)) * 100) : (Number(item.spent || 0) > 0 ? 100 : 0) }));
  const totalBudget = budgetRows.reduce((sum, item) => sum + Number(item.budget || 0), 0);
  const totalBudgetSpent = budgetRows.reduce((sum, item) => sum + Number(item.spent || 0), 0);
  const budgetPercent = totalBudget > 0 ? Math.round((totalBudgetSpent / totalBudget) * 100) : 0;
  const categories = [...(current.byCategory || [])].sort((a, b) => Number(b.amount) - Number(a.amount)).slice(0, 5);

  const changeText = (value, base, positiveIsGood = true) => {
    if (!base) return 'No prior-month baseline';
    const percent = ((value - base) / Math.abs(base)) * 100;
    const improved = positiveIsGood ? percent >= 0 : percent <= 0;
    return <span className={improved ? 'change-positive' : 'change-negative'}>{percent >= 0 ? '+' : ''}{percent.toFixed(1)}% <span>vs. last month</span></span>;
  };

  return <div className="page-stack">
    <PageHeading eyebrow="BUSINESS OVERVIEW" title="Your business, at a glance" description={`Here’s your financial snapshot for ${now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}.`} actions={<Link to="/transactions" className="button button-primary"><Icon name="plus" size={16} />Add transaction</Link>} />
    {error && <div className="inline-alert page-alert" role="alert">{error}<span> Make sure the API and database are running.</span></div>}
    <div className="metric-grid">
      <MetricCard icon="arrowUp" label="Total revenue" value={formatMoney(current.income)} caption={changeText(Number(current.income || 0), Number(previous.income || 0), true)} tone="green" loading={loading} />
      <MetricCard icon="arrowDown" label="Operating expenses" value={formatMoney(current.expenses)} caption={changeText(Number(current.expenses || 0), Number(previous.expenses || 0), false)} tone="orange" loading={loading} />
      <MetricCard icon="wallet" label="Net cash flow" value={formatMoney(current.net)} caption={<span className={Number(current.net) >= 0 ? 'change-positive' : 'change-negative'}>{Number(current.net) >= 0 ? 'Positive balance' : 'Negative balance'} <span>this month</span></span>} tone="blue" loading={loading} />
      <MetricCard icon="budget" label="Budget utilized" value={`${budgetPercent}%`} caption={totalBudget ? <span className="neutral-caption">{formatMoney(totalBudgetSpent)} of {formatMoney(totalBudget)} planned</span> : <span className="neutral-caption">No monthly budgets set</span>} tone="violet" loading={loading} progress={totalBudget ? Math.min(budgetPercent, 100) : 0} />
    </div>
    <div className="dashboard-grid dashboard-grid-primary">
      <section className="panel chart-panel">
        <div className="panel-heading"><div><span className="eyebrow">CASH FLOW</span><h2>Revenue & expenses</h2><p>Monthly movement across the last six months</p></div><div className="chart-legend"><span><i className="legend-dot revenue-dot"/>Revenue</span><span><i className="legend-dot expense-dot"/>Expenses</span></div></div>
        {loading ? <div className="chart-skeleton" /> : <CashFlowChart data={months} />}
      </section>
      <section className="panel category-panel">
        <div className="panel-heading"><div><span className="eyebrow">WHERE IT GOES</span><h2>Expense breakdown</h2><p>Largest expense categories this month</p></div><Link className="text-link" to="/categories">Manage <Icon name="arrowRight" size={14} /></Link></div>
        {loading ? <div className="list-skeleton" /> : categories.length ? <div className="category-breakdown">{categories.map((item, index) => {
          const max = Number(categories[0]?.amount || 1);
          const percent = Math.round((Number(item.amount || 0) / max) * 100);
          return <div className="category-breakdown-row" key={item.categoryId}><div className={`category-symbol category-symbol-${index % 5}`}><Icon name={['briefcase', 'categories', 'wallet', 'budget', 'transactions'][index % 5]} size={16} /></div><div className="category-info"><div className="category-info-top"><strong>{item.category}</strong><span>{formatMoney(item.amount)}</span></div><div className="bar-track"><span style={{ width: `${percent}%` }} /></div></div></div>;
        })}</div> : <EmptyState icon="categories" title="No expenses to break down" text="Once you record business expenses, your top categories will appear here." action={<Link to="/transactions" className="text-link">Record an expense <Icon name="arrowRight" size={14} /></Link>} />}
      </section>
    </div>
    <div className="dashboard-grid dashboard-grid-secondary">
      <section className="panel recent-panel">
        <div className="panel-heading"><div><span className="eyebrow">LATEST ACTIVITY</span><h2>Recent transactions</h2><p>Your latest money movements</p></div><Link className="text-link" to="/transactions">View all <Icon name="arrowRight" size={14} /></Link></div>
        {loading ? <div className="table-skeleton" /> : recent.length ? <div className="recent-table-wrap"><table className="recent-table"><thead><tr><th>Transaction</th><th>Date</th><th>Amount</th></tr></thead><tbody>{recent.map((item) => <tr key={item.id}><td><span className={`transaction-icon ${item.type === 'INCOME' ? 'income' : 'expense'}`}><Icon name={item.type === 'INCOME' ? 'arrowDown' : 'arrowUp'} size={16} /></span><span className="recent-description"><strong>{item.description}</strong><small>{item.category?.name || 'Uncategorized'}</small></span></td><td>{formatDate(item.transactionDate, { month: 'short', day: 'numeric' })}</td><td><strong className={item.type === 'INCOME' ? 'amount-income' : 'amount-expense'}>{item.type === 'INCOME' ? '+' : '−'}{formatMoney(item.amount)}</strong></td></tr>)}</tbody></table></div> : <EmptyState icon="transactions" title="Your activity starts here" text={categoryCount === 0 ? 'Set up income and expense categories first, then record your first business transaction.' : 'Record your first business transaction to begin tracking cash flow.'} action={categoryCount === 0 ? <Link to="/categories" className="button button-secondary">Set up categories <Icon name="arrowRight" size={15} /></Link> : <Link to="/transactions" className="button button-secondary">Add first transaction <Icon name="arrowRight" size={15} /></Link>} />}
      </section>
      <section className="panel budget-snapshot-panel">
        <div className="panel-heading"><div><span className="eyebrow">SPENDING CONTROL</span><h2>Budget snapshot</h2><p>Planned spend compared with actuals</p></div><Link className="text-link" to="/budgets">Details <Icon name="arrowRight" size={14} /></Link></div>
        {loading ? <div className="list-skeleton" /> : current.budgetStatus.length ? <div className="budget-snapshot-list">{[...current.budgetStatus].sort((a, b) => Number(b.percentageUsed || 0) - Number(a.percentageUsed || 0)).slice(0, 4).map((item) => <div className="budget-snapshot-row" key={item.category}><div className="budget-snapshot-meta"><strong>{item.category}</strong><span>{Number(item.percentageUsed || 0)}%</span></div><div className="bar-track budget-track"><span className={Number(item.percentageUsed) >= 100 ? 'over' : Number(item.percentageUsed) >= 80 ? 'near' : ''} style={{ width: `${Math.min(Number(item.percentageUsed || 0), 100)}%` }} /></div><div className="budget-snapshot-amounts"><span>{formatMoney(item.spent)} spent</span><span>of {formatMoney(item.budget)}</span></div></div>)}</div> : <EmptyState icon="budget" title="Build your budget" text="Set category limits and monthly targets to see how actual spending compares to plan." action={<Link to="/budgets" className="text-link">Open budget planner <Icon name="arrowRight" size={14} /></Link>} />}
        {totalBudget > 0 && <div className="budget-total-foot"><span>Total allocated</span><strong>{formatMoney(totalBudget)}</strong></div>}
      </section>
    </div>
  </div>;
}

function MetricCard({ icon, label, value, caption, tone, loading, progress }) {
  return <section className="metric-card"><div className={`metric-icon metric-icon-${tone}`}><Icon name={icon} size={19} /></div><span className="metric-label">{label}</span>{loading ? <div className="metric-skeleton" /> : <><strong className="metric-value">{value}</strong><div className="metric-caption">{caption}</div>{progress !== undefined && <div className="metric-progress"><span style={{ width: `${progress}%` }} /></div>}</>}</section>;
}

function CashFlowChart({ data }) {
  const maxValue = Math.max(1, ...data.flatMap((item) => [Number(item.income || 0), Number(item.expenses || 0)]));
  const plotTop = 14;
  const plotBottom = 181;
  const plotHeight = plotBottom - plotTop;
  const chartLeft = 38;
  const groupWidth = 568 / Math.max(data.length, 1);
  const formatCompact = (value) => value >= 1000000 ? `$${(value / 1000000).toFixed(1)}m` : value >= 1000 ? `$${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k` : `$${Math.round(value)}`;
  return <div className="cash-flow-chart"><svg viewBox="0 0 624 226" role="img" aria-label="Bar chart comparing monthly revenue and expenses">
    {[0, 1, 2, 3].map((line) => { const y = plotTop + plotHeight * line / 3; return <g key={line}><line x1={chartLeft} x2="610" y1={y} y2={y} className="chart-grid-line"/><text x="30" y={y + 4} className="chart-axis-label" textAnchor="end">{formatCompact(maxValue * (1 - line / 3))}</text></g>; })}
    {data.map((item, index) => {
      const center = chartLeft + groupWidth * index + groupWidth / 2;
      const incomeHeight = Number(item.income || 0) / maxValue * plotHeight;
      const expenseHeight = Number(item.expenses || 0) / maxValue * plotHeight;
      const x1 = center - 17;
      const x2 = center + 3;
      const selected = index === data.length - 1;
      return <g key={`${item.year}-${item.month}`}><rect x={x1} y={plotBottom - incomeHeight} width="14" height={Math.max(incomeHeight, item.income ? 2 : 0)} rx="4" className={`chart-bar revenue-bar${selected ? ' current' : ''}`}><title>{`${monthName(item.year, item.month)} revenue: ${formatMoney(item.income)}`}</title></rect><rect x={x2} y={plotBottom - expenseHeight} width="14" height={Math.max(expenseHeight, item.expenses ? 2 : 0)} rx="4" className={`chart-bar expense-bar${selected ? ' current' : ''}`}><title>{`${monthName(item.year, item.month)} expenses: ${formatMoney(item.expenses)}`}</title></rect><text x={center} y="207" textAnchor="middle" className={`chart-month-label${selected ? ' selected' : ''}`}>{monthName(item.year, item.month)}</text></g>;
    })}
  </svg></div>;
}

function EmptyState({ icon = 'grid', title, text, action }) {
  return <div className="empty-state"><div className="empty-icon"><Icon name={icon} size={23} /></div><strong>{title}</strong><p>{text}</p>{action && <div className="empty-action">{action}</div>}</div>;
}

function TransactionsPage({ token }) {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [filters, setFilters] = useState({ type: '', categoryId: '', startDate: '', endDate: '', sortBy: 'transactionDate', sortOrder: 'desc' });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [form, setForm] = useState({ id: '', amount: '', type: 'EXPENSE', categoryId: '', description: '', transactionDate: todayInput() });
  const [formOpen, setFormOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ page: String(pagination.page), limit: String(pagination.limit), sortBy: filters.sortBy, sortOrder: filters.sortOrder });
    if (filters.type) params.set('type', filters.type);
    if (filters.categoryId) params.set('categoryId', filters.categoryId);
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    return params.toString();
  }, [filters, pagination.page, pagination.limit]);

  async function loadCategories() {
    const result = await apiFetch('/categories', token);
    setCategories(result || []);
  }
  async function loadTransactions() {
    setLoading(true);
    try {
      const payload = await apiFetch(`/transactions?${queryString}`, token);
      setTransactions(payload.data || []);
      setPagination((previous) => ({ ...previous, ...(payload.pagination || {}) }));
    } catch (requestError) {
      setError(requestError.message || 'Unable to load transactions.');
    } finally { setLoading(false); }
  }

  useEffect(() => { loadCategories().catch((requestError) => setError(requestError.message)); }, [token]);
  useEffect(() => { loadTransactions(); }, [token, queryString]);
  useEffect(() => { if (new URLSearchParams(location.search).get('new') === '1') setFormOpen(true); }, [location.search]);
  useEffect(() => {
    if (!form.categoryId) {
      const firstCategory = categories.find((category) => category.type === form.type);
      if (firstCategory) setForm((previous) => ({ ...previous, categoryId: firstCategory.id }));
    }
  }, [categories, form.type, form.categoryId]);

  function updateFilter(name, value) {
    setFilters((previous) => ({ ...previous, [name]: value }));
    setPagination((previous) => ({ ...previous, page: 1 }));
  }
  function resetForm() {
    setForm({ id: '', amount: '', type: 'EXPENSE', categoryId: categories.find((category) => category.type === 'EXPENSE')?.id || '', description: '', transactionDate: todayInput() });
    setError('');
    setFormOpen(false);
    if (location.search) navigate('/transactions', { replace: true });
  }
  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true); setError(''); setNotice('');
    try {
      const payload = { amount: Number(form.amount), type: form.type, categoryId: form.categoryId, description: form.description.trim(), transactionDate: form.transactionDate };
      if (form.id) await apiFetch(`/transactions/${form.id}`, token, { method: 'PATCH', body: JSON.stringify(payload) });
      else await apiFetch('/transactions', token, { method: 'POST', body: JSON.stringify(payload) });
      setNotice(form.id ? 'Transaction updated.' : 'Transaction recorded.');
      resetForm();
      setPagination((previous) => ({ ...previous, page: 1 }));
      await loadTransactions();
    } catch (requestError) { setError(requestError.message || 'Could not save the transaction.'); }
    finally { setSaving(false); }
  }
  async function removeTransaction(id) {
    if (!window.confirm('Delete this transaction? This action cannot be undone.')) return;
    setError(''); setNotice('');
    try {
      await apiFetch(`/transactions/${id}`, token, { method: 'DELETE' });
      setNotice('Transaction deleted.');
      if (transactions.length === 1 && pagination.page > 1) setPagination((previous) => ({ ...previous, page: previous.page - 1 }));
      else await loadTransactions();
    } catch (requestError) { setError(requestError.message || 'Unable to delete transaction.'); }
  }
  function editTransaction(item) {
    const txDate = new Date(item.transactionDate);
    setForm({ id: item.id, amount: String(item.amount), type: item.type, categoryId: item.categoryId, description: item.description, transactionDate: `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}-${String(txDate.getDate()).padStart(2, '0')}` });
    setFormOpen(true); setError(''); setNotice('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function exportVisibleRows() {
    const quote = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const rows = [['Date', 'Description', 'Category', 'Type', 'Amount'], ...transactions.map((item) => [formatDate(item.transactionDate), item.description, item.category?.name || '', item.type, Number(item.amount).toFixed(2)])];
    const csv = rows.map((row) => row.map(quote).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `ledgerly-transactions-page-${pagination.page}.csv`; anchor.click(); URL.revokeObjectURL(url);
  }

  const filteredCategories = categories.filter((category) => !filters.type || category.type === filters.type);
  return <div className="page-stack">
    <PageHeading eyebrow="LEDGER" title="Transactions" description="Record, review, and organize every business money movement." actions={<><button className="button button-secondary" type="button" onClick={exportVisibleRows} disabled={!transactions.length}><Icon name="download" size={16} />Export page</button><button className="button button-primary" type="button" onClick={() => { setFormOpen((open) => !open); setError(''); }}><Icon name="plus" size={16} />New transaction</button></>} />
    {notice && <div className="success-alert" role="status">{notice}</div>}
    {error && <div className="inline-alert page-alert" role="alert">{error}</div>}
    {formOpen && <section className="panel transaction-form-panel"><div className="panel-heading"><div><span className="eyebrow">{form.id ? 'UPDATE ENTRY' : 'NEW ENTRY'}</span><h2>{form.id ? 'Edit transaction' : 'Add a transaction'}</h2><p>Enter the details and keep your books up to date.</p></div><button type="button" className="icon-button" onClick={resetForm} aria-label="Close form"><Icon name="close" /></button></div><form className="transaction-form" onSubmit={handleSubmit}>
      <label>Transaction type<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value, categoryId: '' })}><option value="EXPENSE">Business expense</option><option value="INCOME">Business income</option></select></label>
      <label>Amount (USD)<div className="money-input"><span>$</span><input type="number" min="0.01" step="0.01" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="0.00" required /></div></label>
      <label>Category<select value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })} required><option value="">Select a category</option>{categories.filter((category) => category.type === form.type).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>{!categories.some((category) => category.type === form.type) && <small className="field-help">Create a matching category in <Link to="/categories" className="inline-field-link">Categories</Link>.</small>}</label>
      <label>Date<input type="date" value={form.transactionDate} onChange={(event) => setForm({ ...form, transactionDate: event.target.value })} required /></label>
      <label className="form-span-two">Description<input type="text" maxLength="160" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="e.g. October website maintenance" required /></label>
      <div className="form-actions form-span-two"><button className="button button-secondary" type="button" onClick={resetForm}>Cancel</button><button className="button button-primary" type="submit" disabled={saving || !categories.some((category) => category.id === form.categoryId && category.type === form.type)}>{saving ? 'Saving…' : form.id ? 'Save changes' : 'Save transaction'}</button></div>
    </form></section>}
    <section className="panel transaction-list-panel"><div className="list-panel-heading"><div><h2>All transactions</h2><p>{pagination.total} records in your ledger</p></div><span className="record-count"><span className="record-count-dot" /> Live ledger</span></div>
      <div className="transaction-filters"><label className="filter-select"><span>Type</span><select value={filters.type} onChange={(event) => { updateFilter('type', event.target.value); updateFilter('categoryId', ''); }}><option value="">All types</option><option value="INCOME">Income</option><option value="EXPENSE">Expenses</option></select></label><label className="filter-select"><span>Category</span><select value={filters.categoryId} onChange={(event) => updateFilter('categoryId', event.target.value)}><option value="">All categories</option>{filteredCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label className="filter-select"><span>From</span><input type="date" value={filters.startDate} onChange={(event) => updateFilter('startDate', event.target.value)} /></label><label className="filter-select"><span>To</span><input type="date" value={filters.endDate} onChange={(event) => updateFilter('endDate', event.target.value)} /></label><label className="filter-select filter-sort"><span>Sort by</span><select value={`${filters.sortBy}:${filters.sortOrder}`} onChange={(event) => { const [sortBy, sortOrder] = event.target.value.split(':'); setFilters((previous) => ({ ...previous, sortBy, sortOrder })); setPagination((previous) => ({ ...previous, page: 1 })); }}><option value="transactionDate:desc">Newest first</option><option value="transactionDate:asc">Oldest first</option><option value="amount:desc">Highest amount</option><option value="amount:asc">Lowest amount</option><option value="description:asc">Description A–Z</option></select></label></div>
      {loading ? <div className="table-skeleton" /> : transactions.length ? <><div className="transaction-table-wrap"><table className="transaction-table"><thead><tr><th>Transaction</th><th>Category</th><th>Date</th><th>Type</th><th className="amount-column">Amount</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{transactions.map((item) => <tr key={item.id}><td><div className="transaction-cell-main"><span className={`transaction-icon ${item.type === 'INCOME' ? 'income' : 'expense'}`}><Icon name={item.type === 'INCOME' ? 'arrowDown' : 'arrowUp'} size={16} /></span><span><strong>{item.description}</strong><small>Ledger entry</small></span></div></td><td><span className="category-pill">{item.category?.name || 'Uncategorized'}</span></td><td className="date-cell">{formatDate(item.transactionDate, { month: 'short', day: 'numeric', year: 'numeric' })}</td><td><span className={`type-pill ${item.type === 'INCOME' ? 'type-income' : 'type-expense'}`}>{item.type === 'INCOME' ? 'Income' : 'Expense'}</span></td><td className={`amount-column ${item.type === 'INCOME' ? 'amount-income' : 'amount-expense'}`}>{item.type === 'INCOME' ? '+' : '−'}{formatMoney(item.amount)}</td><td><div className="table-actions"><button type="button" className="icon-button action-edit" aria-label={`Edit ${item.description}`} title="Edit" onClick={() => editTransaction(item)}><Icon name="edit" size={16} /></button><button type="button" className="icon-button action-delete" aria-label={`Delete ${item.description}`} title="Delete" onClick={() => removeTransaction(item.id)}><Icon name="trash" size={16} /></button></div></td></tr>)}</tbody></table></div><div className="pagination"><span>Showing <strong>{Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}</strong>–<strong>{Math.min(pagination.page * pagination.limit, pagination.total)}</strong> of <strong>{pagination.total}</strong></span><div><button type="button" className="button button-secondary pagination-button" disabled={pagination.page <= 1} onClick={() => setPagination((previous) => ({ ...previous, page: previous.page - 1 }))}><Icon name="arrowLeft" size={15} />Previous</button><span className="page-indicator">Page {pagination.page} of {pagination.totalPages}</span><button type="button" className="button button-secondary pagination-button" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination((previous) => ({ ...previous, page: previous.page + 1 }))}>Next<Icon name="arrowRight" size={15} /></button></div></div></> : <EmptyState icon="transactions" title="No transactions found" text={pagination.total ? 'Try adjusting your date range or filters.' : 'Start tracking the money coming into and going out of your business.'} action={<button className="button button-primary" type="button" onClick={() => setFormOpen(true)}><Icon name="plus" size={16} />Add transaction</button>} />}
    </section>
  </div>;
}

function CategoriesPage({ token }) {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ id: '', name: '', type: 'EXPENSE' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creatingStarterCategories, setCreatingStarterCategories] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function refresh() {
    try { const result = await apiFetch('/categories', token); setCategories(result || []); }
    catch (requestError) { setError(requestError.message || 'Unable to load categories.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); }, [token]);

  async function createStarterCategories() {
    if (categories.length || creatingStarterCategories) return;
    setCreatingStarterCategories(true); setError(''); setNotice('');
    try {
      const results = await Promise.allSettled(STARTER_CATEGORIES.map((category) => apiFetch('/categories', token, { method: 'POST', body: JSON.stringify(category) })));
      const created = results.filter((result) => result.status === 'fulfilled').length;
      await refresh();
      if (created === STARTER_CATEGORIES.length) setNotice('Starter business categories created. You can rename or add to them at any time.');
      else if (created > 0) setNotice(`${created} starter categories created. Review the list and add any missing categories.`);
      else setError('Starter categories could not be created. Check the API connection and try again.');
    } finally {
      setCreatingStarterCategories(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    try {
      const payload = { name: form.name.trim(), type: form.type };
      if (form.id) await apiFetch(`/categories/${form.id}`, token, { method: 'PATCH', body: JSON.stringify(payload) });
      else await apiFetch('/categories', token, { method: 'POST', body: JSON.stringify(payload) });
      setNotice(form.id ? 'Category updated.' : 'Category created.');
      setForm({ id: '', name: '', type: 'EXPENSE' }); await refresh();
    } catch (requestError) { setError(requestError.message || 'Unable to save category.'); }
    finally { setSaving(false); }
  }
  async function deleteCategory(category) {
    if (!window.confirm(`Delete “${category.name}”? Categories with transactions or budgets may not be deletable.`)) return;
    setError(''); setNotice('');
    try { await apiFetch(`/categories/${category.id}`, token, { method: 'DELETE' }); setNotice(`${category.name} deleted.`); await refresh(); }
    catch (requestError) { setError(requestError.message || 'Unable to delete category.'); }
  }
  const incomeCategories = categories.filter((category) => category.type === 'INCOME');
  const expenseCategories = categories.filter((category) => category.type === 'EXPENSE');

  return <div className="page-stack">
    <PageHeading eyebrow="LEDGER STRUCTURE" title="Categories" description="Give every business transaction a consistent place in your books." actions={!loading && categories.length === 0 && !error ? <button type="button" className="button button-secondary" onClick={createStarterCategories} disabled={creatingStarterCategories}><Icon name="spark" size={16} />{creatingStarterCategories ? 'Creating…' : 'Add starter categories'}</button> : null} />
    {notice && <div className="success-alert" role="status">{notice}</div>}{error && <div className="inline-alert page-alert" role="alert">{error}</div>}
    <div className="category-management-grid">
      <section className="panel category-editor"><div className="panel-heading"><div><span className="eyebrow">CUSTOMIZE YOUR LEDGER</span><h2>{form.id ? 'Edit category' : 'Create a category'}</h2><p>Use categories to understand your revenue and operating costs.</p></div><span className="panel-heading-icon"><Icon name="categories" size={19} /></span></div>
        <form className="category-form" onSubmit={handleSubmit}><label>Category name<input type="text" maxLength="60" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Software subscriptions" required /></label><label>Category type<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option value="EXPENSE">Business expense</option><option value="INCOME">Business income</option></select></label><p className="field-help">A category’s type should match the kind of transaction it describes.</p><div className="form-actions"><button className="button button-secondary" type="button" onClick={() => setForm({ id: '', name: '', type: 'EXPENSE' })}>Reset</button><button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : form.id ? 'Save category' : 'Create category'}</button></div></form>
      </section>
      <section className="panel category-guide"><span className="eyebrow">A PRACTICAL STARTING POINT</span><h2>Set up a useful chart of categories</h2><p>A little structure goes a long way. Keep names consistent and specific enough to make reports useful.</p><div className="guide-list"><div><span className="guide-dot guide-income"/><span><strong>Income</strong><small>Client payments, product sales, consulting</small></span></div><div><span className="guide-dot guide-expense"/><span><strong>Operating costs</strong><small>Payroll, rent, software, marketing, travel</small></span></div><div><span className="guide-dot guide-neutral"/><span><strong>Review monthly</strong><small>Merge duplicates and archive unused categories carefully</small></span></div></div></section>
    </div>
    <div className="category-columns">
      <CategoryList title="Income categories" subtitle={`${incomeCategories.length} categories`} type="INCOME" categories={incomeCategories} loading={loading} onEdit={(category) => { setForm({ id: category.id, name: category.name, type: category.type }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} onDelete={deleteCategory} />
      <CategoryList title="Expense categories" subtitle={`${expenseCategories.length} categories`} type="EXPENSE" categories={expenseCategories} loading={loading} onEdit={(category) => { setForm({ id: category.id, name: category.name, type: category.type }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} onDelete={deleteCategory} />
    </div>
  </div>;
}

function CategoryList({ title, subtitle, type, categories, loading, onEdit, onDelete }) {
  return <section className="panel category-list-panel"><div className="panel-heading"><div><h2>{title}</h2><p>{subtitle}</p></div><span className={`type-pill ${type === 'INCOME' ? 'type-income' : 'type-expense'}`}>{type === 'INCOME' ? 'Inflow' : 'Outflow'}</span></div>{loading ? <div className="list-skeleton" /> : categories.length ? <div className="managed-category-list">{categories.map((category) => <div className="managed-category-row" key={category.id}><span className={`category-symbol ${type === 'INCOME' ? 'category-symbol-income' : 'category-symbol-expense'}`}><Icon name={type === 'INCOME' ? 'arrowDown' : 'arrowUp'} size={16} /></span><span className="managed-category-name"><strong>{category.name}</strong><small>{type === 'INCOME' ? 'Revenue stream' : 'Operating expense'}</small></span><div className="table-actions"><button type="button" className="icon-button action-edit" onClick={() => onEdit(category)} title="Edit category" aria-label={`Edit ${category.name}`}><Icon name="edit" size={16} /></button><button type="button" className="icon-button action-delete" onClick={() => onDelete(category)} title="Delete category" aria-label={`Delete ${category.name}`}><Icon name="trash" size={16} /></button></div></div>)}</div> : <div className="small-empty">No {type.toLowerCase()} categories yet.</div>}</section>;
}

function BudgetPage({ token }) {
  const [planner, setPlanner] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [monthlyForm, setMonthlyForm] = useState({ incomeTarget: '', savingsTarget: '' });
  const [categoryForm, setCategoryForm] = useState({ id: '', categoryId: '', amount: '' });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth() + 1;
  const label = selectedDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  async function refresh() {
    setLoading(true);
    try {
      const [plannerData, categoryData] = await Promise.all([apiFetch(`/budgets/planner?year=${year}&month=${month}`, token), apiFetch('/categories', token)]);
      setPlanner(plannerData); setCategories(categoryData || []);
      setMonthlyForm({ incomeTarget: plannerData.incomeTarget ?? '', savingsTarget: plannerData.savingsTarget ?? '' });
      setError('');
    } catch (requestError) { setError(requestError.message || 'Unable to load budget planner.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); }, [token, year, month]);

  async function saveMonthly(event) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      await apiFetch('/budgets/monthly', token, { method: 'PUT', body: JSON.stringify({ incomeTarget: Number(monthlyForm.incomeTarget || 0), savingsTarget: Number(monthlyForm.savingsTarget || 0), month, year }) });
      setNotice('Monthly targets saved.'); await refresh();
    } catch (requestError) { setError(requestError.message || 'Unable to save monthly targets.'); }
    finally { setBusy(false); }
  }
  async function saveCategory(event) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      const payload = { categoryId: categoryForm.categoryId, month, year, amount: Number(categoryForm.amount) };
      if (categoryForm.id) await apiFetch(`/budgets/${categoryForm.id}`, token, { method: 'PATCH', body: JSON.stringify({ amount: payload.amount }) });
      else await apiFetch('/budgets', token, { method: 'POST', body: JSON.stringify(payload) });
      setCategoryForm({ id: '', categoryId: '', amount: '' }); setNotice('Category budget saved.'); await refresh();
    } catch (requestError) { setError(requestError.message || 'Unable to save category budget.'); }
    finally { setBusy(false); }
  }
  async function removeBudget(id) {
    if (!window.confirm('Remove this category budget?')) return;
    setError(''); setNotice('');
    try { await apiFetch(`/budgets/${id}`, token, { method: 'DELETE' }); setNotice('Category budget removed.'); await refresh(); }
    catch (requestError) { setError(requestError.message || 'Unable to remove budget.'); }
  }
  async function suggestBudget() {
    if (!planner) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const income = Number(monthlyForm.incomeTarget || planner.totalIncome || 0);
      if (income <= 0) {
        setError('Enter a revenue target or record business income before suggesting allocations.');
        setBusy(false);
        return;
      }
      await Promise.all(planner.categories.map((item) => {
        const amount = getSuggestedBudgetAmount(item.category, income);
        if (amount === null) return Promise.resolve();
        if (item.id) return apiFetch(`/budgets/${item.id}`, token, { method: 'PATCH', body: JSON.stringify({ amount }) });
        return apiFetch('/budgets', token, { method: 'POST', body: JSON.stringify({ categoryId: item.categoryId, month, year, amount }) });
      }));
      const savingsTarget = getSuggestedSavingsTarget(income);
      const nextMonthlyForm = { incomeTarget: income, savingsTarget };
      setMonthlyForm(nextMonthlyForm);
      await apiFetch('/budgets/monthly', token, { method: 'PUT', body: JSON.stringify({ ...nextMonthlyForm, month, year }) });
      setNotice('Suggested allocations applied. Review the amounts before relying on this plan.'); await refresh();
    } catch (requestError) { setError(requestError.message || 'Unable to generate suggested budget.'); }
    finally { setBusy(false); }
  }
  function shiftMonth(offset) { setSelectedDate(new Date(year, selectedDate.getMonth() + offset, 1)); setNotice(''); }

  const totalBudget = planner?.categories?.reduce((sum, item) => sum + Number(item.budget || 0), 0) || 0;
  const totalSpent = Number(planner?.totalExpenses || 0);
  const remainingBudget = totalBudget - totalSpent;
  return <div className="page-stack">
    <PageHeading eyebrow="PLANNING & CONTROL" title="Budget planner" description="Set monthly goals and keep operating costs aligned with your business plan." actions={<div className="month-switcher"><button type="button" className="icon-button" onClick={() => shiftMonth(-1)} aria-label="Previous month"><Icon name="arrowLeft" size={18} /></button><strong>{label}</strong><button type="button" className="icon-button" onClick={() => shiftMonth(1)} aria-label="Next month"><Icon name="arrowRight" size={18} /></button></div>} />
    {notice && <div className="success-alert" role="status">{notice}</div>}{error && <div className="inline-alert page-alert" role="alert">{error}</div>}
    {loading && !planner ? <section className="panel loading-panel">Loading budget plan…</section> : planner && <>
      <section className="budget-overview-card"><div className="budget-overview-top"><div><span className="eyebrow eyebrow-light">MONTHLY POSITION</span><h2>{formatMoney(planner.remaining)}</h2><p>Net after actual expenses and planned reserve</p></div><div className={`budget-health-badge ${planner.healthStatus === 'Over Budget' ? 'health-over' : planner.healthStatus === 'Near Limit' ? 'health-near' : 'health-good'}`}><span />{planner.healthStatus}</div></div><div className="budget-stat-row"><div><span>Actual revenue</span><strong>{formatMoney(planner.totalIncome)}</strong></div><div><span>Actual expenses</span><strong>{formatMoney(planner.totalExpenses)}</strong></div><div><span>Reserve goal</span><strong>{formatMoney(planner.savingsTarget)}</strong></div><div><span>Available after bills</span><strong>{formatMoney(planner.availableToSpend)}</strong></div></div></section>
      <div className="budget-planning-grid"><section className="panel"><div className="panel-heading"><div><span className="eyebrow">MONTHLY TARGETS</span><h2>Set your plan</h2><p>Targets help you compare plan with actual results.</p></div><span className="panel-heading-icon"><Icon name="budget" size={19} /></span></div><form className="budget-target-form" onSubmit={saveMonthly}><label>Revenue target<div className="money-input"><span>$</span><input type="number" min="0" step="0.01" value={monthlyForm.incomeTarget} onChange={(event) => setMonthlyForm({ ...monthlyForm, incomeTarget: event.target.value })} placeholder="0.00" /></div></label><label>Cash reserve target<div className="money-input"><span>$</span><input type="number" min="0" step="0.01" value={monthlyForm.savingsTarget} onChange={(event) => setMonthlyForm({ ...monthlyForm, savingsTarget: event.target.value })} placeholder="0.00" /></div></label><button type="submit" className="button button-primary" disabled={busy}>Save targets</button></form><div className="plan-assignment"><div><span>Budget assigned</span><strong>{formatMoney(planner.totalAssigned)}</strong></div><div><span>Unallocated</span><strong className={Number(planner.unassigned) < 0 ? 'amount-expense' : ''}>{formatMoney(planner.unassigned)}</strong></div></div><button type="button" className="button button-secondary suggestion-button" onClick={suggestBudget} disabled={busy}><Icon name="spark" size={16} />{busy ? 'Applying…' : 'Suggest allocations'}</button><p className="field-help">Suggestions are a starting point based on category names, not professional financial advice.</p></section>
      <section className="panel budget-at-a-glance"><div className="panel-heading"><div><span className="eyebrow">BUDGET PULSE</span><h2>Spending at a glance</h2><p>Expense budgets and actual spending for the month.</p></div></div><div className="budget-pulse-main"><div className="budget-pulse-chart" style={{ '--pulse-percent': `${totalBudget > 0 ? Math.max(0, Math.min(100, totalSpent / totalBudget * 100)) : 0}%` }}><div><strong>{totalBudget > 0 ? `${Math.round(totalSpent / totalBudget * 100)}%` : '—'}</strong><small>used</small></div></div><div className="budget-pulse-copy"><span>Actual spend</span><strong>{formatMoney(totalSpent)}</strong><span>Budget allocation</span><strong>{formatMoney(totalBudget)}</strong><span>Remaining allocation</span><strong className={remainingBudget < 0 ? 'amount-expense' : 'amount-income'}>{formatMoney(remainingBudget)}</strong></div></div><div className="budget-pulse-note"><span className="note-dot"/><span>{totalBudget ? (remainingBudget < 0 ? 'Actual expenses have exceeded the current category budget allocation.' : 'Your total actual expenses are within your current category allocation.') : 'Add category budgets to track spending against a plan.'}</span></div></section></div>
      <section className="panel budget-category-panel"><div className="panel-heading"><div><span className="eyebrow">PLANNED VS. ACTUAL</span><h2>Category allocations</h2><p>Set a limit for each operating cost and monitor how much remains.</p></div><span className="record-count"><span className="record-count-dot" />{planner.categories.length} categories</span></div><form className="budget-category-form" onSubmit={saveCategory}><label>Expense category<select value={categoryForm.categoryId} onChange={(event) => setCategoryForm({ ...categoryForm, categoryId: event.target.value })} required><option value="">Select category</option>{categories.filter((category) => category.type === 'EXPENSE').map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label>Monthly allocation<div className="money-input"><span>$</span><input type="number" min="0.01" step="0.01" value={categoryForm.amount} onChange={(event) => setCategoryForm({ ...categoryForm, amount: event.target.value })} placeholder="0.00" required /></div></label><button className="button button-primary" type="submit" disabled={busy || !categoryForm.categoryId}>{categoryForm.id ? 'Save allocation' : 'Add allocation'}</button><button className="button button-secondary" type="button" onClick={() => setCategoryForm({ id: '', categoryId: '', amount: '' })}>Clear</button></form><div className="budget-category-list">{planner.categories.length ? planner.categories.map((item) => <div className="budget-category-row" key={item.categoryId}><div className="budget-category-identity"><span className="category-symbol category-symbol-expense"><Icon name="budget" size={16} /></span><span><strong>{item.category}</strong><small>{Number(item.percentageUsed || 0)}% of budget used</small></span></div><div className="budget-row-amounts"><strong>{formatMoney(item.spent)}</strong><span>of {formatMoney(item.budget)}</span></div><div className="budget-row-progress"><div className="bar-track budget-track"><span className={Number(item.percentageUsed) >= 100 ? 'over' : Number(item.percentageUsed) >= 80 ? 'near' : ''} style={{ width: `${Math.min(Number(item.percentageUsed || 0), 100)}%` }} /></div><small className={item.remaining < 0 ? 'amount-expense' : ''}>{item.remaining < 0 ? `${formatMoney(Math.abs(item.remaining))} over` : `${formatMoney(item.remaining)} left`}</small></div><span className={`status-badge ${item.status === 'Over Budget' ? 'status-over' : item.status === 'Near Limit' ? 'status-near' : 'status-good'}`}>{item.status}</span><div className="table-actions">{item.id ? <><button type="button" className="icon-button action-edit" title="Edit allocation" aria-label={`Edit ${item.category} allocation`} onClick={() => setCategoryForm({ id: item.id, categoryId: item.categoryId, amount: String(item.budget) })}><Icon name="edit" size={16} /></button><button type="button" className="icon-button action-delete" title="Delete allocation" aria-label={`Delete ${item.category} allocation`} onClick={() => removeBudget(item.id)}><Icon name="trash" size={16} /></button></> : <button type="button" className="button button-secondary assign-button" onClick={() => setCategoryForm({ id: '', categoryId: item.categoryId, amount: '' })}>Assign</button>}</div></div>) : <div className="small-empty">No expense categories have been created yet. Add categories before setting allocations.</div>}</div></section>
      <section className="panel upcoming-panel"><div className="panel-heading"><div><span className="eyebrow">UPCOMING COMMITMENTS</span><h2>Scheduled expenses</h2><p>Expense entries dated later in the selected month.</p></div><div className="upcoming-total"><span>Recorded ahead</span><strong>{formatMoney(planner.upcomingBills)}</strong></div></div>{planner.upcomingTransactions.length ? <div className="upcoming-list">{planner.upcomingTransactions.map((bill, index) => <div className="upcoming-row" key={`${bill.description}-${bill.dueDate}-${index}`}><span className="upcoming-calendar"><Icon name="calendar" size={17} /></span><span className="upcoming-description"><strong>{bill.description}</strong><small>{bill.category} · {formatDate(bill.dueDate)}</small></span><strong className="amount-expense">−{formatMoney(bill.amount)}</strong></div>)}</div> : <div className="small-empty">No future-dated expenses in this month. Add a dated transaction to plan around an upcoming commitment.</div>}</section>
    </>}
  </div>;
}

export default App;
