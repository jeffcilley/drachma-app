'use client';

import { useAuth } from '../context/AuthContext';

const navSections = [
  {
    label: 'Overview',
    items: [
      { icon: '⬡', label: 'Dashboard',    href: '/dashboard',    id: 'dashboard' },
      { icon: '📊', label: 'Budget',       href: '/budget',       id: 'budget' },
      { icon: '↕',  label: 'Transactions', href: '/transactions', id: 'transactions' },
    ],
  },
  {
    label: 'Chapter',
    items: [
      { icon: '👥', label: 'Members & Dues',  href: '/members',  id: 'members', badge: null },
      { icon: '📅', label: 'Events', href: '/events', id: 'events' },
      { icon: '🧾', label: 'Receipt Scanner', href: '/scanner',  id: 'scanner' },
      { icon: '📄', label: 'Reports',         href: '/reports',  id: 'reports' },
      { icon: '🗂️', label: 'Documents',       href: '/documents', id: 'documents' },
    ],
  },
  {
    label: 'Access',
    items: [
      { icon: '🏛️', label: 'Advisor Portal', href: '/advisor', id: 'advisor' },
      { icon: '⚙',  label: 'Settings', href: '/settings', id: 'settings' },
    ],
  },
];

export default function Sidebar({ activePage }) {
  const { dbUser, chapter } = useAuth();

  const chapterName = chapter?.name || 'Chapter';
  const university = chapter?.university || '';
  const greekLetters = chapter?.greek_letters || '';
  const userName = dbUser?.name || '';
  const userRole = dbUser?.role || 'Member';
  const userInitials = userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const planLabel = chapter?.plan === 'starter' ? 'Starter Plan' : chapter?.plan === 'council' ? 'Council Plan' : 'Chapter Plan';

  return (
    <aside style={{
      width: 240,
      background: '#0d1b2a',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
      flexShrink: 0,
    }}>

      {/* LOGO */}
      <div style={{
        padding: '28px 24px 24px',
        fontFamily: 'var(--font-cormorant), Georgia, serif',
        fontSize: 28,
        fontWeight: 400,
        color: '#ffffff',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        letterSpacing: '0.05em',
      }}>
        Drach<span style={{ color: '#c9a84c' }}>m</span>a
      </div>

      {/* CHAPTER */}
      <div style={{
        padding: '14px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff' }}>{chapterName}</div>
          {greekLetters && <div style={{ fontSize: 11, color: '#c9a84c', fontWeight: 600 }}>{greekLetters}</div>}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{university}</div>
      </div>

      {/* NAV */}
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {navSections.map(section => (
          <div key={section.label}>
            <div style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.25)',
              padding: '16px 24px 6px',
            }}>
              {section.label}
            </div>
            {section.items.map(item => {
              const isActive = activePage === item.id;
              return (
                <a key={item.id} href={item.href} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px 10px 20px',
                  margin: '1px 8px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  background: isActive ? 'rgba(201,168,76,0.12)' : 'transparent',
                  color: isActive ? '#e2c47a' : 'rgba(255,255,255,0.5)',
                  fontSize: 13,
                  fontWeight: isActive ? 500 : 400,
                  textDecoration: 'none',
                  transition: 'background 0.15s, color 0.15s',
                }}>
                  <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>{item.icon}</span>
                  {item.label}
                  {item.badge && (
                    <span style={{
                      marginLeft: 'auto',
                      background: '#e05c5c',
                      color: '#ffffff',
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 100,
                    }}>{item.badge}</span>
                  )}
                </a>
              );
            })}
          </div>
        ))}
      </nav>

      {/* USER */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, #c9a84c, #8b6914)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: '#0d1b2a', flexShrink: 0,
          }}>{userInitials}</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#ffffff' }}>{userName}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>{userRole} · {planLabel}</div>
          </div>
        </div>
      </div>

    </aside>
  );
}