'use client';

import { useState } from 'react';

const BUDGET_DATA = [
  { name: 'Housing / Rent',  spent: 6300, budgeted: 6000, color: '#4a90d9' },
  { name: 'Nationals Dues',  spent: 2500, budgeted: 2500, color: '#c9a84c' },
  { name: 'Social Events',   spent: 2240, budgeted: 3000, color: '#a78bfa' },
  { name: 'Recruitment',     spent: 1500, budgeted: 2500, color: '#f5a623' },
  { name: 'Insurance',       spent: 1000, budgeted: 1200, color: '#2ecc8a' },
  { name: 'Philanthropy',    spent: 900,  budgeted: 1500, color: '#e05c5c' },
  { name: 'Operations',      spent: 425,  budgeted: 1300, color: '#8a97a8' },
];

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

const UPCOMING_EVENTS = [
  { name: 'Spring Formal',    date: 'Apr 15', status: 'active',   spent: 2140, budgeted: 5000 },
  { name: 'Philanthropy 5K',  date: 'Apr 22', status: 'approved', spent: 150,  budgeted: 1500 },
  { name: 'Rush Week Kickoff',date: 'Aug 25', status: 'draft',    spent: 0,    budgeted: 2000 },
];

const STATUS_CONFIG = {
  draft:    { label: 'Draft',    color: '#8a97a8', bg: '#f0f3f7' },
  approved: { label: 'Approved', color: '#4a90d9', bg: '#eaf2fb' },
  active:   { label: 'Active',   color: '#f5a623', bg: '#fff8ee' },
  complete: { label: 'Complete', color: '#2ecc8a', bg: '#e8f5ee' },
};

