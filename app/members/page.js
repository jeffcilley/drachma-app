'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../lib/supabase';

const COLORS = ['#4a90d9','#c9a84c','#2ecc8a','#a78bfa','#e05c5c','#f5a623','#8a97a8'];
function getCurrentSemester() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  return month >= 8 ? `Fall ${year}` : `Spring ${year}`;
}
const SEMESTER = getCurrentSemester();

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
  const [newMember, setNewMember]       = useState({ name: '', email: '', cls: 'Freshman', pledge: '', tierId: '' });
  const [showDropped, setShowDropped]   = useState(false);
  const [editDuesModal, setEditDuesModal] = useState(null);
  const [editDuesAmount, setEditDuesAmount] = useState('');
  const [drawerFineForm, setDrawerFineForm] = useState({ reason: '', amount: '' });
  const [drawerFinePreset, setDrawerFinePreset] = useState(null);
  const [importModal, setImportModal]   = useState(false);
  const [editMemberModal, setEditMemberModal] = useState(null);
  const [editMemberForm, setEditMemberForm] = useState({ name: '', email: '', pledge_class: '' });
  const [importStep, setImportStep]     = useState(1);
  const [importRows, setImportRows]     = useState([]);
  const [importHeaders, setImportHeaders] = useState([]);
  const [importMapping, setImportMapping] = useState({ name: '', email: '', pledge: '', tier: '' });
  const [importing, setImporting]       = useState(false);

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
      const selectedTier = duesTiers.find(t => t.id === parseInt(newMember.tierId)) || duesTiers[0];
      if (selectedTier) {
        await supabase.from('dues_payments').insert({
          chapter_id: dbUser.chapter_id,
          member_id: data.id,
          tier_id: selectedTier.id,
          semester: SEMESTER,
          amount_owed: selectedTier.amount,
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
  const activeMembers = members.filter(m => m.status !== 'dropped');
  const semesterDues  = dues.filter(d => d.semester === SEMESTER);
  const activeSemesterDues = semesterDues.filter(d => activeMembers.some(m => m.id === d.member_id));
  const collectedAmt  = semesterDues.reduce((s, d) => s + (Number(d.amount_paid) || 0), 0);
  const outstandingCt = activeSemesterDues.filter(d => d.status === 'outstanding').length;
  const overdueCt     = activeSemesterDues.filter(d => d.status === 'overdue').length;
  const paidCt        = activeSemesterDues.filter(d => d.status === 'paid').length;
  const totalExpected = semesterDues.reduce((s, d) => {
    const member = members.find(m => m.id === d.member_id);
    const isDropped = member?.status === 'dropped';
    if (isDropped) {
      // Only include what they've already paid
      return s + (Number(d.amount_paid) || 0);
    }
    return s + (Number(d.amount_owed) || 0);
  }, 0);
  const pct           = totalExpected > 0 ? Math.round(collectedAmt / totalExpected * 100) : 0;
  const droppedCount  = members.filter(m => m.status === 'dropped').length;

  // ── FINES STATS ────────────────────────────────────────────
  const finesOutstanding = fines.filter(f => !f.paid).reduce((s, f) => s + f.amt, 0);
  const finesCollected   = fines.filter(f =>  f.paid).reduce((s, f) => s + f.amt, 0);
  const finesTotal       = fines.reduce((s, f) => s + f.amt, 0);
  const membersFined     = new Set(fines.map(f => f.member_id)).size;

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
    const { data: duesCat } = await supabase
      .from('budget_categories')
      .select('id')
      .eq('chapter_id', dbUser.chapter_id)
      .ilike('name', 'dues collected')
      .single();

    await supabase.from('transactions').insert({
      chapter_id: dbUser.chapter_id,
      date: new Date().toISOString().split('T')[0],
      description: `Dues Payment — ${member.name}`,
      amount: DUES_AMOUNT,
      type: 'income',
      category_id: duesCat?.id || null,
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

    const amountOwed = getMemberDuesOwed(lpModal.id);
    if (newPaid >= amountOwed) {
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
    const { data: duesCat } = await supabase
      .from('budget_categories')
      .select('id')
      .eq('chapter_id', dbUser.chapter_id)
      .ilike('name', 'dues collected')
      .single();

    await supabase.from('transactions').insert({
      chapter_id: dbUser.chapter_id,
      date: new Date().toISOString().split('T')[0],
      description: `Partial Dues Payment — ${member.name}`,
      amount: amount,
      type: 'income',
      category_id: duesCat?.id || null,
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
  async function bulkMarkPaid() {
    for (const id of selectedIds) {
      const status = getMemberDuesStatus(id);
      if (status !== 'paid') await markDuesPaid(id);
    }
    setSelectedIds(new Set());
  }

  function bulkMarkFinesPaid() {
    selectedIds.forEach(fineId => {
      const f = fines.find(f => f.id === fineId);
      if (f && !f.paid) markFinePaid(fineId);
    });
    setSelectedIds(new Set());
  }

  async function saveEditMember() {
    if (!editMemberForm.name.trim()) return;
    const { error } = await supabase.from('members').update({
      name: editMemberForm.name.trim(),
      email: editMemberForm.email.trim(),
      pledge_class: editMemberForm.pledge_class.trim(),
    }).eq('id', editMemberModal.id);

    if (!error) {
      setMembers(prev => prev.map(m => m.id === editMemberModal.id ? {
        ...m,
        name: editMemberForm.name.trim(),
        email: editMemberForm.email.trim(),
        pledge_class: editMemberForm.pledge_class.trim(),
      } : m));
      showToast(`${editMemberForm.name} updated`);
      setEditMemberModal(null);
      fetchData();
    }
  }

  async function saveEditDues() {
    const amount = parseFloat(editDuesAmount);
    if (!amount || amount <= 0) return;
    const duesRecord = getMemberDues(editDuesModal.id);
    if (duesRecord) {
      const currentPaid = Number(duesRecord.amount_paid) || 0;
      const newStatus = currentPaid >= amount ? 'paid' : currentPaid > 0 ? 'outstanding' : duesRecord.status;
      const { error } = await supabase.from('dues_payments').update({
        amount_owed: amount,
        status: newStatus,
      }).eq('id', duesRecord.id);
      if (!error) {
        setDues(prev => prev.map(d => d.id === duesRecord.id ? { ...d, amount_owed: amount, status: newStatus } : d));
        showToast(`Dues updated to ${fmt(amount)} for ${editDuesModal.name}`);
        setEditDuesModal(null);
      }
    }
  }

  function toggleSelect(id) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // ── CSV IMPORT ─────────────────────────────────────────────
  function handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) return;
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      const rows = lines.slice(1).map(line => {
        const vals = line.split(',').map(v => v.replace(/"/g, '').trim());
        const row = {};
        headers.forEach((h, i) => row[h] = vals[i] || '');
        return row;
      });
      setImportHeaders(headers);
      setImportRows(rows);
      // Auto-detect common column names
      const autoMap = { name: '', email: '', pledge: '', tier: '' };
      headers.forEach(h => {
        const lower = h.toLowerCase();
        if (!autoMap.name && (lower.includes('name') || lower.includes('full'))) autoMap.name = h;
        if (!autoMap.email && lower.includes('email')) autoMap.email = h;
        if (!autoMap.pledge && (lower.includes('pledge') || lower.includes('class'))) autoMap.pledge = h;
        if (!autoMap.tier && (lower.includes('tier') || lower.includes('dues') || lower.includes('amount'))) autoMap.tier = h;
      });
      setImportMapping(autoMap);
      setImportStep(2);
    };
    reader.readAsText(file);
  }

  async function confirmImport() {
    if (!importMapping.name) return;
    setImporting(true);
    let successCount = 0;
    const defaultTier = duesTiers.length > 0 ? duesTiers[0] : null;

    for (const row of importRows) {
      const name = row[importMapping.name]?.trim();
      if (!name) continue;

      // Check if member already exists
      const exists = members.some(m => m.name.toLowerCase() === name.toLowerCase());
      if (exists) continue;

      const { data: newMember } = await supabase
        .from('members')
        .insert({
          chapter_id: dbUser.chapter_id,
          name,
          email: importMapping.email ? row[importMapping.email]?.trim() || '' : '',
          status: 'active',
          pledge_class: importMapping.pledge ? row[importMapping.pledge]?.trim() || SEMESTER : SEMESTER,
        })
        .select()
        .single();

      if (newMember && defaultTier) {
        await supabase.from('dues_payments').insert({
          chapter_id: dbUser.chapter_id,
          member_id: newMember.id,
          tier_id: defaultTier.id,
          semester: SEMESTER,
          amount_owed: defaultTier.amount,
          amount_paid: 0,
          status: 'outstanding',
        });
      }
      successCount++;
    }

    setImporting(false);
    setImportModal(false);
    setImportStep(1);
    setImportRows([]);
    setImportHeaders([]);
    showToast(`${successCount} members imported successfully`);
    fetchData();
  }

  // ── EXPORT CSV ─────────────────────────────────────────────
  function exportCSV() {
    if (activeTab === 'dues') {
      const headers = ['Name', 'Email', 'Dues Owed', 'Paid So Far', 'Remaining', 'Status'];
      const rows = members
        .filter(m => m.status !== 'dropped')
        .map(m => [
          '"' + m.name + '"',
          '"' + (m.email || '') + '"',
          getMemberDuesOwed(m.id),
          getMemberPartialPaid(m.id),
          getMemberDuesOwed(m.id) - getMemberPartialPaid(m.id),
          getMemberDuesStatus(m.id),
        ]);
      const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'drachma-dues.csv'; a.click();
      URL.revokeObjectURL(url);
      showToast('Dues exported to CSV');
    } else {
      const headers = ['Member', 'Reason', 'Amount', 'Date', 'Status'];
      const rows = fines.map(f => [
        '"' + f.name + '"',
        '"' + f.reason + '"',
        f.amt,
        f.date,
        f.paid ? 'Paid' : 'Unpaid',
      ]);
      const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'drachma-fines.csv'; a.click();
      URL.revokeObjectURL(url);
      showToast('Fines exported to CSV');
    }
  }

  // ── FILTERED LISTS ─────────────────────────────────────────
  const filteredMembers = members.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = duesFilter === 'All' || getMemberDuesStatus(m.id) === duesFilter.toLowerCase();
    const matchDropped = showDropped ? true : m.status !== 'dropped';
    return matchSearch && matchFilter && matchDropped;
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
                ? `${SEMESTER} · ${activeMembers.length} active members · ${fmt(DUES_AMOUNT)} dues per member`
                : `${SEMESTER} · ${fmt(finesOutstanding)} outstanding · ${fines.filter(f => !f.paid).length} open fines`}
            </div>
          </div>
          <div className="topbar-right">
            <button className="btn-outline" onClick={exportCSV}>Export CSV</button>
            <button className="btn-outline" onClick={() => { setImportModal(true); setImportStep(1); }}>Import from CSV</button>
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
                  <div className="stat-value">{fmt(semesterDues.filter(d => d.status === 'outstanding').reduce((s, d) => s + (Number(d.amount_owed) - Number(d.amount_paid || 0)), 0))}</div>
                  <div className="stat-sub">{outstandingCt} members outstanding</div>
                </div>
                <div className="stat-card red">
                  <div className="stat-label">Overdue</div>
                  <div className="stat-value">{fmt(semesterDues.filter(d => d.status === 'overdue').reduce((s, d) => s + (Number(d.amount_owed) - Number(d.amount_paid || 0)), 0))}</div>
                  <div className="stat-sub">{overdueCt} members overdue</div>
                </div>
                <div className="stat-card blue">
                  <div className="stat-label">Total Expected</div>
                  <div className="stat-value">{fmt(totalExpected)}</div>
                  <div className="stat-sub">{members.length} members this semester</div>
                </div>
              </div>

              <div className="main-grid dues-grid">
                {/* Roster card */}
                <div className="card">
                  <div className="card-header">
                    <div>
                      <div className="card-title">Member Roster</div>
                      <div className="card-sub">{members.length} members · `${SEMESTER}`</div>
                    </div>
                    <div className="header-controls">
                      <input className="search-input" placeholder="Search members..." value={search} onChange={e => setSearch(e.target.value)} />
                      <div className="filter-tabs">
                        {['All','Paid','Outstanding','Overdue'].map(f => (
                          <button key={f} className={`filter-tab ${duesFilter === f ? 'active' : ''}`} onClick={() => setDuesFilter(f)}>{f}</button>
                        ))}
                      </div>
                      {droppedCount > 0 && (
                        <button
                          onClick={() => setShowDropped(o => !o)}
                          style={{ padding: '5px 10px', borderRadius: 100, fontSize: 11, fontWeight: 500, cursor: 'pointer', border: '1px solid #dce3eb', background: showDropped ? '#0d1b2a' : 'transparent', color: showDropped ? '#ffffff' : '#8a97a8', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                        >{showDropped ? 'Hide Dropped' : `Show Dropped (${droppedCount})`}</button>
                      )}
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

                  {/* Table header + body scroll wrapper */}
                  <div style={{ overflowX: 'auto', flex: 1 }}>
                  <div className="table-header dues-cols" style={{ minWidth: 620 }}>
                    <div className="th" />
                    <div className="th">Member</div>
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
                        <div key={m.id} className={`member-row dues-cols ${isSelected ? 'selected' : ''}`} style={{ opacity: m.status === 'dropped' ? 0.5 : 1 }}>
                          <div className="row-check">
                            <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(m.id)} />
                          </div>
                          <div className="member-info">
                            <div className="member-av" style={{ background: `linear-gradient(135deg, ${m.color}, ${m.color}99)` }}>
                              {initials(m.name)}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div className="member-name">{m.name}</div>
                                {m.status === 'dropped' && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 100, background: '#fde8e8', color: '#c03c3c', border: '1px solid rgba(224,92,92,0.2)' }}>DROPPED</span>}
                              </div>
                              <div className="member-email">{m.email}</div>
                            </div>
                          </div>
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
                                {duesStatus === 'outstanding' && (
                                  <button className="ab" style={{ borderColor: 'rgba(224,92,92,0.4)', color: '#c03c3c', background: '#fde8e8' }}
                                    onClick={async () => {
                                      const duesRecord = getMemberDues(m.id);
                                      if (duesRecord) {
                                        await supabase.from('dues_payments').update({ status: 'overdue' }).eq('id', duesRecord.id);
                                        setDues(prev => prev.map(d => d.id === duesRecord.id ? { ...d, status: 'overdue' } : d));
                                        showToast(`${m.name} marked overdue`);
                                      }
                                    }}
                                  >Mark Overdue</button>
                                )}
                                {duesStatus === 'overdue' && (
                                  <button className="ab" style={{ borderColor: 'rgba(201,168,76,0.4)', color: '#8b6914', background: '#fdf8ee' }}
                                    onClick={async () => {
                                      const duesRecord = getMemberDues(m.id);
                                      if (duesRecord) {
                                        await supabase.from('dues_payments').update({ status: 'outstanding' }).eq('id', duesRecord.id);
                                        setDues(prev => prev.map(d => d.id === duesRecord.id ? { ...d, status: 'outstanding' } : d));
                                        showToast(`${m.name} moved back to outstanding`);
                                      }
                                    }}
                                  >Undo Overdue</button>
                                )}
                                {/* Remind button — enabled when SendGrid is wired up */}
                              </>
                            )}
                            <button className="ab" onClick={() => { setEditDuesModal({ id: m.id, name: m.name }); setEditDuesAmount(String(getMemberDuesOwed(m.id))); }}>Edit Dues</button>
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
                          <div><div className="breakdown-val">{fmt(semesterDues.filter(d => d.status === 'outstanding').reduce((s, d) => s + (Number(d.amount_owed) - Number(d.amount_paid || 0)), 0))}</div><div className="breakdown-count">{outstandingCt} members</div></div>
                        </div>
                        <div className="breakdown-row">
                          <div className="breakdown-label"><div className="breakdown-dot" style={{ background: 'var(--red)' }} />Overdue</div>
                          <div><div className="breakdown-val" style={{ color: 'var(--red-text)' }}>{fmt(semesterDues.filter(d => d.status === 'overdue').reduce((s, d) => s + (Number(d.amount_owed) - Number(d.amount_paid || 0)), 0))}</div><div className="breakdown-count">{overdueCt} members</div></div>
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
                  <div className="stat-sub">`${SEMESTER}`</div>
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
                    <div><div className="card-title">Active Fines</div><div className="card-sub">{fines.filter(f => !f.paid).length} unpaid · `${SEMESTER}`</div></div>
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
                          {members.filter(m => m.status !== 'dropped').map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
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
              const memberFines = fines.filter(f => f.member_id === drawerMember.id);
              const totalIssued = memberFines.reduce((s, f) => s + f.amt, 0);
              const totalPaid   = memberFines.filter(f => f.paid).reduce((s, f) => s + f.amt, 0);
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
                          <span className="drawer-tag">{drawerMember.status || 'Active'}</span>
                          <span className="drawer-tag">Pledged {drawerMember.pledge_class || ''}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="drawer-close"
                        onClick={() => {
                          setEditMemberModal({ id: drawerMember.id });
                          setEditMemberForm({
                            name: drawerMember.name,
                            email: drawerMember.email || '',
                            pledge_class: drawerMember.pledge_class || '',
                          });
                        }}
                        title="Edit member"
                      >✎</button>
                      <button className="drawer-close" onClick={() => setDrawer(null)}>✕</button>
                    </div>
                  </div>
                  <div className="drawer-body">
                    <div className="drawer-section">
                      <div className="drawer-section-title">Dues — `${SEMESTER}`</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <StatusPill status={getMemberDuesStatus(drawerMember.id)} />
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#0d1b2a' }}>
                            {fmt(getMemberDuesOwed(drawerMember.id))} total
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                          {[
                            { label: 'Paid', value: fmt(getMemberPartialPaid(drawerMember.id)), color: '#1a7a52' },
                            { label: 'Remaining', value: fmt(Math.max(0, getMemberDuesOwed(drawerMember.id) - getMemberPartialPaid(drawerMember.id))), color: getMemberDuesStatus(drawerMember.id) === 'paid' ? '#8a97a8' : '#c03c3c' },
                            { label: 'Total Owed', value: fmt(getMemberDuesOwed(drawerMember.id)), color: '#0d1b2a' },
                          ].map(s => (
                            <div key={s.label} style={{ background: '#f8f9fb', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.value}</div>
                              <div style={{ fontSize: 10, color: '#8a97a8', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="drawer-section">
                      <div className="drawer-section-title" style={{ marginBottom: 12 }}>Fines — `${SEMESTER}`</div>
                      <div className="drawer-fine-stats">
                        {[['Fines', memberFines.length],['Issued', fmt(totalIssued)],['Paid', fmt(totalPaid)],['Owed', totalOwed > 0 ? fmt(totalOwed) : '—']].map(([lbl, val]) => (
                          <div key={lbl} className="drawer-fine-stat">
                            <div className="drawer-fine-stat-val" style={{ color: lbl === 'Owed' && totalOwed > 0 ? 'var(--fine-text)' : 'var(--navy)' }}>{val}</div>
                            <div className="drawer-fine-stat-lbl">{lbl}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="drawer-section" style={{ borderBottom: 'none' }}>
                      <div className="drawer-section-title">Fine History</div>
                      {memberFines.length === 0
                        ? <div style={{ padding: '16px 0', textAlign: 'center', fontSize: 12, color: 'var(--gray)' }}>No fines this semester 🎉</div>
                        : memberFines.map((f, i) => (
                          <div key={i} className="drawer-fine-row">
                            <div style={{ flex: 1 }}>
                              <div className="drawer-fine-reason">{f.reason}</div>
                              <div className="drawer-fine-date">{f.date} · `${SEMESTER}`</div>
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
                  {drawerFineForm.open && (
                    <div style={{ padding: '14px 20px', borderTop: '1px solid #eef0f4', background: '#fdf8ee' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#0d1b2a', marginBottom: 10 }}>Issue Fine for {drawerMember.name}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                        {[['Missed Chapter',25],['Dress Code',10],['Late Dues',15],['No Show',50]].map(([reason, amt]) => (
                          <span
                            key={reason}
                            onClick={() => { setDrawerFinePreset(reason); setDrawerFineForm(f => ({ ...f, reason, amount: String(amt) })); }}
                            style={{ padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: drawerFinePreset === reason ? '#0d1b2a' : '#eef0f4', color: drawerFinePreset === reason ? '#ffffff' : '#0d1b2a' }}
                          >{reason} ${amt}</span>
                        ))}
                      </div>
                      <input
                        className="modal-input"
                        placeholder="Reason"
                        value={drawerFineForm.reason}
                        onChange={e => setDrawerFineForm(f => ({ ...f, reason: e.target.value }))}
                        style={{ marginBottom: 8, width: '100%', boxSizing: 'border-box' }}
                      />
                      <input
                        className="modal-input"
                        type="number"
                        placeholder="Amount ($)"
                        value={drawerFineForm.amount}
                        onChange={e => setDrawerFineForm(f => ({ ...f, amount: e.target.value }))}
                        style={{ marginBottom: 8, width: '100%', boxSizing: 'border-box' }}
                      />
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button className="btn-outline" onClick={() => { setDrawerFineForm({ reason: '', amount: '', open: false }); setDrawerFinePreset(null); }}>Cancel</button>
                        <button className="btn" onClick={async () => {
                          if (!drawerFineForm.reason || !drawerFineForm.amount) return;
                          const { data } = await supabase.from('fines').insert({
                            chapter_id: dbUser.chapter_id,
                            member_id: drawerMember.id,
                            reason: drawerFineForm.reason,
                            amount: parseFloat(drawerFineForm.amount),
                            paid: false,
                          }).select().single();
                          if (data) {
                            setDrawerFineForm({ reason: '', amount: '', open: false });
                            setDrawerFinePreset(null);
                            showToast(`Fine issued for ${drawerMember.name}`);
                            fetchData();
                          }
                        }}>Issue Fine</button>
                      </div>
                    </div>
                  )}
                  <div className="drawer-footer">
                    <button
                      className="drawer-btn"
                      style={drawerMember.status === 'dropped'
                        ? { background: '#e8f5ee', color: '#1a7a52', border: '1px solid rgba(46,204,138,0.3)' }
                        : { background: '#fde8e8', color: '#c03c3c', border: '1px solid rgba(224,92,92,0.3)' }
                      }
                      onClick={async () => {
                        if (drawerMember.status === 'dropped') {
                          await supabase.from('members').update({ status: 'active' }).eq('id', drawerMember.id);
                          setDrawer(null);
                          showToast(`${drawerMember.name} reinstated`);
                          fetchData();
                        } else {
                          if (!confirm(`Mark ${drawerMember.name} as dropped? They will be greyed out on the roster but their payment history will be preserved.`)) return;
                          await supabase.from('members').update({ status: 'dropped' }).eq('id', drawerMember.id);
                          setDrawer(null);
                          showToast(`${drawerMember.name} marked as dropped`);
                          fetchData();
                        }
                      }}
                    >{drawerMember.status === 'dropped' ? 'Reinstate Member' : 'Mark as Dropped'}</button>
                    <button className="drawer-btn fine-btn" onClick={() => setDrawerFineForm(f => ({ ...f, open: !f.open }))}>+ Issue Fine</button>
                    <button className="drawer-btn primary">Send Reminder</button>
                  </div>
                </>
              );
            })()}
          </div>
        </>
      )}

      {/* CSV IMPORT MODAL */}
      {importModal && (
        <div className="modal-overlay" onClick={() => setImportModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 500 }}>

            {/* Step 1 — Upload */}
            {importStep === 1 && (
              <>
                <div className="modal-title">Import Members from CSV</div>
                <div className="modal-sub">Upload a CSV export from GreekBill, OmegaFi, or any spreadsheet</div>
                <label style={{
                  display: 'block', border: '2px dashed #dce3eb', borderRadius: 10,
                  padding: 28, textAlign: 'center', cursor: 'pointer', background: '#f8f9fb',
                  marginBottom: 20,
                }}>
                  <input type="file" accept=".csv" style={{ display: 'none' }} onChange={handleImportFile} />
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📂</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0d1b2a', marginBottom: 4 }}>Click to upload CSV file</div>
                  <div style={{ fontSize: 11, color: '#8a97a8' }}>Export your roster from GreekBill or OmegaFi, then upload it here</div>
                </label>
                <div className="modal-footer">
                  <button className="btn-outline" onClick={() => setImportModal(false)}>Cancel</button>
                </div>
              </>
            )}

            {/* Step 2 — Map Columns */}
            {importStep === 2 && (
              <>
                <div className="modal-title">Map Your Columns</div>
                <div className="modal-sub">{importRows.length} members found — match your columns to Drachma fields</div>
                <div className="modal-fields">
                  {[
                    { label: 'Full Name *', key: 'name', required: true },
                    { label: 'Email', key: 'email', required: false },
                    { label: 'Pledge Class', key: 'pledge', required: false },
                  ].map(field => (
                    <div className="modal-field" key={field.key}>
                      <div className="field-label">{field.label}</div>
                      <select
                        className="modal-input"
                        value={importMapping[field.key]}
                        onChange={e => setImportMapping(m => ({ ...m, [field.key]: e.target.value }))}
                      >
                        <option value="">— Skip this field —</option>
                        {importHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                {/* Preview */}
                <div style={{ marginBottom: 16 }}>
                  <div className="field-label" style={{ marginBottom: 8 }}>Preview (first 3 rows)</div>
                  <div style={{ border: '1px solid #dce3eb', borderRadius: 8, overflow: 'hidden' }}>
                    {importRows.slice(0, 3).map((row, i) => (
                      <div key={i} style={{ padding: '8px 12px', borderBottom: i < 2 ? '1px solid #f3f5f8' : 'none', fontSize: 12, color: '#0d1b2a' }}>
                        <strong>{importMapping.name ? row[importMapping.name] : '—'}</strong>
                        {importMapping.email && row[importMapping.email] && ` · ${row[importMapping.email]}`}
                        {importMapping.pledge && row[importMapping.pledge] && ` · ${row[importMapping.pledge]}`}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn-outline" onClick={() => setImportStep(1)}>Back</button>
                  <button className="btn" onClick={() => setImportStep(3)} disabled={!importMapping.name}>
                    Preview Import →
                  </button>
                </div>
              </>
            )}

            {/* Step 3 — Confirm */}
            {importStep === 3 && (
              <>
                <div className="modal-title">Ready to Import</div>
                <div className="modal-sub">{importRows.filter(r => r[importMapping.name]?.trim()).length} members will be added to your roster</div>
                <div style={{ padding: '12px 16px', background: '#fdf8ee', borderRadius: 8, border: '1px solid rgba(201,168,76,0.3)', fontSize: 12, color: '#8b6914', marginBottom: 16 }}>
                  ⚠ Duplicate members (same name) will be skipped automatically. All imported members will be assigned to your first dues tier.
                </div>
                <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #dce3eb', borderRadius: 8, marginBottom: 16 }}>
                  {importRows.filter(r => r[importMapping.name]?.trim()).map((row, i) => (
                    <div key={i} style={{ padding: '8px 12px', borderBottom: '1px solid #f3f5f8', fontSize: 12, color: '#0d1b2a', display: 'flex', gap: 8 }}>
                      <span style={{ fontWeight: 500 }}>{row[importMapping.name]}</span>
                      {importMapping.email && <span style={{ color: '#8a97a8' }}>{row[importMapping.email]}</span>}
                    </div>
                  ))}
                </div>
                <div className="modal-footer">
                  <button className="btn-outline" onClick={() => setImportStep(2)}>Back</button>
                  <button className="btn" onClick={confirmImport} disabled={importing}>
                    {importing ? 'Importing...' : `Import ${importRows.filter(r => r[importMapping.name]?.trim()).length} Members`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
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
              {duesTiers.length > 0 && (
                <div className="modal-field">
                  <div className="field-label">Dues Tier</div>
                  <select className="modal-input" value={newMember.tierId} onChange={e => setNewMember(m => ({ ...m, tierId: e.target.value }))}>
                    <option value="">Select tier (defaults to first)...</option>
                    {duesTiers.map(t => (
                      <option key={t.id} value={t.id}>{t.name} — ${t.amount}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setAddMemberModal(false)}>Cancel</button>
              <button className="btn" onClick={addMember}>Add Member</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MEMBER MODAL */}
      {editMemberModal && (
        <div className="modal-overlay" onClick={() => setEditMemberModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Edit Member</div>
            <div className="modal-sub">Update member details</div>
            <div className="modal-fields">
              <div className="modal-field">
                <div className="field-label">Full Name</div>
                <input
                  className="modal-input"
                  value={editMemberForm.name}
                  onChange={e => setEditMemberForm(f => ({ ...f, name: e.target.value }))}
                  autoFocus
                />
              </div>
              <div className="modal-field">
                <div className="field-label">Email</div>
                <input
                  className="modal-input"
                  value={editMemberForm.email}
                  onChange={e => setEditMemberForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="modal-field">
                <div className="field-label">Pledge Class</div>
                <input
                  className="modal-input"
                  value={editMemberForm.pledge_class}
                  onChange={e => setEditMemberForm(f => ({ ...f, pledge_class: e.target.value }))}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setEditMemberModal(null)}>Cancel</button>
              <button className="btn" onClick={saveEditMember}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT DUES MODAL */}
      {editDuesModal && (
        <div className="modal-overlay" onClick={() => setEditDuesModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Edit Dues Amount</div>
            <div className="modal-sub">Override dues amount for {editDuesModal.name}</div>
            <div className="field-label">Dues Amount ($)</div>
            <input
              className="modal-input"
              type="number"
              value={editDuesAmount}
              onChange={e => setEditDuesAmount(e.target.value)}
              autoFocus
            />
            <div className="modal-hint">Current amount: {fmt(getMemberDuesOwed(editDuesModal.id))}</div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setEditDuesModal(null)}>Cancel</button>
              <button className="btn" onClick={saveEditDues}>Save Changes</button>
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