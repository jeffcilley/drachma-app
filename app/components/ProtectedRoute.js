'use client';

import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/login';
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div style={{
        display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center',
        background: '#f5f7fa', fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 400,
            color: '#0d1b2a', letterSpacing: '0.05em', marginBottom: 16,
          }}>
            Drach<span style={{ color: '#c9a84c' }}>m</span>a
          </div>
          <div style={{ fontSize: 13, color: '#8a97a8' }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return children;
}