export default function AdvisorPortalPage() {
  const [showContactModal, setShowContactModal] = useState(false);

  const totalIn = 17100;
  const totalOut = 14865;
  const net = totalIn - totalOut;
  const unreconciled = 4;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', fontFamily: "'DM Sans', sans-serif" }}>

      {/* TOP BANNER */}
      <div style={{ background: '#0d1b2a', padding: '0 28px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <a href="/dashboard" style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 400, color: '#ffffff', letterSpacing: '0.05em', textDecoration: 'none' }}>
            Drach<span style={{ color: '#c9a84c' }}>m</span>a
          </a>
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
            Advisor Portal · Spring 2026
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 100, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
            👁 Read-only view — Coming Soon
          </div>
          <a href="/dashboard" style={{ fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 7, background: 'rgba(255,255,255,0.1)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', textDecoration: 'none' }}>
            ← Back to Dashboard
          </a>
        </div>
      </div>

      {/* PAGE HEADER */}
      <div style={{ padding: '24px 28px 0' }}>
        <div style={{ fontSize: 22, fontWeight: 600, color: '#0d1b2a' }}>Chapter Financial Overview</div>
        <div style={{ fontSize: 12, color: '#8a97a8', marginTop: 2 }}>Spring 2026 · Advisor & President View</div>
      </div>

      {/* STAT CARDS */}
      <div style={{ padding: '16px 28px 0' }}>
        <div className="stats-row">
          <StatCard label="TOTAL IN"      value={`$${totalIn.toLocaleString()}`}  sub="Dues + other income"  colorClass="green" valueColor="#0d1b2a" />
          <StatCard label="TOTAL OUT"     value={`$${totalOut.toLocaleString()}`} sub="All expenses"         colorClass="red" />
          <StatCard label="NET BALANCE"   value={`$${net.toLocaleString()}`}      sub="This semester"        colorClass="blue" />
          <StatCard label="UNRECONCILED"  value={String(unreconciled)}            sub="Missing receipts"     colorClass="gold" valueColor="#0d1b2a" />
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ display: 'flex', gap: 16, padding: '16px 28px 28px' }}>

        {/* LEFT COLUMN */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>

          {/* BUDGET IMPACT */}
          <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #eef0f4', padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0d1b2a', marginBottom: 16 }}>Budget by Category</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {BUDGET_DATA.map(cat => {
                const pct = Math.min(Math.round(cat.spent / cat.budgeted * 100), 100);
                const isOver = cat.spent > cat.budgeted;
                return (
                  <div key={cat.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, fontWeight: 500, color: '#0d1b2a' }}>{cat.name}</span>
                        {isOver && <span style={{ fontSize: 10, fontWeight: 600, color: '#e05c5c', background: '#fde8e8', padding: '1px 6px', borderRadius: 100 }}>Over budget</span>}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: isOver ? '#c03c3c' : pct >= 80 ? '#8b5e0a' : '#8a97a8' }}>{pct}%</span>
                    </div>
                    <div style={{ height: 6, background: '#eef0f4', borderRadius: 100, overflow: 'hidden', marginBottom: 4 }}>
                      <div style={{ width: pct + '%', height: '100%', background: isOver ? '#e05c5c' : cat.color, borderRadius: 100, transition: 'width 0.3s ease' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 10, color: '#8a97a8' }}>${cat.spent.toLocaleString()} spent</span>
                      <span style={{ fontSize: 10, color: '#8a97a8' }}>of ${cat.budgeted.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RECENT TRANSACTIONS */}
          <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #eef0f4', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #eef0f4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0d1b2a' }}>Recent Transactions</div>
              <div style={{ fontSize: 11, color: '#8a97a8' }}>Read only</div>
            </div>
            <div>
              {RECENT_TRANSACTIONS.map((tx, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: i < RECENT_TRANSACTIONS.length - 1 ? '1px solid #f3f5f8' : 'none' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#0d1b2a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.desc}</div>
                    <div style={{ fontSize: 10, color: '#8a97a8', marginTop: 1 }}>{tx.cat} · {tx.date}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: tx.type === 'income' ? '#1a7a52' : '#0d1b2a', flexShrink: 0 }}>
                    {tx.type === 'income' ? '+' : '−'}${tx.amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div style={{ width: 320, display: 'flex', flexDirection: 'column', gap: 16, flexShrink: 0 }}>

          {/* SEMESTER SUMMARY */}
          <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #eef0f4', padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#0d1b2a', marginBottom: 14 }}>Semester Summary</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Active Members',        value: '34' },
                { label: 'Total Transactions',    value: '24' },
                { label: 'Unreconciled',          value: '4',   warn: true },
                { label: 'Dues Collection Rate',  value: '89%', good: true },
                { label: 'Avg Expense',           value: '$619' },
                { label: 'Budget Remaining',      value: '$3,635', good: true },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f3f5f8' }}>
                  <span style={{ fontSize: 12, color: '#8a97a8' }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: row.warn ? '#e05c5c' : row.good ? '#1a7a52' : '#0d1b2a' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* UPCOMING EVENTS */}
          <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #eef0f4', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #eef0f4', fontSize: 12, fontWeight: 600, color: '#0d1b2a' }}>
              Upcoming Events
            </div>
            <div>
              {UPCOMING_EVENTS.map((event, i) => {
                const pct = Math.min(Math.round(event.spent / event.budgeted * 100), 100);
                const status = STATUS_CONFIG[event.status];
                return (
                  <div key={event.name} style={{ padding: '12px 16px', borderBottom: i < UPCOMING_EVENTS.length - 1 ? '1px solid #f3f5f8' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#0d1b2a' }}>{event.name}</div>
                      <div style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 100, background: status.bg, color: status.color }}>
                        {status.label}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: '#8a97a8', marginBottom: 6 }}>📅 {event.date}</div>
                    <div style={{ height: 4, background: '#eef0f4', borderRadius: 100, overflow: 'hidden', marginBottom: 3 }}>
                      <div style={{ width: pct + '%', height: '100%', background: '#c9a84c', borderRadius: 100 }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 10, color: '#8a97a8' }}>${event.spent.toLocaleString()} spent</span>
                      <span style={{ fontSize: 10, color: '#8a97a8' }}>of ${event.budgeted.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CONTACT TREASURER */}
          <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #eef0f4', padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#0d1b2a', marginBottom: 6 }}>Questions?</div>
            <div style={{ fontSize: 12, color: '#8a97a8', marginBottom: 12, lineHeight: 1.5 }}>
              Contact the chapter treasurer directly with any questions about the finances.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#f8f9fb', borderRadius: 8, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #c9a84c, #8b6914)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#0d1b2a' }}>MJ</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#0d1b2a' }}>Marcus Johnson</div>
                <div style={{ fontSize: 10, color: '#8a97a8' }}>Treasurer · Chapter Plan</div>
              </div>
            </div>
            <button
              onClick={() => setShowContactModal(true)}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: '#0d1b2a', color: '#ffffff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              ✉ Contact Treasurer
            </button>
          </div>

        </div>
      </div>

      {/* CONTACT MODAL */}
      {showContactModal && (
        <div onClick={e => { if (e.target === e.currentTarget) setShowContactModal(false); }} style={{ position: 'fixed', inset: 0, background: 'rgba(13,27,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#ffffff', borderRadius: 16, padding: 28, width: 420, boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#0d1b2a', marginBottom: 4 }}>Contact Treasurer</div>
            <div style={{ fontSize: 13, color: '#8a97a8', marginBottom: 20 }}>Send a message to Marcus Johnson</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#0d1b2a' }}>Subject</label>
                <input style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #dce3eb', fontSize: 13, color: '#0d1b2a', fontFamily: 'inherit', outline: 'none', background: '#ffffff' }} placeholder="e.g. Question about Housing budget" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#0d1b2a' }}>Message</label>
                <textarea style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #dce3eb', fontSize: 13, color: '#0d1b2a', fontFamily: 'inherit', outline: 'none', background: '#ffffff', resize: 'vertical', minHeight: 100 }} placeholder="Your message..." />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20, paddingTop: 16, borderTop: '1px solid #eef0f4' }}>
              <button onClick={() => setShowContactModal(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #dce3eb', background: '#ffffff', color: '#0d1b2a', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={() => { setShowContactModal(false); }} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#0d1b2a', color: '#ffffff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Send Message</button>
            </div>
          </div>
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