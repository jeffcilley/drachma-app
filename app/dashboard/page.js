"use client";
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../../lib/supabase";

const SEMESTER = 'Spring 2026';
const COLORS = ['#4a90d9','#c9a84c','#2ecc8a','#a78bfa','#e05c5c','#f5a623','#8a97a8'];

const pillStyle = {
  paid:        { background: "#e8f5ee", color: "#1a7a52" },
  outstanding: { background: "#fdf8ee", color: "#8b6914" },
  overdue:     { background: "#fde8e8", color: "#c03c3c" },
};

import ProtectedRoute from '../components/ProtectedRoute';

export default function Dashboard() {
  const { dbUser } = useAuth();
  // semester dropdown removed — post-launch feature
  const [loading, setLoading] = useState(true);

  // Real data state
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [budgetCategories, setBudgetCategories] = useState([]);
  const [membersData, setMembersData] = useState([]);
  const [duesStats, setDuesStats] = useState({ collected: 0, paid: 0, outstanding: 0, overdue: 0, total: 0, pct: 0 });
  const [kpiStats, setKpiStats] = useState({ balance: 0, duesCollected: 0, budgetUsed: 0, pendingDues: 0, totalBudget: 0 });
  const [monthlySpending, setMonthlySpending] = useState([]);

  useEffect(() => {
    if (!dbUser?.chapter_id) return;
    fetchData();
  }, [dbUser]);

  async function fetchData() {
    setLoading(true);

    const [txRes, catRes, txSpendRes, membersRes, allMembersRes, duesRes] = await Promise.all([
      supabase.from('transactions').select('*').eq('chapter_id', dbUser.chapter_id).order('date', { ascending: false }).order('id', { ascending: false }).limit(5),
      supabase.from('budget_categories').select('*').eq('chapter_id', dbUser.chapter_id),
      supabase.from('transactions').select('*').eq('chapter_id', dbUser.chapter_id),
      supabase.from('members').select('*').eq('chapter_id', dbUser.chapter_id).eq('status', 'active').order('name').limit(5),
      supabase.from('members').select('id, status').eq('chapter_id', dbUser.chapter_id),
      supabase.from('dues_payments').select('*').eq('chapter_id', dbUser.chapter_id).eq('semester', SEMESTER),
    ]);

    const allTx = txSpendRes.data || [];
    const categories = catRes.data || [];
    const dues = duesRes.data || [];

    // ── KPI STATS ──────────────────────────────────────────
    const totalIn = allTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const totalOut = allTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    const totalBudget = categories.reduce((s, c) => s + Number(c.budgeted_amount), 0);
    const duesCollected = dues.reduce((s, d) => s + Number(d.amount_paid), 0);
    const pendingDues = dues.filter(d => d.status !== 'paid').reduce((s, d) => s + (Number(d.amount_owed) - Number(d.amount_paid)), 0);

    setKpiStats({
      balance: totalIn - totalOut,
      duesCollected,
      budgetUsed: totalOut,
      pendingDues,
      totalBudget,
    });

    // ── RECENT TRANSACTIONS ────────────────────────────────
    if (txRes.data) {
      setRecentTransactions(txRes.data.map(tx => ({
        name: tx.description,
        meta: categories.find(c => c.id === tx.category_id)?.name || 'Uncategorized',
        amount: (tx.type === 'income' ? '+' : '−') + '$' + Number(tx.amount).toLocaleString(),
        date: new Date(tx.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        credit: tx.type === 'income',
      })));
    }

    // ── BUDGET CATEGORIES ──────────────────────────────────
    const spentMap = {};
    allTx.filter(t => t.type === 'expense').forEach(t => {
      if (t.category_id) spentMap[t.category_id] = (spentMap[t.category_id] || 0) + Number(t.amount);
    });
    setBudgetCategories(categories.map((c, i) => ({
      name: c.name,
      spent: spentMap[c.id] || 0,
      total: Number(c.budgeted_amount),
      color: c.color || COLORS[i % COLORS.length],
    })).filter(c => c.total > 0).slice(0, 5));

    // ── DUES STATS ─────────────────────────────────────────
    const activeMembers = (allMembersRes.data || []).filter(m => m.status !== 'dropped');
    const activeDues = dues.filter(d => activeMembers.some(m => m.id === d.member_id));
    const paidCt = activeDues.filter(d => d.status === 'paid').length;
    const outstandingCt = activeDues.filter(d => d.status === 'outstanding').length;
    const overdueCt = activeDues.filter(d => d.status === 'overdue').length;
    const totalDues = activeDues.length;
    const totalOwed = activeDues.reduce((s, d) => s + Number(d.amount_owed), 0);
    const totalPaid = activeDues.reduce((s, d) => s + Number(d.amount_paid), 0);
    const pct = totalOwed > 0 ? Math.round(totalPaid / totalOwed * 100) : 0;
    setDuesStats({ collected: duesCollected, paid: paidCt, outstanding: outstandingCt, overdue: overdueCt, total: totalDues, pct });

    // ── MEMBERS FOR DUES TRACKER ───────────────────────────
    if (membersRes.data) {
      setMembersData(membersRes.data.map(m => {
        const due = dues.find(d => d.member_id === m.id);
        return {
          initials: m.name.split(' ').map(n => n[0]).join('').slice(0, 2),
          name: m.name,
          amount: '$' + (due ? Number(due.amount_owed).toLocaleString() : '0'),
          status: due?.status || 'outstanding',
          color: COLORS[m.id % COLORS.length],
        };
      }));
    }

    // ── MONTHLY SPENDING ───────────────────────────────────
    const monthMap = {};
    allTx.filter(t => t.type === 'expense').forEach(tx => {
      const month = new Date(tx.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short' });
      monthMap[month] = (monthMap[month] || 0) + Number(tx.amount);
    });
    const maxSpend = Math.max(...Object.values(monthMap), 1);
    setMonthlySpending(Object.entries(monthMap).map(([month, amount]) => ({
      month,
      height: Math.round((amount / maxSpend) * 65),
      amount,
    })));

    setLoading(false);
  }

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f0f3f7', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 32, color: '#0d1b2a', marginBottom: 12 }}>Drach<span style={{ color: '#c9a84c' }}>m</span>a</div>
        <div style={{ fontSize: 13, color: '#8a97a8' }}>Loading dashboard...</div>
      </div>
    </div>
  );

  return (
    <ProtectedRoute>
    <div style={{
      fontFamily: "'DM Sans', sans-serif",
      display: "grid",
      gridTemplateColumns: "240px 1fr",
      height: "100vh",
      overflow: "hidden",
      background: "#f0f3f7",
    }}>

      {/* SIDEBAR */}
      <Sidebar activePage="dashboard" />

      {/* MAIN */}
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>

        {/* TOPBAR */}
        <div style={{ background: "#fff", borderBottom: "1px solid #dce3eb", padding: "0 28px", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, position: "relative" }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: "600", color: "#0d1b2a" }}>Dashboard</div>
            <div style={{ fontSize: "12px", color: "#8a97a8", marginTop: "1px" }}>
              {(() => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; })()}, {dbUser?.name?.split(' ')[0] || 'Treasurer'} — {SEMESTER}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ background: "#fdf8ee", border: "1px solid rgba(201,168,76,0.3)", color: "#8b6914", fontSize: "12px", fontWeight: "500", padding: "6px 14px", borderRadius: "100px" }}>
              ✦ {SEMESTER}
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>

          {/* Onboarding banner removed — post-launch feature */}

          {/* KPI CARDS */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "18px" }}>
            {[
              { label: "Total Balance",  value: '$' + kpiStats.balance.toLocaleString(), change: "Net income this semester", type: kpiStats.balance >= 0 ? "up" : "down", accent: "#4a90d9" },
              { label: "Dues Collected", value: '$' + kpiStats.duesCollected.toLocaleString(), change: `${duesStats.paid} of ${duesStats.total} members paid`, type: "neutral", accent: "#2ecc8a" },
              { label: "Budget Used",    value: '$' + kpiStats.budgetUsed.toLocaleString(), change: `${kpiStats.totalBudget > 0 ? Math.round(kpiStats.budgetUsed / kpiStats.totalBudget * 100) : 0}% of $${(kpiStats.totalBudget / 1000).toFixed(0)}k budget`, type: "neutral", accent: "#c9a84c" },
              { label: "Pending Dues",   value: '$' + kpiStats.pendingDues.toLocaleString(), change: `${duesStats.overdue} members overdue`, type: duesStats.overdue > 0 ? "down" : "neutral", accent: "#e05c5c" },
            ].map((kpi, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid #dce3eb", borderRadius: "12px", padding: "16px 18px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: kpi.accent }} />
                <div style={{ fontSize: "10px", fontWeight: "600", letterSpacing: "0.07em", textTransform: "uppercase", color: "#8a97a8", marginBottom: "8px" }}>{kpi.label}</div>
                <div style={{ fontFamily: "'Sora', sans-serif", fontSize: "26px", fontWeight: "300", color: "#0d1b2a", lineHeight: 1, marginBottom: "6px" }}>{kpi.value}</div>
                <div style={{ fontSize: "11px", fontWeight: "500", color: kpi.type === "up" ? "#1a7a52" : kpi.type === "down" ? "#c03c3c" : "#8a97a8" }}>{kpi.change}</div>
              </div>
            ))}
          </div>

          {/* MAIN GRID */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "16px" }}>

            {/* LEFT */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

              {/* BUDGET */}
              <div style={{ background: "#fff", border: "1px solid #dce3eb", borderRadius: "12px", overflow: "hidden" }}>
                <div style={{ padding: "14px 20px", borderBottom: "1px solid #dce3eb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: "600", color: "#0d1b2a" }}>Budget by Category</div>
                    <div style={{ fontSize: "11px", color: "#8a97a8", marginTop: "2px" }}>{SEMESTER} · ${kpiStats.totalBudget.toLocaleString()} total</div>
                  </div>
                  <a href="/budget" style={{ fontSize: "12px", color: "#c9a84c", fontWeight: "500", border: "none", background: "none", cursor: "pointer", textDecoration: "none" }}>Manage →</a>
                </div>
                {budgetCategories.map((cat, i) => (
                  <div key={i} style={{ padding: "11px 20px", display: "flex", alignItems: "center", gap: "14px", borderBottom: i < budgetCategories.length - 1 ? "1px solid #f3f5f8" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "140px", flexShrink: 0 }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: cat.color, flexShrink: 0 }} />
                      <div style={{ fontSize: "12px", fontWeight: "500", color: "#0d1b2a" }}>{cat.name}</div>
                    </div>
                    <div style={{ flex: 1, height: "5px", background: "#eef0f4", borderRadius: "100px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.round(cat.spent / cat.total * 100)}%`, background: cat.color, borderRadius: "100px" }} />
                    </div>
                    <div style={{ textAlign: "right", width: "120px", flexShrink: 0 }}>
                      <div style={{ fontSize: "12px", fontWeight: "600", color: "#0d1b2a" }}>${cat.spent.toLocaleString()}</div>
                      <div style={{ fontSize: "10px", color: "#8a97a8", marginTop: "1px" }}>of ${cat.total.toLocaleString()} · {Math.round(cat.spent / cat.total * 100)}%</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* TRANSACTIONS */}
              <div style={{ background: "#fff", border: "1px solid #dce3eb", borderRadius: "12px", overflow: "hidden" }}>
                <div style={{ padding: "14px 20px", borderBottom: "1px solid #dce3eb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: "600", color: "#0d1b2a" }}>Recent Transactions</div>
                    <div style={{ fontSize: "11px", color: "#8a97a8", marginTop: "2px" }}>Most recent {recentTransactions.length} transactions</div>
                  </div>
                  <a href="/transactions" style={{ fontSize: "12px", color: "#c9a84c", fontWeight: "500", border: "none", background: "none", cursor: "pointer", textDecoration: "none" }}>View All →</a>
                </div>
                {recentTransactions.map((tx, i) => (
                  <div key={i} style={{ padding: "11px 20px", display: "flex", alignItems: "center", gap: "12px", borderBottom: i < recentTransactions.length - 1 ? "1px solid #f3f5f8" : "none" }}>
                    <div style={{ width: "34px", height: "34px", borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", background: tx.credit ? "rgba(46,204,138,0.1)" : "rgba(74,144,217,0.1)", flexShrink: 0 }}>{tx.credit ? "💳" : "💸"}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "13px", fontWeight: "500", color: "#0d1b2a" }}>{tx.name}</div>
                      <div style={{ fontSize: "11px", color: "#8a97a8", marginTop: "1px" }}>{tx.meta}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "13px", fontWeight: "600", color: tx.credit ? "#1a7a52" : "#0d1b2a" }}>{tx.amount}</div>
                      <div style={{ fontSize: "10px", color: "#8a97a8", marginTop: "2px" }}>{tx.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

              {/* QUICK ACTIONS */}
              <div style={{ background: "#fff", border: "1px solid #dce3eb", borderRadius: "12px", overflow: "hidden" }}>
                <div style={{ padding: "14px 20px", borderBottom: "1px solid #dce3eb" }}>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#0d1b2a" }}>Quick Actions</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", padding: "16px" }}>
                  {[
                    { icon: "➕", label: "Add Transaction", desc: "Log an expense or income", href: "/transactions" },
                    { icon: "🧾", label: "Scan Receipt",    desc: "AI reads it for you",      href: "/scanner" },
                    { icon: "📧", label: "Send Reminders",  desc: "Email overdue members",    href: "/members" },
                    { icon: "📄", label: "Export Report",   desc: "Semester PDF summary",     href: "/reports" },
                  ].map((qa, i) => (
                    <a key={i} href={qa.href} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", padding: "18px 12px", background: "#f0f3f7", border: "1px solid #dce3eb", borderRadius: "10px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", textDecoration: "none" }}>
                      <span style={{ fontSize: "24px" }}>{qa.icon}</span>
                      <span style={{ fontSize: "12px", fontWeight: "500", color: "#0d1b2a", textAlign: "center" }}>{qa.label}</span>
                      <span style={{ fontSize: "10px", color: "#8a97a8", textAlign: "center" }}>{qa.desc}</span>
                    </a>
                  ))}
                </div>
              </div>

              {/* DUES TRACKER */}
              <div style={{ background: "#fff", border: "1px solid #dce3eb", borderRadius: "12px", overflow: "hidden" }}>
                <div style={{ padding: "14px 20px", borderBottom: "1px solid #dce3eb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: "600", color: "#0d1b2a" }}>Dues Tracker</div>
                    <div style={{ fontSize: "11px", color: "#8a97a8", marginTop: "2px" }}>{SEMESTER} · {duesStats.total} members</div>
                  </div>
                  <a href="/members" style={{ fontSize: "12px", color: "#c9a84c", fontWeight: "500", border: "none", background: "none", cursor: "pointer", textDecoration: "none" }}>All Members →</a>
                </div>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #dce3eb" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                    <div>
                      <div style={{ fontSize: "10px", color: "#8a97a8", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "4px" }}>Total Collected</div>
                      <div style={{ fontFamily: "'Sora', sans-serif", fontSize: "32px", fontWeight: "300", color: "#0d1b2a", lineHeight: 1 }}>${duesStats.collected.toLocaleString()}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "'Sora', sans-serif", fontSize: "26px", fontWeight: "300", color: "#c9a84c" }}>{duesStats.pct}%</div>
                      <div style={{ fontSize: "10px", color: "#8a97a8", marginTop: "2px" }}>collection rate</div>
                    </div>
                  </div>
                  <div style={{ height: "6px", background: "#eef0f4", borderRadius: "100px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${duesStats.pct}%`, background: "#c9a84c", borderRadius: "100px" }} />
                  </div>
                  <div style={{ marginTop: "10px", display: "flex", justifyContent: "space-between" }}>
                    {[{ num: String(duesStats.paid), label: "Paid" }, { num: String(duesStats.outstanding), label: "Outstanding" }, { num: String(duesStats.overdue), label: "Overdue", red: true }, { num: String(duesStats.total), label: "Total" }].map((s, i) => (
                      <div key={i} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "15px", fontWeight: "600", color: s.red ? "#c03c3c" : "#0d1b2a" }}>{s.num}</div>
                        <div style={{ fontSize: "9px", color: "#8a97a8", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "1px" }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {membersData.map((m, i) => (
                  <div key={i} style={{ padding: "10px 20px", display: "flex", alignItems: "center", gap: "10px", borderBottom: i < membersData.length - 1 ? "1px solid #f3f5f8" : "none" }}>
                    <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: m.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "700", color: "#fff", flexShrink: 0 }}>{m.initials}</div>
                    <div style={{ flex: 1, fontSize: "13px", fontWeight: "500", color: "#0d1b2a" }}>{m.name}</div>
                    <div style={{ fontSize: "12px", color: "#8a97a8", marginRight: "8px" }}>{m.amount}</div>
                    <div style={{ fontSize: "10px", fontWeight: "600", padding: "3px 9px", borderRadius: "100px", ...pillStyle[m.status] }}>{m.status.charAt(0).toUpperCase() + m.status.slice(1)}</div>
                  </div>
                ))}
              </div>

              {/* CHART */}
              <div style={{ background: "#fff", border: "1px solid #dce3eb", borderRadius: "12px", overflow: "hidden" }}>
                <div style={{ padding: "14px 20px", borderBottom: "1px solid #dce3eb" }}>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#0d1b2a" }}>Monthly Spending</div>
                  <div style={{ fontSize: "11px", color: "#8a97a8", marginTop: "2px" }}>{SEMESTER} spending by month</div>
                </div>
                <div style={{ padding: "14px 20px 16px", display: "flex", alignItems: "flex-end", gap: "10px", height: "100px" }}>
                  {monthlySpending.length === 0 ? (
                    <div style={{ flex: 1, textAlign: 'center', fontSize: 11, color: '#8a97a8', paddingBottom: 8 }}>No spending data yet</div>
                  ) : monthlySpending.map((bar, i) => (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}>
                      <div style={{ width: "100%", borderRadius: "4px 4px 0 0", height: `${bar.height}px`, background: i === monthlySpending.length - 1 ? "#c9a84c" : "rgba(74,144,217,0.5)" }} />
                      <div style={{ fontSize: "9px", color: "#8a97a8" }}>{bar.month}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  </ProtectedRoute>
  );
}