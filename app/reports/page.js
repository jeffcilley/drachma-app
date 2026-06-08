'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';

// Data now loaded from Supabase
const SEMESTER = 'Spring 2026';

function CustomBarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#ffffff', marginBottom: 6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.fill }} />
          {p.name}: <span style={{ color: '#ffffff', fontWeight: 600 }}>${p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

function CustomPieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#ffffff', marginBottom: 4 }}>{payload[0].name}</div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
        ${payload[0].value.toLocaleString()} · <span style={{ color: '#c9a84c' }}>{payload[0].payload.pct}%</span>
      </div>
    </div>
  );
}

function CustomLineTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#ffffff', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
        Balance: <span style={{ color: '#2ecc8a', fontWeight: 600 }}>${payload[0].value.toLocaleString()}</span>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const { dbUser } = useAuth();
  const [activeIndex, setActiveIndex] = useState(null);
  const [exportToast, setExportToast] = useState('');
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [balanceData, setBalanceData] = useState([]);
  const [semesterStats, setSemesterStats] = useState({
    totalIn: 0, totalOut: 0, net: 0, budgetLeft: 0,
    members: 0, transactions: 0, unreconciled: 0, collectionRate: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState([]);

  useEffect(() => {
    if (!dbUser?.chapter_id) return;
    fetchData();
  }, [dbUser]);

  async function fetchData() {
    setLoading(true);

    const [txRes, catRes, membersRes, duesRes] = await Promise.all([
      supabase.from('transactions').select('*').eq('chapter_id', dbUser.chapter_id).order('date', { ascending: true }),
      supabase.from('budget_categories').select('*').eq('chapter_id', dbUser.chapter_id),
      supabase.from('members').select('id, status').eq('chapter_id', dbUser.chapter_id),
      supabase.from('dues_payments').select('*').eq('chapter_id', dbUser.chapter_id),
    ]);

    const transactions = txRes.data || [];
    const categories = catRes.data || [];
    const members = membersRes.data || [];
    const dues = duesRes.data || [];

    // ── STATS ──────────────────────────────────────────────
    const totalIn = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const totalOut = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    const totalBudgeted = categories.reduce((s, c) => s + Number(c.budgeted_amount), 0);
    const unreconciled = transactions.filter(t => !t.verified).length;
    const activeMembers = members.filter(m => m.status !== 'dropped').length;
    const semDues = dues.filter(d => d.semester === SEMESTER);
    const paidDues = semDues.filter(d => d.status === 'paid').length;
    const collectionRate = semDues.length > 0 ? Math.round(paidDues / semDues.length * 100) : 0;

    setSemesterStats({
      totalIn, totalOut, net: totalIn - totalOut,
      budgetLeft: totalBudgeted - totalOut,
      members: activeMembers,
      transactions: transactions.length,
      unreconciled,
      collectionRate,
    });

    // ── MONTHLY DATA ───────────────────────────────────────
    const monthMap = {};
    transactions.forEach(tx => {
      const month = new Date(tx.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short' });
      if (!monthMap[month]) monthMap[month] = { month, income: 0, expenses: 0 };
      if (tx.type === 'income') monthMap[month].income += Number(tx.amount);
      else monthMap[month].expenses += Number(tx.amount);
    });
    setMonthlyData(Object.values(monthMap));

    // ── CATEGORY SPENDING ──────────────────────────────────
    const spentMap = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      if (t.category_id) spentMap[t.category_id] = (spentMap[t.category_id] || 0) + Number(t.amount);
    });
    const COLORS = ['#4a90d9','#c9a84c','#a78bfa','#f5a623','#2ecc8a','#e05c5c','#8a97a8'];
    const catData = categories
      .filter(c => spentMap[c.id] > 0)
      .map((c, i) => ({
        name: c.name,
        value: spentMap[c.id] || 0,
        color: c.color || COLORS[i % COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);

    // Add uncategorized expenses as a catch-all slice
    const uncategorizedTotal = transactions
      .filter(t => t.type === 'expense' && !t.category_id)
      .reduce((s, t) => s + Number(t.amount), 0);

    if (uncategorizedTotal > 0) {
      catData.push({ name: 'Uncategorized', value: uncategorizedTotal, color: '#dce3eb' });
    }

    setCategoryData(catData);

    // ── RUNNING BALANCE ────────────────────────────────────
    let bal = 0;
    const balData = transactions.map(tx => {
      bal += tx.type === 'income' ? Number(tx.amount) : -Number(tx.amount);
      return {
        week: new Date(tx.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        balance: bal,
      };
    });
    setBalanceData(balData);

    // ── RECENT TRANSACTIONS ────────────────────────────────
    const recent = [...transactions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 8)
      .map(tx => ({
        date: new Date(tx.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        desc: tx.description,
        cat: categories.find(c => c.id === tx.category_id)?.name || 'Uncategorized',
        type: tx.type,
        amount: Number(tx.amount),
      }));
    setRecentTransactions(recent);

    setLoading(false);
  }

  const totalExpenses = categoryData.reduce((s, c) => s + c.value, 0);
  const categoryDataWithPct = categoryData.map(c => ({
    ...c,
    pct: Math.round(c.value / totalExpenses * 100),
  }));

  function showExportToast(msg) {
    setExportToast(msg);
    setTimeout(() => setExportToast(''), 3000);
  }

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 32, color: '#0d1b2a', marginBottom: 12 }}>Drach<span style={{ color: '#c9a84c' }}>m</span>a</div>
        <div style={{ fontSize: 13, color: '#8a97a8' }}>Loading reports...</div>
      </div>
    </div>
  );

  return (
    <ProtectedRoute>
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f5f7fa', fontFamily: "'DM Sans', sans-serif" }}>
      <Sidebar activePage="reports" />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* TOPBAR */}
        <div style={{ padding: '20px 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#0d1b2a' }}>Reports</div>
            <div style={{ fontSize: 12, color: '#8a97a8', marginTop: 2 }}>{SEMESTER} · Financial Summary</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => showExportToast('PDF export coming soon!')} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #dce3eb', background: '#ffffff', color: '#0d1b2a', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
              Export PDF
            </button>
            <button onClick={() => showExportToast('Treasurer handoff package coming soon!')} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#0d1b2a', color: '#ffffff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Treasurer Handoff
            </button>
          </div>
        </div>

        {/* STAT CARDS */}
        <div style={{ padding: '16px 28px 0', flexShrink: 0 }}>
          <div className="stats-row">
            <StatCard label="TOTAL IN"    value={`$${semesterStats.totalIn.toLocaleString()}`}    sub="Dues + other income"   colorClass="green" valueColor="#0d1b2a" />
            <StatCard label="TOTAL OUT"   value={`$${semesterStats.totalOut.toLocaleString()}`}   sub="All expenses"          colorClass="red" />
            <StatCard label="NET BALANCE" value={`$${semesterStats.net.toLocaleString()}`}        sub="This semester"         colorClass="blue" />
            <StatCard label="BUDGET LEFT" value={`$${semesterStats.budgetLeft.toLocaleString()}`} sub="Across all categories" colorClass="gold" valueColor="#0d1b2a" />
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, display: 'flex', gap: 16, padding: '16px 28px 20px', overflow: 'hidden', minHeight: 0 }}>

          {/* LEFT COLUMN */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', minWidth: 0 }}>

            {/* BAR CHART */}
            <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #eef0f4', padding: 20, flexShrink: 0, outline: 'none' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0d1b2a', marginBottom: 16 }}>Monthly Income vs Expenses</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyData} barCategoryGap="30%" barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f3f7" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8a97a8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#8a97a8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#8a97a8', paddingTop: 12 }} />
                  <Bar dataKey="expenses" name="Expenses" fill="#e05c5c" radius={[4,4,0,0]} />
                  <Bar dataKey="income"   name="Income"   fill="#2ecc8a" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* DONUT + LINE CHART ROW */}
            <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>

              {/* DONUT CHART */}
              <div style={{ flex: 1, background: '#ffffff', borderRadius: 12, border: '1px solid #eef0f4', padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0d1b2a', marginBottom: 4 }}>Spending by Category</div>
              <div style={{ fontSize: 11, color: '#8a97a8', marginBottom: 12 }}>Best practice: categorize all expenses for accurate reporting.</div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ flexShrink: 0 }}>
                    <ResponsiveContainer width={160} height={160}>
                      <PieChart>
                        <Pie
                          data={categoryDataWithPct.length > 0 ? categoryDataWithPct : [{ name: 'No data', value: 1, color: '#eef0f4' }]}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={72}
                          paddingAngle={2}
                          dataKey="value"
                          onMouseEnter={(_, index) => setActiveIndex(index)}
                          onMouseLeave={() => setActiveIndex(null)}
                        >
                          {categoryDataWithPct.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={entry.color}
                              opacity={activeIndex === null || activeIndex === index ? 1 : 0.4}
                              stroke="none"
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {categoryDataWithPct.map((cat, index) => (
                      <div
                        key={cat.name}
                        onMouseEnter={() => setActiveIndex(index)}
                        onMouseLeave={() => setActiveIndex(null)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          opacity: activeIndex === null || activeIndex === index ? 1 : 0.4,
                          transition: 'opacity 0.15s', cursor: 'default',
                        }}
                      >
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                        <div style={{ flex: 1, fontSize: 11, color: '#0d1b2a' }}>{cat.name}</div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#0d1b2a' }}>${cat.value.toLocaleString()}</div>
                        <div style={{ fontSize: 10, color: '#8a97a8', width: 28, textAlign: 'right' }}>{cat.pct}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* LINE CHART — RUNNING BALANCE */}
              <div style={{ flex: 1, background: '#ffffff', borderRadius: 12, border: '1px solid #eef0f4', padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0d1b2a', marginBottom: 4 }}>Running Balance</div>
                <div style={{ fontSize: 11, color: '#8a97a8', marginBottom: 16 }}>Account balance trend across the semester</div>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={balanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f3f7" vertical={false} />
                    <XAxis dataKey="week" tick={{ fontSize: 9, fill: '#8a97a8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#8a97a8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomLineTooltip />} cursor={{ stroke: '#dce3eb' }} />
                    <Line
                      type="monotone"
                      dataKey="balance"
                      stroke="#2ecc8a"
                      strokeWidth={2.5}
                      dot={{ fill: '#2ecc8a', r: 3, strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: '#2ecc8a' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ width: 300, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', flexShrink: 0 }}>

            {/* SEMESTER SUMMARY */}
            <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #eef0f4', padding: 16, flexShrink: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#0d1b2a', marginBottom: 14 }}>Semester Summary</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Active Members',       value: semesterStats.members },
                  { label: 'Transactions',          value: semesterStats.transactions },
                  { label: 'Unreconciled',          value: semesterStats.unreconciled, warn: true },
                  { label: 'Avg Expense',           value: semesterStats.transactions > 0 ? `$${Math.round(semesterStats.totalOut / semesterStats.transactions).toLocaleString()}` : '$0' },
                  { label: 'Dues Collection Rate',  value: `${semesterStats.collectionRate}%`, good: true },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f3f5f8' }}>
                    <span style={{ fontSize: 12, color: '#8a97a8' }}>{row.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: row.warn ? '#e05c5c' : row.good ? '#1a7a52' : '#0d1b2a' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* EXPORT OPTIONS */}
            <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #eef0f4', padding: 16, flexShrink: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#0d1b2a', marginBottom: 14 }}>Export Options</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button onClick={() => showExportToast('PDF export coming soon!')} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #dce3eb', background: '#f8f9fb', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0d1b2a', marginBottom: 2 }}>📄 Export PDF Report</div>
                  <div style={{ fontSize: 11, color: '#8a97a8' }}>Full semester summary with charts</div>
                </button>
                <button onClick={() => showExportToast('CSV export coming soon!')} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #dce3eb', background: '#f8f9fb', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0d1b2a', marginBottom: 2 }}>📊 Export CSV</div>
                  <div style={{ fontSize: 11, color: '#8a97a8' }}>Raw transaction data for Excel</div>
                </button>
                <button onClick={() => showExportToast('Treasurer handoff package coming soon!')} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: 'none', background: '#0d1b2a', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff', marginBottom: 2 }}>📦 Treasurer Handoff</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Summary + transactions + budget report</div>
                </button>
              </div>
            </div>

            {/* RECENT TRANSACTIONS */}
            <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #eef0f4', flexShrink: 0 }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #eef0f4', fontSize: 12, fontWeight: 600, color: '#0d1b2a' }}>Recent Transactions</div>
              <div>
                {recentTransactions.map((tx, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: i < recentTransactions.length - 1 ? '1px solid #f3f5f8' : 'none' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: '#0d1b2a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.desc}</div>
                      <div style={{ fontSize: 10, color: '#8a97a8', marginTop: 1 }}>{tx.cat} · {tx.date}</div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: tx.type === 'income' ? '#1a7a52' : '#0d1b2a', flexShrink: 0 }}>
                      {tx.type === 'income' ? '+' : '−'}${tx.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* TOAST */}
      {exportToast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          background: '#0d1b2a', color: '#ffffff', padding: '14px 20px',
          borderRadius: 12, fontSize: 13, fontWeight: 500, zIndex: 200,
          boxShadow: '0 8px 40px rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.1)',
        }}>
          {exportToast}
        </div>
      )}

    </div>
    </ProtectedRoute>
  );
}

function StatCard({ label, value, sub, colorClass, valueColor }) {
  return (
    <div className={`stat-card ${colorClass}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={valueColor ? { color: valueColor } : undefined}>{value}</div>
      <div className="stat-sub">{sub}</div>
    </div>
  );
}