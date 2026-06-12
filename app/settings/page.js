'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../lib/supabase';

const inputStyle = {
  padding: '8px 12px', borderRadius: 8, border: '1px solid #dce3eb',
  fontSize: 13, color: '#0d1b2a', fontFamily: 'inherit', outline: 'none',
  background: '#ffffff', width: '100%', boxSizing: 'border-box',
};

function Section({ title, subtitle, children }) {
  return (
    <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #eef0f4', overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #eef0f4' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0d1b2a' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: '#8a97a8', marginTop: 2 }}>{subtitle}</div>}
      </div>
      <div style={{ padding: '20px 24px' }}>
        {children}
      </div>
    </div>
  );
}

function FieldRow({ label, subtitle, children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, paddingBottom: 16, marginBottom: 16, borderBottom: '1px solid #f3f5f8' }}>
      <div style={{ flexShrink: 0, width: 200 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#0d1b2a' }}>{label}</div>
        {subtitle && <div style={{ fontSize: 11, color: '#8a97a8', marginTop: 2, lineHeight: 1.5 }}>{subtitle}</div>}
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 40, height: 22, borderRadius: 100, cursor: 'pointer',
        background: value ? '#0d1b2a' : '#dce3eb', transition: 'background 0.2s',
        position: 'relative', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 3, left: value ? 21 : 3,
        width: 16, height: 16, borderRadius: '50%', background: '#ffffff',
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </div>
  );
}

