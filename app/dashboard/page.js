"use client";
import { useState } from "react";

const navItems = [
  { section: "Overview" },
  { icon: "⬡", label: "Dashboard", active: true },
  { icon: "📊", label: "Budget" },
  { icon: "↕", label: "Transactions" },
  { section: "Chapter" },
  { icon: "👥", label: "Members & Dues", badge: 5 },
  { icon: "📅", label: "Events" },
  { icon: "🧾", label: "Receipt Scanner" },
  { icon: "📄", label: "Reports" },
  { section: "Access" },
  { icon: "🏛️", label: "Advisor Portal" },
  { icon: "⚙", label: "Settings" },
];

const budgetCategories = [
  { name: "Social & Events", spent: 2880, total: 4000, color: "#4a90d9" },
  { name: "Philanthropy", spent: 1100, total: 2500, color: "#2ecc8a" },
  { name: "Chapter Ops", spent: 1500, total: 2500, color: "#c9a84c" },
  { name: "Brotherhood", spent: 800, total: 1500, color: "#a78bfa" },
  { name: "Housing", spent: 4250, total: 5000, color: "#e05c5c" },
];

const transactions = [
  { icon: "💳", name: "Spring Dues — Batch 3", meta: "Dues · 12 members", amount: "+$1,800", date: "Mar 1", credit: true },
  { icon: "🎉", name: "Venue Deposit — Spring Formal", meta: "Social & Events", amount: "−$1,200", date: "Feb 28", credit: false },
  { icon: "🏠", name: "Monthly House Payment", meta: "Housing", amount: "−$2,100", date: "Feb 28", credit: false },
  { icon: "🍕", name: "Chapter Meeting Dinner", meta: "Chapter Ops", amount: "−$340", date: "Feb 26", credit: false },
  { icon: "💳", name: "Spring Dues — Batch 2", meta: "Dues · 8 members", amount: "+$1,200", date: "Feb 24", credit: true },
];

const members = [
  { initials: "AK", name: "Alex Kim", amount: "$300", status: "paid", color: "#4a90d9" },
  { initials: "TM", name: "Tyler Morris", amount: "$300", status: "pending", color: "#c9a84c" },
  { initials: "JP", name: "Jordan Park", amount: "$300", status: "paid", color: "#2ecc8a" },
  { initials: "CW", name: "Connor Walsh", amount: "$300", status: "overdue", color: "#e05c5c" },
  { initials: "RB", name: "Ryan Brooks", amount: "$300", status: "pending", color: "#a78bfa" },
];

const semesters = [
  { label: "Spring 2025", meta: "Active semester", current: true },
  { label: "Fall 2024", meta: "$14,200 managed · 52 members" },
  { label: "Spring 2024", meta: "$16,800 managed · 48 members" },
  { label: "Fall 2023", meta: "$12,400 managed · 45 members" },
  { label: "Spring 2023", meta: "$11,100 managed · 42 members" },
];

const pillStyle = {
  paid: { background: "#e8f5ee", color: "#1a7a52" },
  pending: { background: "#fdf8ee", color: "#8b6914" },
  overdue: { background: "#fde8e8", color: "#c03c3c" },
};

