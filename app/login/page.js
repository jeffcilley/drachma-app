'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setError('');
    window.location.href = '/dashboard';
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0d1b2a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif", padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

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

        {/* CARD */}
        <div style={{
          background: '#ffffff', borderRadius: 16, padding: 32,
          boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
        }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#0d1b2a', marginBottom: 4 }}>Welcome back</div>
          <div style={{ fontSize: 13, color: '#8a97a8', marginBottom: 24 }}>Sign in to your chapter account</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#0d1b2a' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="treasurer@chapter.edu"
                style={{
                  padding: '10px 14px', borderRadius: 8, border: '1px solid #dce3eb',
                  fontSize: 13, color: '#0d1b2a', fontFamily: 'inherit', outline: 'none',
                  background: '#ffffff',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#0d1b2a' }}>Password</label>
                <a href="#" style={{ fontSize: 11, color: '#c9a84c', textDecoration: 'none' }}>Forgot password?</a>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                style={{
                  padding: '10px 14px', borderRadius: 8, border: '1px solid #dce3eb',
                  fontSize: 13, color: '#0d1b2a', fontFamily: 'inherit', outline: 'none',
                  background: '#ffffff',
                }}
              />
            </div>

            {error && (
              <div style={{ padding: '8px 12px', background: '#fde8e8', borderRadius: 8, fontSize: 12, color: '#c03c3c', fontWeight: 500 }}>
                {error}
              </div>
            )}

            <button
              onClick={handleLogin}
              style={{
                padding: '12px', borderRadius: 8, border: 'none',
                background: '#0d1b2a', color: '#ffffff', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit', marginTop: 4,
              }}
            >
              Sign In
            </button>

          </div>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#8a97a8' }}>
            Don't have an account?{' '}
            <a href="/signup" style={{ color: '#c9a84c', fontWeight: 600, textDecoration: 'none' }}>
              Start your free trial
            </a>
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
          © 2026 Drachma · Greek Life Finance Platform
        </div>

      </div>
    </div>
  );
}