export default function SettingsPage() {
  const { dbUser } = useAuth();
  const [chapterName, setChapterName] = useState('');
  const [university, setUniversity] = useState('');
  const [greekLetters, setGreekLetters] = useState('');
  const [foundingYear, setFoundingYear] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#c9a84c');
  const [plan, setPlan] = useState('chapter');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState({
    overdueDues: true,
    budgetWarnings: true,
    newTransactions: false,
    weeklyReport: true,
    paymentFailed: true,
  });
  const [toast, setToast] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!dbUser?.chapter_id) return;
    fetchData();
  }, [dbUser]);

  async function fetchData() {
    setLoading(true);
    const [chapterRes, usersRes] = await Promise.all([
      supabase.from('chapters').select('*').eq('id', dbUser.chapter_id).single(),
      supabase.from('users').select('*').eq('chapter_id', dbUser.chapter_id),
    ]);

    if (chapterRes.data) {
      const c = chapterRes.data;
      setChapterName(c.name || '');
      setUniversity(c.university || '');
      setGreekLetters(c.greek_letters || '');
      setFoundingYear(c.founding_year ? String(c.founding_year) : '');
      setPrimaryColor(c.primary_color || '#c9a84c');
      setPlan(c.plan || 'starter');
    }

    if (usersRes.data) {
      setUsers(usersRes.data.map(u => ({
        name: u.name,
        role: u.role || 'Member',
        email: u.email,
        avatar: u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
      })));
    }

    setLoading(false);
  }

  async function saveChapterInfo() {
    const { error, data } = await supabase.from('chapters').update({
      name: chapterName,
      university,
      greek_letters: greekLetters,
      founding_year: foundingYear ? parseInt(foundingYear) : null,
    }).eq('id', dbUser.chapter_id).select();
    
    if (!error) {
      showToast('✓ Chapter info saved!');
      setTimeout(() => window.location.reload(), 1500);
    } else showToast('Error saving — please try again');
  }

  async function saveBranding() {
    const { error } = await supabase.from('chapters').update({
      primary_color: primaryColor,
    }).eq('id', dbUser.chapter_id);
    if (!error) {
      showToast('✓ Branding saved!');
      setTimeout(() => window.location.reload(), 1500);
    } else showToast('Error saving — please try again');
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 32, color: '#0d1b2a', marginBottom: 12 }}>Drach<span style={{ color: '#c9a84c' }}>m</span>a</div>
        <div style={{ fontSize: 13, color: '#8a97a8' }}>Loading settings...</div>
      </div>
    </div>
  );

  return (
    <ProtectedRoute>
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f5f7fa', fontFamily: "'DM Sans', sans-serif" }}>
      <Sidebar activePage="settings" />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* TOPBAR */}
        <div style={{ padding: '20px 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#0d1b2a' }}>Settings</div>
            <div style={{ fontSize: 12, color: '#8a97a8', marginTop: 2 }}>Manage your chapter account and preferences</div>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
          <div style={{ maxWidth: 720 }}>

            {/* CHAPTER INFO */}
            <Section title="Chapter Info" subtitle="Basic information about your chapter">
              <FieldRow label="Chapter Name" subtitle="Your chapter's full display name">
                <input style={inputStyle} value={chapterName} onChange={e => setChapterName(e.target.value)} />
              </FieldRow>
              <FieldRow label="University" subtitle="The university your chapter is affiliated with">
                <input style={inputStyle} value={university} onChange={e => setUniversity(e.target.value)} />
              </FieldRow>
              <FieldRow label="Greek Letters" subtitle="Your chapter's Greek letter designation">
                <input style={inputStyle} value={greekLetters} onChange={e => setGreekLetters(e.target.value)} />
              </FieldRow>
              <FieldRow label="Founding Year" subtitle="The year your chapter was founded">
                <input style={{ ...inputStyle, width: 120 }} value={foundingYear} onChange={e => setFoundingYear(e.target.value)} />
              </FieldRow>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                <button onClick={saveChapterInfo} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#0d1b2a', color: '#ffffff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Save Changes
                </button>
              </div>
            </Section>

            {/* BRANDING */}
            <Section title="Branding" subtitle="Customize how Drachma looks for your chapter">
              <FieldRow label="Chapter Color" subtitle="Used as your accent color throughout the app">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} style={{ width: 40, height: 36, borderRadius: 8, border: '1px solid #dce3eb', cursor: 'pointer', padding: 2, background: '#ffffff' }} />
                  <input style={{ ...inputStyle, width: 120 }} value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} />
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: primaryColor, flexShrink: 0 }} />
                </div>
              </FieldRow>
              <FieldRow label="Chapter Logo" subtitle="Upload your chapter crest or logo (pending national HQ approval)">
                <div style={{ border: '2px dashed #dce3eb', borderRadius: 8, padding: '16px', textAlign: 'center', cursor: 'pointer', background: '#f8f9fb' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#c9a84c'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#dce3eb'}
                >
                  <div style={{ fontSize: 20, marginBottom: 6 }}>🏛️</div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#0d1b2a', marginBottom: 2 }}>Upload logo</div>
                  <div style={{ fontSize: 11, color: '#8a97a8' }}>PNG or SVG recommended</div>
                </div>
              </FieldRow>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                <button onClick={saveBranding} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#0d1b2a', color: '#ffffff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Save Changes
                </button>
              </div>
            </Section>

            {/* BILLING */}
            <Section title="Billing & Subscription" subtitle="Manage your Drachma subscription">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#f8f9fb', borderRadius: 10, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0d1b2a', marginBottom: 2 }}>
                    {plan === 'starter' ? 'Starter Plan — $19/month' : plan === 'council' ? 'Council Plan — $99/month' : 'Chapter Plan — $39/month'}
                  </div>
                  <div style={{ fontSize: 11, color: '#8a97a8' }}>Manage your subscription via the billing portal</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => showToast('Redirecting to billing portal...')} style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid #dce3eb', background: '#ffffff', color: '#0d1b2a', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Manage Billing
                  </button>
                  <button onClick={() => showToast('Redirecting to upgrade page...')} style={{ padding: '6px 14px', borderRadius: 7, border: 'none', background: '#0d1b2a', color: '#ffffff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Upgrade Plan
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { name: 'Starter', price: '$19/mo', current: plan === 'starter' },
                  { name: 'Chapter', price: '$39/mo', current: plan === 'chapter' },
                  { name: 'Council', price: '$99/mo', current: plan === 'council' },
                ].map(plan => (
                  <div key={plan.name} style={{
                    flex: 1, padding: '12px 14px', borderRadius: 10,
                    border: `2px solid ${plan.current ? '#c9a84c' : '#eef0f4'}`,
                    background: plan.current ? '#fdf8ee' : '#f8f9fb',
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0d1b2a', marginBottom: 2 }}>{plan.name}</div>
                    <div style={{ fontSize: 12, color: '#8a97a8' }}>{plan.price}</div>
                    {plan.current && <div style={{ fontSize: 10, fontWeight: 700, color: '#c9a84c', marginTop: 4 }}>CURRENT PLAN</div>}
                  </div>
                ))}
              </div>
            </Section>

            {/* USERS & ACCESS */}
            <Section title="Users & Access" subtitle="Manage who has access to your chapter's Drachma account">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                {users.map(user => (
                  <div key={user.email} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#f8f9fb', borderRadius: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #c9a84c, #8b6914)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#0d1b2a', flexShrink: 0 }}>
                      {user.avatar}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#0d1b2a' }}>{user.name}</div>
                      <div style={{ fontSize: 11, color: '#8a97a8' }}>{user.email}</div>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 100, background: '#eef0f4', color: '#8a97a8' }}>
                      {user.role}
                    </div>
                    {user.role !== 'Treasurer' && (
                      <button style={{ fontSize: 11, color: '#e05c5c', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Remove</button>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={() => showToast('Invite sent!')} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #dce3eb', background: '#ffffff', color: '#0d1b2a', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                + Invite Member
              </button>
            </Section>

            {/* NOTIFICATIONS */}
            <Section title="Notifications" subtitle="Choose what you get notified about">
              {[
                { key: 'overdueDues', label: 'Overdue dues alerts', desc: 'Get notified when member dues become overdue' },
                { key: 'budgetWarnings', label: 'Budget warnings', desc: 'Alert when a category reaches 80% of its budget' },
                { key: 'newTransactions', label: 'New transactions', desc: 'Notify me when a new transaction is logged' },
                { key: 'weeklyReport', label: 'Weekly summary email', desc: 'Receive a weekly financial summary every Monday' },
                { key: 'paymentFailed', label: 'Payment failed alerts', desc: 'Get notified if a Stripe payment fails' },
              ].map((item, i, arr) => (
                <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: i < arr.length - 1 ? 14 : 0, marginBottom: i < arr.length - 1 ? 14 : 0, borderBottom: i < arr.length - 1 ? '1px solid #f3f5f8' : 'none' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#0d1b2a' }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: '#8a97a8', marginTop: 2 }}>{item.desc}</div>
                  </div>
                  <Toggle value={notifications[item.key]} onChange={val => setNotifications(prev => ({ ...prev, [item.key]: val }))} />
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                <button onClick={() => showToast('✓ Notification preferences saved!')} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#0d1b2a', color: '#ffffff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Save Changes
                </button>
              </div>
            </Section>

            {/* DANGER ZONE */}
            <Section title="Danger Zone" subtitle="Irreversible actions — proceed with caution">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#0d1b2a' }}>Delete Chapter Account</div>
                  <div style={{ fontSize: 11, color: '#8a97a8', marginTop: 2 }}>Permanently delete your chapter's Drachma account and all data</div>
                </div>
                <button onClick={() => setShowDeleteConfirm(true)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(224,92,92,0.4)', background: '#fde8e8', color: '#c03c3c', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                  Delete Account
                </button>
              </div>
            </Section>

          </div>
        </div>
      </main>

      {/* TOAST */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          background: '#0d1b2a', color: '#ffffff', padding: '14px 20px',
          borderRadius: 12, fontSize: 13, fontWeight: 500, zIndex: 200,
          boxShadow: '0 8px 40px rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.1)',
        }}>
          {toast}
        </div>
      )}

      {/* DELETE CONFIRM */}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,27,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#ffffff', borderRadius: 16, padding: 28, width: 400, boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#0d1b2a', marginBottom: 8 }}>Delete chapter account?</div>
            <div style={{ fontSize: 13, color: '#8a97a8', marginBottom: 24, lineHeight: 1.6 }}>
              This will permanently delete <strong style={{ color: '#0d1b2a' }}>PKA — Zeta Mu</strong> and all associated data including transactions, budgets, and member records. This cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #dce3eb', background: '#ffffff', color: '#0d1b2a', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={() => { setShowDeleteConfirm(false); showToast('Account deletion requested'); }} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#e05c5c', color: '#ffffff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Yes, Delete Everything</button>
            </div>
          </div>
        </div>
      )}

    </div>
    </ProtectedRoute>
  );
}