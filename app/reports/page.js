'use client';

import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';

const MONTHLY_DATA = [
  { month: 'Jan', income: 6300, expenses: 5485 },
  { month: 'Feb', income: 9900, expenses: 7140 },
  { month: 'Mar', income: 6900, expenses: 2240 },
  { month: 'Apr', income: 2400, expenses: 1800 },
  { month: 'May', income: 1500, expenses: 900  },
];

const CATEGORY_DATA = [
  { name: 'Housing / Rent',  value: 6300, color: '#4a90d9' },
  { name: 'Nationals Dues',  value: 2500, color: '#c9a84c' },
  { name: 'Social Events',   value: 2240, color: '#a78bfa' },
  { name: 'Recruitment',     value: 1500, color: '#f5a623' },
  { name: 'Insurance',       value: 1000, color: '#2ecc8a' },
  { name: 'Philanthropy',    value: 900,  color: '#e05c5c' },
  { name: 'Operations',      value: 425,  color: '#8a97a8' },
];

const BALANCE_DATA = [
  { week: 'Jan 1',  balance: 8200  },
  { week: 'Jan 15', balance: 5400  },
  { week: 'Feb 1',  balance: 9800  },
  { week: 'Feb 15', balance: 4200  },
  { week: 'Mar 1',  balance: 8600  },
  { week: 'Mar 15', balance: 6900  },
  { week: 'Apr 1',  balance: 7500  },
  { week: 'Apr 15', balance: 6200  },
  { week: 'May 1',  balance: 6800  },
  { week: 'May 15', balance: 7235  },
];

const SEMESTER_STATS = {
  totalIn:      17100,
  totalOut:     14865,
  net:          2235,
  budgetLeft:   3635,
  members:      34,
  transactions: 24,
  unreconciled: 4,
};

const RECENT_TRANSACTIONS = [
  { date: 'Mar 5',  desc: 'Spring Dues — Batch 4',         cat: 'Dues Collected',  type: 'income',  amount: 3300 },
  { date: 'Mar 1',  desc: 'Spring Dues — Batch 3',         cat: 'Dues Collected',  type: 'income',  amount: 3600 },
  { date: 'Feb 28', desc: 'Venue Deposit — Spring Formal', cat: 'Social Events',   type: 'expense', amount: 1200 },
  { date: 'Feb 28', desc: 'Monthly House Payment',         cat: 'Housing / Rent',  type: 'expense', amount: 2100 },
  { date: 'Feb 26', desc: 'Chapter Meeting Dinner',        cat: 'Operations',      type: 'expense', amount: 340  },
  { date: 'Feb 24', desc: 'Spring Dues — Batch 2',         cat: 'Dues Collected',  type: 'income',  amount: 3000 },
  { date: 'Feb 20', desc: 'Nationals Per-Member Fee',      cat: 'Nationals Dues',  type: 'expense', amount: 2500 },
  { date: 'Feb 18', desc: 'Liability Insurance Premium',   cat: 'Insurance',       type: 'expense', amount: 600  },
];

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
  const [activeIndex, setActiveIndex] = useState(null);
  const [exportToast, setExportToast] = useState('');

  const totalExpenses = CATEGORY_DATA.reduce((s, c) => s + c.value, 0);
  const categoryDataWithPct = CATEGORY_DATA.map(c => ({
    ...c,
    pct: Math.round(c.value / totalExpenses * 100),
  }));

  function showExportToast(msg) {
    setExportToast(msg);
    setTimeout(() => setExportToast(''), 3000);
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f5f7fa', fontFamily: "'DM Sans', sans-serif" }}>
      <Sidebar activePage="reports" />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* TOPBAR */}
        <div style={{ padding: '20px 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#0d1b2a' }}>Reports</div>
            <div style={{ fontSize: 12, color: '#8a97a8', marginTop: 2 }}>Spring 2025 · Financial Summary</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => showExportToast('📄 PDF report exported!')} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #dce3eb', background: '#ffffff', color: '#0d1b2a', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
              Export PDF
            </button>
            <button onClick={() => showExportToast('📦 Treasurer handoff package exported!')} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#0d1b2a', color: '#ffffff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Treasurer Handoff
            </button>
          </div>
        </div>

        {/* STAT CARDS */}
        <div style={{ padding: '16px 28px 0', flexShrink: 0 }}>
          <div className="stats-row">
            <StatCard label="TOTAL IN"    value={`$${SEMESTER_STATS.totalIn.toLocaleString()}`}    sub="Dues + other income"   colorClass="green" valueColor="#0d1b2a" />
            <StatCard label="TOTAL OUT"   value={`$${SEMESTER_STATS.totalOut.toLocaleString()}`}   sub="All expenses"          colorClass="red" />
            <StatCard label="NET BALANCE" value={`$${SEMESTER_STATS.net.toLocaleString()}`}        sub="This semester"         colorClass="blue" />
            <StatCard label="BUDGET LEFT" value={`$${SEMESTER_STATS.budgetLeft.toLocaleString()}`} sub="Across all categories" colorClass="gold" valueColor="#0d1b2a" />
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
                <BarChart data={MONTHLY_DATA} barCategoryGap="30%" barGap={4}>
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
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0d1b2a', marginBottom: 16 }}>Spending by Category</div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ flexShrink: 0 }}>
                    <ResponsiveContainer width={160} height={160}>
                      <PieChart>
                        <Pie
                          data={categoryDataWithPct}
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
                  <LineChart data={BALANCE_DATA}>
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
                  { label: 'Active Members',       value: SEMESTER_STATS.members },
                  { label: 'Transactions',          value: SEMESTER_STATS.transactions },
                  { label: 'Unreconciled',          value: SEMESTER_STATS.unreconciled, warn: true },
                  { label: 'Avg Expense',           value: `$${Math.round(SEMESTER_STATS.totalOut / SEMESTER_STATS.transactions).toLocaleString()}` },
                  { label: 'Dues Collection Rate',  value: '89%', good: true },
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
                <button onClick={() => showExportToast('📄 PDF report exported!')} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #dce3eb', background: '#f8f9fb', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0d1b2a', marginBottom: 2 }}>📄 Export PDF Report</div>
                  <div style={{ fontSize: 11, color: '#8a97a8' }}>Full semester summary with charts</div>
                </button>
                <button onClick={() => showExportToast('📊 CSV exported!')} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #dce3eb', background: '#f8f9fb', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0d1b2a', marginBottom: 2 }}>📊 Export CSV</div>
                  <div style={{ fontSize: 11, color: '#8a97a8' }}>Raw transaction data for Excel</div>
                </button>
                <button onClick={() => showExportToast('📦 Treasurer handoff package exported!')} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: 'none', background: '#0d1b2a', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff', marginBottom: 2 }}>📦 Treasurer Handoff</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Summary + transactions + budget report</div>
                </button>
              </div>
            </div>

            {/* RECENT TRANSACTIONS */}
            <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #eef0f4', flexShrink: 0 }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #eef0f4', fontSize: 12, fontWeight: 600, color: '#0d1b2a' }}>Recent Transactions</div>
              <div>
                {RECENT_TRANSACTIONS.map((tx, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: i < RECENT_TRANSACTIONS.length - 1 ? '1px solid #f3f5f8' : 'none' }}>
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