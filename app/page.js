export default function Home() {
  return (
    <main style={{
      fontFamily: "'DM Sans', sans-serif",
      background: "#0d1b2a",
      color: "#ffffff",
      minHeight: "100vh",
      margin: 0,
    }}>

      {/* NAV */}
      <nav style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "24px 60px",
        borderBottom: "1px solid rgba(201,168,76,0.12)",
        background: "rgba(13,27,42,0.95)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div style={{
          fontFamily: "Georgia, serif",
          fontSize: "28px",
          fontWeight: "500",
          letterSpacing: "0.04em",
        }}>
          Drach<span style={{ color: "#c9a84c" }}>m</span>a
        </div>
        <div style={{ display: "flex", gap: "36px", alignItems: "center" }}>
          {["Features", "Pricing", "For HQ", "Login"].map(item => (
            <a key={item} href="#" style={{
              color: "rgba(255,255,255,0.6)",
              textDecoration: "none",
              fontSize: "14px",
              transition: "color 0.2s",
            }}>{item}</a>
          ))}
          <a href="#" style={{
            background: "#c9a84c",
            color: "#0d1b2a",
            padding: "10px 22px",
            borderRadius: "6px",
            fontWeight: "600",
            fontSize: "13px",
            textDecoration: "none",
          }}>Get Started Free</a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        minHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "80px 40px",
        background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(201,168,76,0.1) 0%, transparent 70%)",
      }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          background: "rgba(201,168,76,0.1)",
          border: "1px solid rgba(201,168,76,0.3)",
          color: "#e2c47a",
          padding: "7px 16px",
          borderRadius: "100px",
          fontSize: "12px",
          fontWeight: "500",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: "36px",
        }}>
          ✦ Built for Greek Life Treasurers
        </div>

        <h1 style={{
          fontFamily: "Georgia, serif",
          fontSize: "clamp(48px, 8vw, 88px)",
          fontWeight: "300",
          lineHeight: "1.05",
          maxWidth: "900px",
          margin: "0 0 28px",
        }}>
          Chapter finances,<br />
          <em style={{ color: "#c9a84c", fontStyle: "italic" }}>finally organized.</em>
        </h1>

        <p style={{
          fontSize: "18px",
          color: "rgba(255,255,255,0.55)",
          maxWidth: "520px",
          lineHeight: "1.7",
          fontWeight: "300",
          margin: "0 0 48px",
        }}>
          Drachma gives Greek chapters a single source of truth for budgets, dues, events, and reporting — designed for the way chapters actually work.
        </p>

        <div style={{ display: "flex", gap: "16px" }}>
          <a href="#" style={{
            background: "#c9a84c",
            color: "#0d1b2a",
            padding: "16px 36px",
            borderRadius: "8px",
            fontSize: "15px",
            fontWeight: "600",
            textDecoration: "none",
          }}>See the Dashboard →</a>
          <a href="#" style={{
            background: "transparent",
            color: "rgba(255,255,255,0.7)",
            padding: "16px 36px",
            borderRadius: "8px",
            fontSize: "15px",
            fontWeight: "500",
            textDecoration: "none",
            border: "1px solid rgba(255,255,255,0.15)",
          }}>View Pricing</a>
        </div>

        {/* STATS */}
        <div style={{ display: "flex", gap: "60px", marginTop: "80px" }}>
          {[
            { num: "340+", label: "Active Chapters" },
            { num: "$4.2M", label: "Managed This Semester" },
            { num: "98%", label: "Dues Collection Rate" },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <div style={{
                fontFamily: "Georgia, serif",
                fontSize: "40px",
                color: "#c9a84c",
                lineHeight: "1",
              }}>{stat.num}</div>
              <div style={{
                fontSize: "12px",
                color: "rgba(255,255,255,0.4)",
                marginTop: "6px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{
        padding: "120px 60px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        background: "#0d1b2a",
      }}>
        <div style={{
          fontSize: "11px",
          fontWeight: "600",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "#c9a84c",
          marginBottom: "20px",
        }}>Why Drachma</div>
        <h2 style={{
          fontFamily: "Georgia, serif",
          fontSize: "clamp(36px, 5vw, 56px)",
          fontWeight: "300",
          maxWidth: "600px",
          lineHeight: "1.1",
          margin: "0 0 70px",
        }}>
          Everything a chapter needs to run{" "}
          <em style={{ color: "#c9a84c" }}>clean books</em>
        </h2>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "2px",
        }}>
          {[
            { icon: "📊", title: "Real-Time Budgets", desc: "Track spending by category with live balances. No more spreadsheets that go stale between e-board meetings." },
            { icon: "💳", title: "Dues Management", desc: "Track payment status and send automated reminders — all from one clean dashboard." },
            { icon: "📅", title: "Event Budgeting", desc: "Attach budgets to specific events. See actual vs. planned spending for every formal, philanthropy, or retreat." },
            { icon: "🔁", title: "Treasurer Handoff", desc: "Structured transitions so the next treasurer inherits a clean, documented financial history instead of chaos." },
            { icon: "🏛️", title: "Advisor Access", desc: "Alumni advisors get read-only views into chapter finances without touching the books." },
            { icon: "📄", title: "Audit-Ready Reports", desc: "Export semester-end financial reports for your national org or IFC in one click." },
          ].map(f => (
            <div key={f.title} style={{
              background: "#162436",
              padding: "48px 40px",
              transition: "background 0.3s",
            }}>
              <div style={{
                fontSize: "28px",
                marginBottom: "24px",
              }}>{f.icon}</div>
              <h3 style={{
                fontSize: "18px",
                fontWeight: "500",
                marginBottom: "12px",
                color: "#ffffff",
              }}>{f.title}</h3>
              <p style={{
                fontSize: "14px",
                color: "rgba(255,255,255,0.45)",
                lineHeight: "1.75",
                margin: 0,
              }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section style={{
        padding: "120px 60px",
        background: "#faf7f2",
        color: "#0d1b2a",
      }}>
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <div style={{
            fontSize: "11px",
            fontWeight: "600",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#c9a84c",
            marginBottom: "20px",
          }}>Simple Pricing</div>
          <h2 style={{
            fontFamily: "Georgia, serif",
            fontSize: "clamp(36px, 5vw, 52px)",
            fontWeight: "300",
            margin: 0,
          }}>
            One chapter or a whole council,{" "}
            <em style={{ color: "#c9a84c" }}>we've got you covered</em>
          </h2>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "24px",
          maxWidth: "1000px",
          margin: "0 auto",
        }}>
          {[
            {
              name: "Starter", price: "$19", period: "/month", annual: "$190/year",
              desc: "Smaller or newer chapters getting off spreadsheets",
              features: ["Up to 50 members", "Budget tracking", "Transaction logging", "Receipt scanner", "Dues status tracking", "1 advisor seat"],
              featured: false,
            },
            {
              name: "Chapter", price: "$39", period: "/month", annual: "$390/year",
              desc: "Established chapters wanting the full experience",
              features: ["Unlimited members", "Event-level budgeting", "Treasurer handoff tools", "Automated due reminders", "Audit-ready export", "3 advisor seats"],
              featured: true,
            },
            {
              name: "Council", price: "$99", period: "/month", annual: "$990/year",
              desc: "IFC / Panhellenic councils managing multiple chapters",
              features: ["Up to 10 chapters", "Cross-chapter reporting", "Council dashboards", "National HQ access", "Dedicated onboarding", "Unlimited seats"],
              featured: false,
            },
          ].map(plan => (
            <div key={plan.name} style={{
              background: plan.featured ? "#0d1b2a" : "#ffffff",
              border: plan.featured ? "none" : "1px solid #dce3eb",
              borderRadius: "16px",
              padding: "40px 36px",
              position: "relative",
              color: plan.featured ? "#ffffff" : "#0d1b2a",
            }}>
              {plan.featured && (
                <div style={{
                  position: "absolute",
                  top: "-12px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "#c9a84c",
                  color: "#0d1b2a",
                  fontSize: "11px",
                  fontWeight: "700",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  padding: "4px 14px",
                  borderRadius: "100px",
                }}>Most Popular</div>
              )}
              <div style={{
                fontSize: "12px",
                fontWeight: "600",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: plan.featured ? "rgba(255,255,255,0.5)" : "#8a97a8",
                marginBottom: "12px",
              }}>{plan.name}</div>
              <div style={{
                fontFamily: "Georgia, serif",
                fontSize: "52px",
                fontWeight: "400",
                color: plan.featured ? "#c9a84c" : "#0d1b2a",
                lineHeight: "1",
                marginBottom: "4px",
              }}>{plan.price}</div>
              <div style={{
                fontSize: "13px",
                color: plan.featured ? "rgba(255,255,255,0.4)" : "#8a97a8",
                marginBottom: "4px",
              }}>{plan.period} · {plan.annual} billed annually</div>
              <div style={{
                fontSize: "13px",
                color: plan.featured ? "rgba(255,255,255,0.6)" : "#555",
                marginBottom: "28px",
                fontStyle: "italic",
              }}>{plan.desc}</div>
              <div style={{
                height: "1px",
                background: plan.featured ? "rgba(255,255,255,0.1)" : "#dce3eb",
                marginBottom: "24px",
              }} />
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px" }}>
                {plan.features.map(f => (
                  <li key={f} style={{
                    fontSize: "14px",
                    padding: "8px 0",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    color: plan.featured ? "rgba(255,255,255,0.8)" : "#0d1b2a",
                  }}>
                    <span style={{ color: "#c9a84c", fontWeight: "700" }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button style={{
                width: "100%",
                padding: "14px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                background: plan.featured ? "#c9a84c" : "transparent",
                color: plan.featured ? "#0d1b2a" : "#0d1b2a",
                border: plan.featured ? "none" : "1px solid #dce3eb",
              }}>
                {plan.featured ? "Start Free Trial" : plan.name === "Council" ? "Contact Sales" : "Get Started Free"}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        background: "#0d1b2a",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "40px 60px",
        textAlign: "center",
        color: "rgba(255,255,255,0.4)",
        fontSize: "13px",
      }}>
        © 2025 <span style={{ color: "#c9a84c" }}>Drachma</span> — Greek Life Finance Platform. Built for chapters that take their finances seriously.
      </footer>

    </main>
  );
}