export default function Dashboard() {
  const [semesterOpen, setSemesterOpen] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState("Spring 2025");

  return (
    <div style={{
      fontFamily: "'DM Sans', sans-serif",
      display: "grid",
      gridTemplateColumns: "240px 1fr",
      height: "100vh",
      overflow: "hidden",
      background: "#f0f3f7",
    }}>

      {/* SIDEBAR */}
      <aside style={{
        background: "#0d1b2a",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}>
        {/* Logo */}
        <div style={{
          padding: "28px 24px 24px",
          fontFamily: "Georgia, serif",
          fontSize: "24px",
          fontWeight: "500",
          color: "#fff",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          letterSpacing: "0.03em",
        }}>
          Drach<span style={{ color: "#c9a84c" }}>m</span>a
        </div>

        {/* Chapter */}
        <div style={{
          padding: "14px 24px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{ fontSize: "13px", fontWeight: "600", color: "#fff" }}>ΠΚΑ — Alpha Epsilon</div>
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>University of Idaho</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
          {navItems.map((item, i) => {
            if (item.section) return (
              <div key={i} style={{
                fontSize: "10px", fontWeight: "600", letterSpacing: "0.12em",
                textTransform: "uppercase", color: "rgba(255,255,255,0.25)",
                padding: "16px 24px 6px",
              }}>{item.section}</div>
            );
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "10px 12px 10px 20px",
                margin: "1px 8px", borderRadius: "8px", cursor: "pointer",
                background: item.active ? "rgba(201,168,76,0.12)" : "transparent",
                color: item.active ? "#e2c47a" : "rgba(255,255,255,0.5)",
                fontSize: "13px", fontWeight: item.active ? "500" : "400",
              }}>
                <span style={{ fontSize: "15px", width: "20px", textAlign: "center" }}>{item.icon}</span>
                {item.label}
                {item.badge && (
                  <span style={{
                    marginLeft: "auto", background: "#e05c5c", color: "#fff",
                    fontSize: "10px", fontWeight: "700", padding: "2px 6px", borderRadius: "100px",
                  }}>{item.badge}</span>
                )}
              </div>
            );
          })}
        </nav>

        {/* User */}
        <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "10px",
            padding: "10px 12px", borderRadius: "8px", cursor: "pointer",
          }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "50%",
              background: "linear-gradient(135deg, #c9a84c, #8b6914)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "12px", fontWeight: "700", color: "#0d1b2a", flexShrink: 0,
            }}>MJ</div>
            <div>
              <div style={{ fontSize: "12px", fontWeight: "500", color: "#fff" }}>Marcus Johnson</div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", marginTop: "1px" }}>Treasurer · Chapter Plan</div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>

        {/* TOPBAR */}
        <div style={{
          background: "#fff", borderBottom: "1px solid #dce3eb",
          padding: "0 28px", height: "60px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0, position: "relative",
        }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: "600", color: "#0d1b2a" }}>Dashboard</div>
            <div style={{ fontSize: "12px", color: "#8a97a8", marginTop: "1px" }}>Good morning, Marcus — {selectedSemester}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", position: "relative" }}>

            {/* Semester Button */}
            <div
              onClick={() => setSemesterOpen(!semesterOpen)}
              style={{
                background: "#fdf8ee", border: "1px solid rgba(201,168,76,0.3)",
                color: "#8b6914", fontSize: "12px", fontWeight: "500",
                padding: "6px 14px", borderRadius: "100px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "6px",
              }}
            >
              ✦ {selectedSemester} <span style={{ fontSize: "10px" }}>{semesterOpen ? "▴" : "▾"}</span>
            </div>

            {/* Semester Dropdown */}
            {semesterOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 8px)", right: "120px",
                background: "#fff", border: "1px solid #dce3eb",
                borderRadius: "12px", boxShadow: "0 8px 30px rgba(13,27,42,0.12)",
                width: "240px", zIndex: 200, overflow: "hidden",
              }}>
                <div style={{
                  padding: "12px 16px", fontSize: "10px", fontWeight: "600",
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  color: "#8a97a8", borderBottom: "1px solid #dce3eb",
                }}>Semester History</div>
                {semesters.map((s, i) => (
                  <div key={i}
                    onClick={() => { setSelectedSemester(s.label); setSemesterOpen(false); }}
                    style={{
                      padding: "11px 16px", display: "flex", alignItems: "center",
                      justifyContent: "space-between", cursor: "pointer",
                      background: s.current ? "#fdf8ee" : "transparent",
                      fontSize: "13px",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: "500", color: s.current ? "#8b6914" : "#0d1b2a" }}>{s.label}</div>
                      <div style={{ fontSize: "11px", color: "#8a97a8", marginTop: "2px" }}>{s.meta}</div>
                    </div>
                    {s.current
                      ? <span style={{ fontSize: "10px", fontWeight: "700", background: "#c9a84c", color: "#0d1b2a", padding: "2px 8px", borderRadius: "100px" }}>Current</span>
                      : <span style={{ fontSize: "11px", color: "#8a97a8" }}>View →</span>
                    }
                  </div>
                ))}
              </div>
            )}

            <button style={{
              background: "#0d1b2a", color: "#fff", border: "none",
              padding: "8px 16px", borderRadius: "7px", fontSize: "13px",
              fontWeight: "500", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            }}>+ Add Transaction</button>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>

          {/* ONBOARDING BANNER */}
          <div style={{
            background: "linear-gradient(135deg, #0d1b2a, #1e3248)",
            borderRadius: "12px", padding: "18px 24px",
            marginBottom: "18px", display: "flex", alignItems: "center", gap: "20px",
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "14px", fontWeight: "600", color: "#fff", marginBottom: "3px" }}>
                Welcome to Drachma — Let's get your chapter set up 👋
              </div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)" }}>
                Complete these steps to unlock the full Drachma experience
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              {[
                { label: "Chapter details", done: true },
                { label: "Budget categories", done: true },
                { label: "First transaction", done: false },
                { label: "Invite advisor", done: false },
              ].map((step, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  background: step.done ? "rgba(46,204,138,0.15)" : "rgba(255,255,255,0.07)",
                  border: `1px solid ${step.done ? "rgba(46,204,138,0.3)" : "rgba(255,255,255,0.1)"}`,
                  padding: "6px 12px", borderRadius: "100px",
                  fontSize: "11px", color: step.done ? "#2ecc8a" : "rgba(255,255,255,0.55)",
                  whiteSpace: "nowrap",
                }}>
                  {step.done ? "✓" : "○"} {step.label}
                </div>
              ))}
            </div>
            <div style={{ position: "relative", width: "52px", height: "52px", flexShrink: 0 }}>
              <svg width="52" height="52" viewBox="0 0 52 52" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="26" cy="26" r="20" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4"/>
                <circle cx="26" cy="26" r="20" fill="none" stroke="#c9a84c" strokeWidth="4"
                  strokeDasharray="125.6" strokeDashoffset="62.8" strokeLinecap="round"/>
              </svg>
              <div style={{
                position: "absolute", inset: 0, display: "flex",
                alignItems: "center", justifyContent: "center",
                fontSize: "13px", fontWeight: "700", color: "#c9a84c",
              }}>2/4</div>
            </div>
          </div>

          {/* KPI CARDS */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "18px" }}>
            {[
              { label: "Total Balance", value: "$18,420", change: "↑ 12.4% vs last semester", type: "up", accent: "#4a90d9" },
              { label: "Dues Collected", value: "$11,340", change: "38 of 56 members paid", type: "neutral", accent: "#2ecc8a" },
              { label: "Budget Used", value: "$6,812", change: "38% of $18K budget", type: "neutral", accent: "#c9a84c" },
              { label: "Pending Dues", value: "$5,220", change: "↓ 18 members overdue", type: "down", accent: "#e05c5c" },
            ].map((kpi, i) => (
              <div key={i} style={{
                background: "#fff", border: "1px solid #dce3eb",
                borderRadius: "12px", padding: "16px 18px",
                position: "relative", overflow: "hidden",
              }}>
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
                    <div style={{ fontSize: "11px", color: "#8a97a8", marginTop: "2px" }}>Spring 2025 · $18,000 total</div>
                  </div>
                  <button style={{ fontSize: "12px", color: "#c9a84c", fontWeight: "500", border: "none", background: "none", cursor: "pointer" }}>Manage →</button>
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
                    <div style={{ fontSize: "11px", color: "#8a97a8", marginTop: "2px" }}>Last 7 days</div>
                  </div>
                  <button style={{ fontSize: "12px", color: "#c9a84c", fontWeight: "500", border: "none", background: "none", cursor: "pointer" }}>View All →</button>
                </div>
                {transactions.map((tx, i) => (
                  <div key={i} style={{ padding: "11px 20px", display: "flex", alignItems: "center", gap: "12px", borderBottom: i < transactions.length - 1 ? "1px solid #f3f5f8" : "none" }}>
                    <div style={{ width: "34px", height: "34px", borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", background: tx.credit ? "rgba(46,204,138,0.1)" : "rgba(74,144,217,0.1)", flexShrink: 0 }}>{tx.icon}</div>
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
                    { icon: "➕", label: "Add Transaction", desc: "Log an expense or income" },
                    { icon: "🧾", label: "Scan Receipt", desc: "AI reads it for you" },
                    { icon: "📧", label: "Send Reminders", desc: "Email overdue members" },
                    { icon: "📄", label: "Export Report", desc: "Semester PDF summary" },
                  ].map((qa, i) => (
                    <button key={i} style={{
                      display: "flex", flexDirection: "column", alignItems: "center",
                      justifyContent: "center", gap: "8px", padding: "18px 12px",
                      background: "#f0f3f7", border: "1px solid #dce3eb",
                      borderRadius: "10px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                    }}>
                      <span style={{ fontSize: "24px" }}>{qa.icon}</span>
                      <span style={{ fontSize: "12px", fontWeight: "500", color: "#0d1b2a", textAlign: "center" }}>{qa.label}</span>
                      <span style={{ fontSize: "10px", color: "#8a97a8", textAlign: "center" }}>{qa.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* DUES TRACKER */}
              <div style={{ background: "#fff", border: "1px solid #dce3eb", borderRadius: "12px", overflow: "hidden" }}>
                <div style={{ padding: "14px 20px", borderBottom: "1px solid #dce3eb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: "600", color: "#0d1b2a" }}>Dues Tracker</div>
                    <div style={{ fontSize: "11px", color: "#8a97a8", marginTop: "2px" }}>Spring 2025 · $300 per member</div>
                  </div>
                  <button style={{ fontSize: "12px", color: "#c9a84c", fontWeight: "500", border: "none", background: "none", cursor: "pointer" }}>All Members →</button>
                </div>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #dce3eb" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                    <div>
                      <div style={{ fontSize: "10px", color: "#8a97a8", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "4px" }}>Total Collected</div>
                      <div style={{ fontFamily: "'Sora', sans-serif", fontSize: "32px", fontWeight: "300", color: "#0d1b2a", lineHeight: 1 }}>$11,340</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "'Sora', sans-serif", fontSize: "26px", fontWeight: "300", color: "#c9a84c" }}>68%</div>
                      <div style={{ fontSize: "10px", color: "#8a97a8", marginTop: "2px" }}>collection rate</div>
                    </div>
                  </div>
                  <div style={{ height: "6px", background: "#eef0f4", borderRadius: "100px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: "68%", background: "#c9a84c", borderRadius: "100px" }} />
                  </div>
                  <div style={{ marginTop: "10px", display: "flex", justifyContent: "space-between" }}>
                    {[{ num: "38", label: "Paid" }, { num: "12", label: "Pending" }, { num: "6", label: "Overdue", red: true }, { num: "56", label: "Total" }].map((s, i) => (
                      <div key={i} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "15px", fontWeight: "600", color: s.red ? "#c03c3c" : "#0d1b2a" }}>{s.num}</div>
                        <div style={{ fontSize: "9px", color: "#8a97a8", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "1px" }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {members.map((m, i) => (
                  <div key={i} style={{ padding: "10px 20px", display: "flex", alignItems: "center", gap: "10px", borderBottom: i < members.length - 1 ? "1px solid #f3f5f8" : "none" }}>
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
                  <div style={{ fontSize: "11px", color: "#8a97a8", marginTop: "2px" }}>Jan – May 2025</div>
                </div>
                <div style={{ padding: "14px 20px 16px", display: "flex", alignItems: "flex-end", gap: "10px", height: "100px" }}>
                  {[
                    { month: "Jan", height: 38, opacity: 0.3 },
                    { month: "Feb", height: 58, opacity: 0.45 },
                    { month: "Mar", height: 26, opacity: 1, gold: true },
                    { month: "Apr", height: 48, dashed: true },
                    { month: "May", height: 65, dashed: true },
                  ].map((bar, i) => (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}>
                      <div style={{
                        width: "100%", borderRadius: "4px 4px 0 0",
                        height: `${bar.height}px`,
                        background: bar.gold ? "#c9a84c" : bar.dashed ? "transparent" : `rgba(74,144,217,${bar.opacity})`,
                        border: bar.dashed ? "2px dashed rgba(74,144,217,0.25)" : "none",
                        borderBottom: bar.dashed ? "none" : undefined,
                      }} />
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
  );
}