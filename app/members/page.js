'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../lib/supabase';

const COLORS = ['#4a90d9','#c9a84c','#2ecc8a','#a78bfa','#e05c5c','#f5a623','#8a97a8'];
const SEMESTER = 'Spring 2026';

// ── HELPERS ───────────────────────────────────────────────────
function initials(name) { return name.split(' ').map(n => n[0]).join(''); }
function fmt(n) { return '$' + Number(n).toLocaleString(); }

function StatusPill({ status }) {
  const map = {
    paid:        { label: '✓ Paid',        cls: 'pill-paid' },
    outstanding: { label: 'Outstanding',   cls: 'pill-outstanding' },
    overdue:     { label: '⚠ Overdue',     cls: 'pill-overdue' },
  };
  const s = map[status] || map.outstanding;
  return <span className={`pill ${s.cls}`}>{s.label}</span>;
}

// ── MAIN PAGE ─────────────────────────────────────────────────
export default function MembersPage() {
  const { dbUser } = useAuth();
  const [activeTab, setActiveTab]       = useState('dues');
  const [members, setMembers]           = useState([]);
  const [dues, setDues]                 = useState([]);
  const [fines, setFines]               = useState([]);
  const [duesTiers, setDuesTiers]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selectedIds, setSelectedIds]   = useState(new Set());
  const [drawer, setDrawer]             = useState(null);       // member id or null
  const [toast, setToast]               = useState(null);       // { msg, showUndo, undo }
  const [lpModal, setLpModal]           = useState(null);       // { id, name } or null
  const [lpAmount, setLpAmount]         = useState('');
  const [fineForm, setFineForm]         = useState({ member: '', reason: '', amount: '' });
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [duesFilter, setDuesFilter]     = useState('All');
  const [finesFilter, setFinesFilter]   = useState('Unpaid');
  const [search, setSearch]             = useState('');
  const [addMemberModal, setAddMemberModal] = useState(false);
  const [newMember, setNewMember]       = useState({ name: '', email: '', cls: 'Freshman', pledge: '' });

  // ── FETCH DATA ─────────────────────────────────────────────
  useEffect(() => {
    if (!dbUser?.chapter_id) return;
    fetchData();
  }, [dbUser]);

  async function fetchData() {
    setLoading(true);
    const [membersRes, duesRes, finesRes, tiersRes] = await Promise.all([
      supabase.from('members').select('*').eq('chapter_id', dbUser.chapter_id).order('name'),
      supabase.from('dues_payments').select('*').eq('chapter_id', dbUser.chapter_id),
      supabase.from('fines').select('*').eq('chapter_id', dbUser.chapter_id).order('created_at', { ascending: false }),
      supabase.from('dues_tiers').select('*').eq('chapter_id', dbUser.chapter_id),
    ]);
    if (membersRes.data) setMembers(membersRes.data.map(m => ({
      ...m,
      color: COLORS[m.id % COLORS.length],
    })));
    if (duesRes.data) setDues(duesRes.data);
    if (finesRes.data) setFines(finesRes.data.map(f => ({
      ...f,
      name: membersRes.data?.find(m => m.id === f.member_id)?.name || '',
      amt: Number(f.amount),
      date: new Date(f.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    })));
    if (tiersRes.data) setDuesTiers(tiersRes.data);
    setLoading(false);
  }

  // ── ADD MEMBER ─────────────────────────────────────────────
  async function addMember() {
    if (!newMember.name.trim() || !newMember.email.trim()) return;

    const { data, error } = await supabase
      .from('members')
      .insert({
        chapter_id: dbUser.chapter_id,
        name: newMember.name.trim(),
        email: newMember.email.trim(),
        status: 'active',
        pledge_class: newMember.pledge.trim() || SEMESTER,
      })
      .select()
      .single();

    if (data) {
      // Create dues payment record
      if (duesTiers.length > 0) {
        await supabase.from('dues_payments').insert({
          chapter_id: dbUser.chapter_id,
          member_id: data.id,
          tier_id: duesTiers[0].id,
          semester: SEMESTER,
          amount_owed: duesTiers[0].amount,
          amount_paid: 0,
          status: 'outstanding',
        });
      }
      setMembers(ms => [...ms, { ...data, color: COLORS[data.id % COLORS.length] }]);
      setNewMember({ name: '', email: '', cls: 'Freshman', pledge: '' });
      setAddMemberModal(false);
      showToast(`${data.name} added`);
      fetchData();
    }
  }

  // ── TOAST ──────────────────────────────────────────────────
  function showToast(msg, undoFn = null) {
    setToast({ msg, undoFn });
    setTimeout(() => setToast(null), undoFn ? 10000 : 3000);
  }

  // ── DUES HELPERS ───────────────────────────────────────────
  function getMemberDues(memberId) {
    return dues.find(d => d.member_id === memberId && d.semester === SEMESTER);
  }

  function getMemberDuesStatus(memberId) {
    const d = getMemberDues(memberId);
    if (!d) return 'outstanding';
    return d.status || 'outstanding';
  }

  function getMemberPartialPaid(memberId) {
    const d = getMemberDues(memberId);
    return d ? Number(d.amount_paid) || 0 : 0;
  }

  function getMemberDuesOwed(memberId) {
    const d = getMemberDues(memberId);
    return d ? Number(d.amount_owed) || 0 : 0;
  }

  // ── DUES STATS ─────────────────────────────────────────────
  const DUES_AMOUNT   = duesTiers.length > 0 ? Number(duesTiers[0].amount) : 300;
  const collectedAmt  = dues.filter(d => d.semester === SEMESTER).reduce((s, d) => s + (Number(d.amount_paid) || 0), 0);
  const outstandingCt = dues.filter(d => d.semester === SEMESTER && d.status === 'outstanding').length;
  const overdueCt     = dues.filter(d => d.semester === SEMESTER && d.status === 'overdue').length;
  const paidCt        = dues.filter(d => d.semester === SEMESTER && d.status === 'paid').length;
  const totalExpected = members.length * DUES_AMOUNT;
  const pct           = totalExpected > 0 ? Math.round(collectedAmt / totalExpected * 100) : 0;

  // ── FINES STATS ────────────────────────────────────────────
  const finesOutstanding = fines.filter(f => !f.paid).reduce((s, f) => s + f.amt, 0);
  const finesCollected   = fines.filter(f =>  f.paid).reduce((s, f) => s + f.amt, 0);
  const finesTotal       = fines.reduce((s, f) => s + f.amt, 0);
  const membersFined     = new Set(fines.map(f => f.memberId)).size;

  // ── MARK DUES PAID ─────────────────────────────────────────
  async function markDuesPaid(id) {
    const member = members.find(m => m.id === id);
    const duesRecord = getMemberDues(id);

    if (duesRecord) {
      await supabase.from('dues_payments').update({
        status: 'paid',
        amount_paid: duesRecord.amount_owed,
        paid_date: new Date().toISOString().split('T')[0],
      }).eq('id', duesRecord.id);
    }

    // Auto-create income transaction
    await supabase.from('transactions').insert({
      chapter_id: dbUser.chapter_id,
      date: new Date().toISOString().split('T')[0],
      description: `Dues Payment — ${member.name}`,
      amount: DUES_AMOUNT,
      type: 'income',
      verified: true,
      notes: `${SEMESTER} dues`,
    });

    showToast(`${member.name} marked paid — transaction created`);
    fetchData();
  }

  // ── LOG PAYMENT (PARTIAL) ──────────────────────────────────
  async function confirmLogPayment() {
    const amount = parseFloat(lpAmount);
    if (!amount || amount <= 0) return;
    const member = members.find(m => m.id === lpModal.id);
    const duesRecord = getMemberDues(lpModal.id);
    const newPaid = getMemberPartialPaid(lpModal.id) + amount;

    if (newPaid >= DUES_AMOUNT) {
      setLpModal(null); setLpAmount('');
      markDuesPaid(lpModal.id);
      return;
    }

    if (duesRecord) {
      await supabase.from('dues_payments').update({
        amount_paid: newPaid,
        status: 'outstanding',
      }).eq('id', duesRecord.id);
    }

    // Auto-create income transaction for partial payment
    await supabase.from('transactions').insert({
      chapter_id: dbUser.chapter_id,
      date: new Date().toISOString().split('T')[0],
      description: `Partial Dues Payment — ${member.name}`,
      amount: amount,
      type: 'income',
      verified: true,
      notes: `${SEMESTER} dues — ${fmt(newPaid)} of ${fmt(DUES_AMOUNT)} paid`,
    });

    const remaining = DUES_AMOUNT - newPaid;
    setLpModal(null); setLpAmount('');
    await fetchData();
    showToast(`${fmt(amount)} logged for ${member.name} — ${fmt(remaining)} remaining`);
  }

  // ── MARK FINE PAID ─────────────────────────────────────────
  async function markFinePaid(fineId) {
    const fine = fines.find(f => f.id === fineId);
    await supabase.from('fines').update({ paid: true }).eq('id', fineId);

    // Auto-create income transaction
    await supabase.from('transactions').insert({
      chapter_id: dbUser.chapter_id,
      date: new Date().toISOString().split('T')[0],
      description: `Fine Payment — ${fine.name}`,
      amount: fine.amt,
      type: 'income',
      verified: true,
      notes: fine.reason,
    });

    showToast(`${fine.name} fine marked paid — transaction created`);
    fetchData();
  }

  // ── ISSUE FINE ─────────────────────────────────────────────
  async function issueFine() {
    if (!fineForm.member || !fineForm.reason || !fineForm.amount) return;
    const member = members.find(m => m.name === fineForm.member);
    if (!member) return;

    const { data, error } = await supabase.from('fines').insert({
      chapter_id: dbUser.chapter_id,
      member_id: member.id,
      reason: fineForm.reason,
      amount: parseFloat(fineForm.amount),
      paid: false,
    }).select().single();

    if (data) {
      setFineForm({ member: '', reason: '', amount: '' });
      setSelectedPreset(null);
      showToast(`Fine issued for ${member.name}`);
      fetchData();
    }
  }

  // ── BULK ACTIONS ───────────────────────────────────────────
  function bulkMarkPaid() {
    selectedIds.forEach(id => {
      const m = members.find(m => m.id === id);
      if (m && m.dues !== 'paid') markDuesPaid(id);
    });
    setSelectedIds(new Set());
  }

  function bulkMarkFinesPaid() {
    selectedIds.forEach(fineId => {
      const f = fines.find(f => f.id === fineId);
      if (f && !f.paid) markFinePaid(fineId);
    });
    setSelectedIds(new Set());
  }

  function toggleSelect(id) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // ── FILTERED LISTS ─────────────────────────────────────────
  const filteredMembers = members.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = duesFilter === 'All' || getMemberDuesStatus(m.id) === duesFilter.toLowerCase();
    return matchSearch && matchFilter;
  });

  const filteredFines = fines.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = finesFilter === 'All' ? true : finesFilter === 'Unpaid' ? !f.paid : f.paid;
    return matchSearch && matchFilter;
  });

  // ── DRAWER MEMBER ──────────────────────────────────────────
  const drawerMember = drawer ? members.find(m => m.id === drawer) : null;

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 32, color: '#0d1b2a', marginBottom: 12 }}>Drach<span style={{ color: '#c9a84c' }}>m</span>a</div>
        <div style={{ fontSize: 13, color: '#8a97a8' }}>Loading members...</div>
      </div>
    </div>
  );

  return (
    <ProtectedRoute>
    <div className="app-layout">

      {/* SIDEBAR */}
      <Sidebar activePage="members" />

      {/* MAIN */}
      <div className="main">

        {/* TOPBAR */}
        <div className="topbar">
          <div>
            <div className="topbar-title">Members &amp; Dues</div>
            <div className="topbar-sub">
              {activeTab === 'dues'
                ? `Spring 2025 · ${members.length} members · ${fmt(DUES_AMOUNT)} dues per member`
                : `Spring 2025 · ${fmt(finesOutstanding)} outstanding · ${fines.filter(f => !f.paid).length} open fines`}
            </div>
          </div>
          <div className="topbar-right">
            <button className="btn-outline">Export CSV</button>
            <button className="btn-outline">Import from GreekBill / OmegaFi</button>
            {activeTab === 'dues' && (
              <button className="btn" onClick={() => setAddMemberModal(true)}>+ Add Member</button>
            )}
          </div>
        </div>

        {/* CONTENT */}
        <div className="content">

          {/* PAGE TABS */}
          <div className="page-tabs">
            <button className={`page-tab ${activeTab === 'dues'  ? 'active' : ''}`} onClick={() => { setActiveTab('dues');  setSelectedIds(new Set()); setSearch(''); }}>Dues</button>
            <button className={`page-tab ${activeTab === 'fines' ? 'active' : ''}`} onClick={() => { setActiveTab('fines'); setSelectedIds(new Set()); setSearch(''); }}>Fines</button>
          </div>

          {/* ══ DUES TAB ══ */}
          {activeTab === 'dues' && (
            <>
              {/* Stats */}
              <div className="stats-row">
                <div className="stat-card green">
                  <div className="stat-label">Collected</div>
                  <div className="stat-value">{fmt(collectedAmt)}</div>
                  <div className="stat-sub">{paidCt} members paid</div>
                </div>
                <div className="stat-card gold">
                  <div className="stat-label">Outstanding</div>
                  <div className="stat-value">{fmt(outstandingCt * DUES_AMOUNT)}</div>
                  <div className="stat-sub">{outstandingCt} members outstanding</div>
                </div>
                <div className="stat-card red">
                  <div className="stat-label">Overdue</div>
                  <div className="stat-value">{fmt(overdueCt * DUES_AMOUNT)}</div>
                  <div className="stat-sub">{overdueCt} members overdue</div>
                </div>
                <div className="stat-card blue">
                  <div className="stat-label">Total Expected</div>
                  <div className="stat-value">{fmt(totalExpected)}</div>
                  <div className="stat-sub">{members.length} members · {fmt(DUES_AMOUNT)} each</div>
                </div>
              </div>

              <div className="main-grid dues-grid">
                {/* Roster card */}
                <div className="card">
                  <div className="card-header">
                    <div>
                      <div className="card-title">Member Roster</div>
                      <div className="card-sub">{members.length} members · Spring 2025</div>
                    </div>
                    <div className="header-controls">
                      <input className="search-input" placeholder="Search members..." value={search} onChange={e => setSearch(e.target.value)} />
                      <div className="filter-tabs">
                        {['All','Paid','Outstanding','Overdue'].map(f => (
                          <button key={f} className={`filter-tab ${duesFilter === f ? 'active' : ''}`} onClick={() => setDuesFilter(f)}>{f}</button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bulk bar */}
                  {selectedIds.size > 0 && (
                    <div className="bulk-bar">
                      <span className="bulk-count">{selectedIds.size} selected</span>
                      <div className="bulk-spacer" />
                      <button className="bulk-btn" onClick={() => showToast(`Reminder sent to ${selectedIds.size} members`)}>Send Reminder</button>
                      <button className="bulk-btn" onClick={bulkMarkPaid}>Mark All Paid</button>
                      <button className="bulk-clear" onClick={() => setSelectedIds(new Set())}>✕</button>
                    </div>
                  )}

                  {/* Table header */}
                  <div className="table-header dues-cols">
                    <div className="th" />
                    <div className="th">Member</div>
                    <div className="th">Class</div>
                    <div className="th">Paid So Far</div>
                    <div className="th">Remaining</div>
                    <div className="th">Status</div>
                    <div className="th">Actions</div>
                  </div>

                  {/* Rows */}
                  <div className="card-body">
                    {filteredMembers.map(m => {
                      const duesStatus = getMemberDuesStatus(m.id);
                      const partialPaid = getMemberPartialPaid(m.id);
                      const remaining = getMemberDuesOwed(m.id) - partialPaid;
                      const isSelected = selectedIds.has(m.id);
                      return (
                        <div key={m.id} className={`member-row dues-cols ${isSelected ? 'selected' : ''}`}>
                          <div className="row-check">
                            <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(m.id)} />
                          </div>
                          <div className="member-info">
                            <div className="member-av" style={{ background: `linear-gradient(135deg, ${m.color}, ${m.color}99)` }}>
                              {initials(m.name)}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div className="member-name">{m.name}</div>
                              <div className="member-email">{m.email}</div>
                            </div>
                          </div>
                          <div className="cell">{m.cls}</div>
                          <div className="cell-amt" style={{ color: duesStatus === 'paid' ? 'var(--green-text)' : partialPaid > 0 ? 'var(--blue)' : 'var(--gray)' }}>
                            {fmt(partialPaid)}
                          </div>
                          <div className="cell-amt" style={{ color: duesStatus === 'paid' ? 'var(--gray)' : duesStatus === 'overdue' ? 'var(--red-text)' : 'var(--navy)' }}>
                            {duesStatus === 'paid' ? '—' : fmt(remaining)}
                          </div>
                          <div><StatusPill status={duesStatus} /></div>
                          <div className="action-btns">
                            {duesStatus !== 'paid' && (
                              <>
                                <button className="ab ab-paid" onClick={() => markDuesPaid(m.id)}>✓ Mark Paid</button>
                                <button className="ab ab-partial" onClick={() => { setLpModal({ id: m.id, name: m.name }); setLpAmount(''); }}>Log Payment</button>
                                <button className="ab ab-remind">Remind</button>
                              </>
                            )}
                            <button className="ab" onClick={() => setDrawer(m.id)}>View</button>
                          </div>
                        </div>
                      );
                    })}
                    <div className="roster-footer">
                      Showing {filteredMembers.length} of {members.length} members
                    </div>
                  </div>
                </div>

                {/* Right col */}
                <div className="right-col">
                  {/* Dues Summary */}
                  <div className="card" style={{ flexShrink: 0 }}>
                    <div className="card-header"><div className="card-title">Dues Summary</div></div>
                    <div className="dues-breakdown">
                      <div>
                        <span className="dues-big">{fmt(collectedAmt)}</span>
                        <span className="dues-pct">{pct}%</span>
                      </div>
                      <div className="dues-hint">collected of {fmt(totalExpected)} total</div>
                      <div className="dues-bar-wrap"><div className="dues-bar-fill" style={{ width: `${pct}%` }} /></div>
                      <div className="breakdown-rows">
                        <div className="breakdown-row">
                          <div className="breakdown-label"><div className="breakdown-dot" style={{ background: 'var(--green)' }} />Paid</div>
                          <div><div className="breakdown-val">{fmt(collectedAmt)}</div><div className="breakdown-count">{paidCt} members</div></div>
                        </div>
                        <div className="breakdown-row">
                          <div className="breakdown-label"><div className="breakdown-dot" style={{ background: 'var(--gold)' }} />Outstanding</div>
                          <div><div className="breakdown-val">{fmt(outstandingCt * DUES_AMOUNT)}</div><div className="breakdown-count">{outstandingCt} members</div></div>
                        </div>
                        <div className="breakdown-row">
                          <div className="breakdown-label"><div className="breakdown-dot" style={{ background: 'var(--red)' }} />Overdue</div>
                          <div><div className="breakdown-val" style={{ color: 'var(--red-text)' }}>{fmt(overdueCt * DUES_AMOUNT)}</div><div className="breakdown-count">{overdueCt} members</div></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Import */}
                  <div className="card" style={{ flexShrink: 0 }}>
                    <div className="card-header"><div><div className="card-title">Import Roster</div><div className="card-sub">Sync from GreekBill or OmegaFi</div></div></div>
                    <div className="import-section">
                      <div className="import-box">
                        <div style={{ fontSize: 22, marginBottom: 6 }}>📂</div>
                        <div className="import-title">Drop your export file here</div>
                        <div className="import-sub">We match names and update payment statuses automatically</div>
                        <div className="import-formats">
                          {['CSV','XLSX','GreekBill','OmegaFi'].map(f => <span key={f} className="format-pill">{f}</span>)}
                        </div>
                      </div>
                      <div className="import-steps">
                        {[['Export','your payment report from GreekBill or OmegaFi'],['Drop it here','we map columns automatically'],['Review & confirm','all statuses update in one click']].map(([b,t],i) => (
                          <div key={i} className="import-step">
                            <div className="step-num">{i+1}</div>
                            <div className="step-text"><strong>{b}</strong> {t}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Send Reminders */}
                  <div className="card" style={{ flex: 1, minHeight: 0 }}>
                    <div className="card-header"><div className="card-title">Send Reminders</div></div>
                    <div className="reminder-section">
                      <div className="reminder-sub">{overdueCt} members are overdue. Send automated reminder emails in one click.</div>
                      <div className="overdue-list">
                        {members.filter(m => getMemberDuesStatus(m.id) === 'overdue').map(m => (
                          <div key={m.id} className="overdue-member">
                            <div className="overdue-av" style={{ background: m.color }}>{initials(m.name)}</div>
                            <div className="overdue-name">{m.name}</div>
                            <div className="overdue-days">overdue</div>
                          </div>
                        ))}
                      </div>
                      <button className="send-btn">Send Reminder to All {overdueCt}</button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ══ FINES TAB ══ */}
          {activeTab === 'fines' && (
            <>
              <div className="stats-row">
                <div className="stat-card purple">
                  <div className="stat-label">Outstanding</div>
                  <div className="stat-value">{fmt(finesOutstanding)}</div>
                  <div className="stat-sub">{fines.filter(f => !f.paid).length} unpaid fines</div>
                </div>
                <div className="stat-card green">
                  <div className="stat-label">Collected</div>
                  <div className="stat-value">{fmt(finesCollected)}</div>
                  <div className="stat-sub">This semester</div>
                </div>
                <div className="stat-card blue">
                  <div className="stat-label">Total Issued</div>
                  <div className="stat-value">{fmt(finesTotal)}</div>
                  <div className="stat-sub">Spring 2025</div>
                </div>
                <div className="stat-card gold">
                  <div className="stat-label">Members Fined</div>
                  <div className="stat-value">{membersFined}</div>
                  <div className="stat-sub">of {members.length} members</div>
                </div>
              </div>

              <div className="main-grid fines-grid">
                <div className="card">
                  <div className="card-header">
                    <div><div className="card-title">Active Fines</div><div className="card-sub">{fines.filter(f => !f.paid).length} unpaid · Spring 2025</div></div>
                    <div className="header-controls">
                      <input className="search-input" placeholder="Search members..." value={search} onChange={e => setSearch(e.target.value)} />
                      <div className="filter-tabs">
                        {['Unpaid','Paid','All'].map(f => (
                          <button key={f} className={`filter-tab ${finesFilter === f ? 'active' : ''}`} onClick={() => setFinesFilter(f)}>{f}</button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {selectedIds.size > 0 && (
                    <div className="bulk-bar">
                      <span className="bulk-count">{selectedIds.size} selected</span>
                      <div className="bulk-spacer" />
                      <button className="bulk-btn" onClick={bulkMarkFinesPaid}>Mark All Paid</button>
                      <button className="bulk-btn danger">Delete Selected</button>
                      <button className="bulk-clear" onClick={() => setSelectedIds(new Set())}>✕</button>
                    </div>
                  )}

                  <div className="table-header fines-cols">
                    <div className="th" />
                    <div className="th">Member</div>
                    <div className="th">Reason</div>
                    <div className="th">Issued</div>
                    <div className="th">Amount</div>
                    <div className="th">Actions</div>
                  </div>

                  <div className="card-body">
                    {filteredFines.map(f => (
                      <div key={f.id} className={`member-row fines-cols ${selectedIds.has(f.id) ? 'selected' : ''}`}>
                        <div className="row-check">
                          <input type="checkbox" checked={selectedIds.has(f.id)} onChange={() => toggleSelect(f.id)} />
                        </div>
                        <div className="member-info">
                          <div className="member-av" style={{ background: `linear-gradient(135deg, ${members.find(m => m.id === f.memberId)?.color || '#888'}, #555)` }}>
                            {initials(f.name)}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div className="member-name">{f.name}</div>
                          </div>
                        </div>
                        <div className="cell">{f.reason}</div>
                        <div className="cell">{f.date}</div>
                        <div className="cell-amt" style={{ color: f.paid ? 'var(--green-text)' : 'var(--fine-text)' }}>{fmt(f.amt)}</div>
                        <div className="action-btns">
                          {f.paid
                            ? <span className="pill pill-paid" style={{ fontSize: 10 }}>✓ Paid</span>
                            : <button className="ab ab-paid" onClick={() => markFinePaid(f.id)}>✓ Mark Paid</button>
                          }
                          <button className="ab" onClick={() => setDrawer(f.memberId)}>View</button>
                        </div>
                      </div>
                    ))}
                    <div className="roster-footer">Showing {filteredFines.length} of {fines.length} fines</div>
                  </div>
                </div>

                {/* Issue a Fine */}
                <div className="right-col">
                  <div className="card">
                    <div className="card-header"><div><div className="card-title">Issue a Fine</div><div className="card-sub">Quick presets or custom amount</div></div></div>
                    <div className="fines-section">
                      <div className="section-label">Quick Presets</div>
                      <div className="presets-wrap">
                        {[['Missed Chapter',25],['Dress Code',10],['Late Dues',15],['No Show',50]].map(([reason, amt]) => (
                          <span key={reason}
                            className={`preset-pill ${selectedPreset === reason ? 'selected' : ''}`}
                            onClick={() => { setSelectedPreset(reason); setFineForm(f => ({ ...f, reason, amount: String(amt) })); }}>
                            {reason} ${amt}
                          </span>
                        ))}
                        <span className="preset-pill preset-add">+ Add Preset</span>
                      </div>
                      <div className="section-label">Custom Fine</div>
                      <div className="fine-form">
                        <select value={fineForm.member} onChange={e => setFineForm(f => ({ ...f, member: e.target.value }))}>
                          <option value="">Select member...</option>
                          {members.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                        </select>
                        <input type="text" placeholder="Reason" value={fineForm.reason} onChange={e => setFineForm(f => ({ ...f, reason: e.target.value }))} />
                        <input type="number" placeholder="Amount ($)" value={fineForm.amount} onChange={e => setFineForm(f => ({ ...f, amount: e.target.value }))} />
                        <button className="fine-submit" onClick={issueFine}>Issue Fine</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* LOG PAYMENT MODAL */}
      {lpModal && (
        <div className="modal-overlay" onClick={() => setLpModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Log Payment</div>
            <div className="modal-sub">Recording payment for {lpModal.name}</div>
            <div className="field-label">Amount Received ($)</div>
            <input
              className="modal-input"
              type="number"
              placeholder="e.g. 150"
              value={lpAmount}
              onChange={e => setLpAmount(e.target.value)}
              autoFocus
            />
            <div className="modal-hint">
              Remaining balance: {fmt(getMemberDuesOwed(lpModal.id) - getMemberPartialPaid(lpModal.id))} of {fmt(getMemberDuesOwed(lpModal.id))}
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setLpModal(null)}>Cancel</button>
              <button className="btn" onClick={confirmLogPayment}>Confirm Payment</button>
            </div>
          </div>
        </div>
      )}

      {/* MEMBER DRAWER */}
      {drawer && (
        <>
          <div className="drawer-overlay" onClick={() => setDrawer(null)} />
          <div className="member-drawer">
            {drawerMember && (() => {
              const totalIssued = drawerMember.fines.reduce((s, f) => s + f.amt, 0);
              const totalPaid   = drawerMember.fines.filter(f => f.paid).reduce((s, f) => s + f.amt, 0);
              const totalOwed   = totalIssued - totalPaid;
              return (
                <>
                  <div className="drawer-header">
                    <div className="drawer-avatar-wrap">
                      <div className="drawer-avatar" style={{ background: `linear-gradient(135deg, ${drawerMember.color}, ${drawerMember.color}99)` }}>
                        {initials(drawerMember.name)}
                      </div>
                      <div>
                        <div className="drawer-name">{drawerMember.name}</div>
                        <div className="drawer-email">{drawerMember.email}</div>
                        <div className="drawer-meta">
                          <span className="drawer-tag">{drawerMember.cls}</span>
                          <span className="drawer-tag">Pledged {drawerMember.pledge}</span>
                        </div>
                      </div>
                    </div>
                    <button className="drawer-close" onClick={() => setDrawer(null)}>✕</button>
                  </div>
                  <div className="drawer-body">
                    <div className="drawer-section">
                      <div className="drawer-section-title">Dues — Spring 2025</div>
                      <div className="drawer-dues-row">
                        <StatusPill status={drawerMember.dues} />
                        <div style={{ textAlign: 'right' }}>
                          <div className="drawer-dues-amount">{fmt(DUES_AMOUNT)}</div>
                          <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 2 }}>Due Feb 1, 2025</div>
                        </div>
                      </div>
                    </div>
                    <div className="drawer-section">
                      <div className="drawer-section-title" style={{ marginBottom: 12 }}>Fines — Spring 2025</div>
                      <div className="drawer-fine-stats">
                        {[['Fines', drawerMember.fines.length],['Issued', fmt(totalIssued)],['Paid', fmt(totalPaid)],['Owed', totalOwed > 0 ? fmt(totalOwed) : '—']].map(([lbl, val]) => (
                          <div key={lbl} className="drawer-fine-stat">
                            <div className="drawer-fine-stat-val" style={{ color: lbl === 'Owed' && totalOwed > 0 ? 'var(--fine-text)' : 'var(--navy)' }}>{val}</div>
                            <div className="drawer-fine-stat-lbl">{lbl}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="drawer-section" style={{ borderBottom: 'none' }}>
                      <div className="drawer-section-title">Fine History</div>
                      {drawerMember.fines.length === 0
                        ? <div style={{ padding: '16px 0', textAlign: 'center', fontSize: 12, color: 'var(--gray)' }}>No fines this semester 🎉</div>
                        : drawerMember.fines.map((f, i) => (
                          <div key={i} className="drawer-fine-row">
                            <div style={{ flex: 1 }}>
                              <div className="drawer-fine-reason">{f.reason}</div>
                              <div className="drawer-fine-date">{f.date} · Spring 2025</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div className={`drawer-fine-amt ${f.paid ? 'paid-amt' : 'owed'}`}>{fmt(f.amt)}</div>
                              <div className="drawer-fine-status">{f.paid ? '✓ Paid' : 'Unpaid'}</div>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                  <div className="drawer-footer">
                    <button className="drawer-btn secondary" onClick={() => setDrawer(null)}>Close</button>
                    <button className="drawer-btn fine-btn">+ Issue Fine</button>
                    <button className="drawer-btn primary">Send Reminder</button>
                  </div>
                </>
              );
            })()}
          </div>
        </>
      )}

      {/* ADD MEMBER MODAL */}
      {addMemberModal && (
        <div className="modal-overlay" onClick={() => setAddMemberModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Add Member</div>
            <div className="modal-sub">New member will be set to outstanding dues</div>
            <div className="modal-fields">
              <div className="modal-field">
                <div className="field-label">Full Name</div>
                <input className="modal-input" placeholder="e.g. Marcus Johnson" value={newMember.name} onChange={e => setNewMember(m => ({ ...m, name: e.target.value }))} autoFocus />
              </div>
              <div className="modal-field">
                <div className="field-label">Email</div>
                <input className="modal-input" placeholder="e.g. mjohnson@uidaho.edu" value={newMember.email} onChange={e => setNewMember(m => ({ ...m, email: e.target.value }))} />
              </div>
              <div className="modal-field">
                <div className="field-label">Class Year</div>
                <select className="modal-input" value={newMember.cls} onChange={e => setNewMember(m => ({ ...m, cls: e.target.value }))}>
                  <option>Freshman</option>
                  <option>Sophomore</option>
                  <option>Junior</option>
                  <option>Senior</option>
                </select>
              </div>
              <div className="modal-field">
                <div className="field-label">Pledge Class</div>
                <input className="modal-input" placeholder="e.g. Fall 2024" value={newMember.pledge} onChange={e => setNewMember(m => ({ ...m, pledge: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setAddMemberModal(false)}>Cancel</button>
              <button className="btn" onClick={addMember}>Add Member</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className="toast show">
          <span>{toast.msg}</span>
          {toast.undoFn && (
            <>
              <div className="toast-divider" />
              <button className="toast-btn" onClick={() => { toast.undoFn(); setToast(null); }}>Undo</button>
            </>
          )}
          <button className="toast-x" onClick={() => setToast(null)}>✕</button>
        </div>
      )}
    </div>
    </ProtectedRoute>
  );
}