'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$19',
    period: '/mo',
    desc: 'For smaller or newer chapters',
    features: ['Up to 50 members', 'Budget tracking', 'Receipt scanner', 'Email support'],
  },
  {
    id: 'chapter',
    name: 'Chapter',
    price: '$39',
    period: '/mo',
    desc: 'For established chapters',
    features: ['Unlimited members', 'Event budgeting', 'Audit-ready exports', 'Priority support'],
    recommended: true,
  },
  {
    id: 'council',
    name: 'Council',
    price: '$99',
    period: '/mo',
    desc: 'For IFC / Panhellenic councils',
    features: ['Multiple chapters', 'Cross-chapter reporting', 'HQ view access', 'Dedicated support'],
  },
];

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [chapter, setChapter] = useState('');
  const [university, setUniversity] = useState('');
  const [plan, setPlan] = useState('chapter');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const inputStyle = {
    padding: '10px 14px', borderRadius: 8, border: '1px solid #dce3eb',
    fontSize: 13, color: '#0d1b2a', fontFamily: 'inherit', outline: 'none',
    background: '#ffffff', width: '100%', boxSizing: 'border-box',
  };

  function handleStep1() {
    if (!name.trim() || !email.trim() || !password.trim() || !chapter.trim() || !university.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setStep(2);
  }

  async function handleSignup() {
    setLoading(true);
    setError('');

    try {
      // Step 1 — Create Supabase Auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          data: {
            name: name.trim(),
          }
        }
      });

      if (authError) throw authError;

      const authUser = authData.user;

      // Step 2 — Call database function to create chapter and user
      const { error: fnError } = await supabase.rpc('create_chapter_and_user', {
        p_auth_id: authUser.id,
        p_name: name.trim(),
        p_email: email.trim(),
        p_chapter_name: chapter.trim(),
        p_university: university.trim(),
        p_plan: plan,
      });

      if (fnError) throw fnError;

      // Success — redirect to dashboard
      window.location.href = '/dashboard';

    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0d1b2a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif", padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: step === 2 ? 760 : 440 }}>

        {/* LOGO */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            fontFamily: 'Georgia, serif', fontSize: 42, fontWeight: 400,
            color: '#ffffff', letterSpacing: '0.05em', marginBottom: 8,
          }}>
            Drach<span style={{ color: '#c9a84c' }}>m</span>a
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
            Greek Life Finance Platform
          </div>
        </div>

        {/* STEP INDICATOR */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
          {['Account Info', 'Choose Plan'].map((label, i) => {
            const stepNum = i + 1;
            const isActive = step === stepNum;
            const isDone = step > stepNum;
            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700,
                    background: isDone ? '#c9a84c' : isActive ? '#ffffff' : 'rgba(255,255,255,0.1)',
                    color: isDone ? '#0d1b2a' : isActive ? '#0d1b2a' : 'rgba(255,255,255,0.3)',
                  }}>
                    {isDone ? '✓' : stepNum}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 500, color: isActive ? '#ffffff' : 'rgba(255,255,255,0.3)' }}>
                    {label}
                  </span>
                </div>
                {i < 1 && <div style={{ width: 32, height: 1, background: 'rgba(255,255,255,0.15)' }} />}
              </div>
            );
          })}
        </div>

        {/* STEP 1 — ACCOUNT INFO */}
        {step === 1 && (
          <div style={{ background: '#ffffff', borderRadius: 16, padding: 32, boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#0d1b2a', marginBottom: 4 }}>Create your account</div>
            <div style={{ fontSize: 13, color: '#8a97a8', marginBottom: 24 }}>Start your 14-day free trial — no credit card required</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#0d1b2a' }}>Your Name</label>
                  <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Marcus Johnson" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#0d1b2a' }}>Email</label>
                  <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="treasurer@chapter.edu" />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#0d1b2a' }}>Password</label>
                <input style={inputStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#0d1b2a' }}>Chapter Name</label>
                  <input style={inputStyle} value={chapter} onChange={e => setChapter(e.target.value)} placeholder="PKA — Zeta Mu" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#0d1b2a' }}>University</label>
                  <input style={inputStyle} value={university} onChange={e => setUniversity(e.target.value)} placeholder="University of Idaho" />
                </div>
              </div>

              {error && (
                <div style={{ padding: '8px 12px', background: '#fde8e8', borderRadius: 8, fontSize: 12, color: '#c03c3c', fontWeight: 500 }}>
                  {error}
                </div>
              )}

              <button
                onClick={handleStep1}
                style={{
                  padding: '12px', borderRadius: 8, border: 'none',
                  background: '#0d1b2a', color: '#ffffff', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit', marginTop: 4,
                }}
              >
                Continue →
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#8a97a8' }}>
              Already have an account?{' '}
              <a href="/login" style={{ color: '#c9a84c', fontWeight: 600, textDecoration: 'none' }}>Sign in</a>
            </div>
          </div>
        )}

        {/* STEP 2 — CHOOSE PLAN */}
        {step === 2 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#ffffff', marginBottom: 4 }}>Choose your plan</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>14-day free trial on all plans — no credit card required</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
              {PLANS.map(p => {
                const isSelected = plan === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setPlan(p.id)}
                    style={{
                      background: isSelected ? '#ffffff' : 'rgba(255,255,255,0.05)',
                      border: `2px solid ${isSelected ? '#c9a84c' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: 12, padding: 20, cursor: 'pointer',
                      transition: 'all 0.15s', position: 'relative',
                    }}
                  >
                    {p.recommended && (
                      <div style={{
                        position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                        background: '#c9a84c', color: '#0d1b2a', fontSize: 10, fontWeight: 700,
                        padding: '3px 10px', borderRadius: 100, whiteSpace: 'nowrap',
                      }}>
                        MOST POPULAR
                      </div>
                    )}
                    <div style={{ fontSize: 14, fontWeight: 600, color: isSelected ? '#0d1b2a' : '#ffffff', marginBottom: 4 }}>{p.name}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 6 }}>
                      <span style={{ fontSize: 28, fontWeight: 300, color: isSelected ? '#0d1b2a' : '#ffffff' }}>{p.price}</span>
                      <span style={{ fontSize: 12, color: isSelected ? '#8a97a8' : 'rgba(255,255,255,0.4)' }}>{p.period}</span>
                    </div>
                    <div style={{ fontSize: 11, color: isSelected ? '#8a97a8' : 'rgba(255,255,255,0.4)', marginBottom: 14 }}>{p.desc}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {p.features.map(f => (
                        <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: '#c9a84c', fontSize: 12 }}>✓</span>
                          <span style={{ fontSize: 11, color: isSelected ? '#0d1b2a' : 'rgba(255,255,255,0.6)' }}>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {error && (
              <div style={{ padding: '8px 12px', background: '#fde8e8', borderRadius: 8, fontSize: 12, color: '#c03c3c', fontWeight: 500, marginBottom: 12 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  padding: '12px 24px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)',
                  background: 'transparent', color: '#ffffff', fontSize: 14, fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                ← Back
              </button>
              <button
                onClick={handleSignup}
                disabled={loading}
                style={{
                  flex: 1, padding: '12px', borderRadius: 8, border: 'none',
                  background: loading ? '#8a97a8' : '#c9a84c',
                  color: '#0d1b2a', fontSize: 14, fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                }}
              >
                {loading ? 'Creating your account...' : `Start Free Trial — ${PLANS.find(p => p.id === plan)?.name} Plan`}
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
              No credit card required · Cancel anytime · 14-day free trial
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
          © 2026 Drachma · Greek Life Finance Platform
        </div>

      </div>
    </div>
  );
}