'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../lib/supabase';

// ── HELPERS ───────────────────────────────────────────────────
function fmt(n)    { return '$' + Number(n).toLocaleString(); }
function fmtK(n)   { return n >= 1000 ? '$' + (n / 1000).toFixed(1) + 'k' : fmt(n); }
function pctOf(a, b) { return b > 0 ? Math.min(Math.round((a / b) * 100), 100) : 0; }

// ── INITIAL DATA ──────────────────────────────────────────────
// Categories now loaded from Supabase

const COLORS = ['#4a90d9','#c9a84c','#2ecc8a','#a78bfa','#e05c5c','#f5a623','#8a97a8'];
const SEMESTER = 'Spring 2026';
const SEMESTER_PCT = 58;

// ── PROGRESS BAR COMPONENT ────────────────────────────────────
function ProgressBar({ budgeted, spent, color }) {
  const pct     = pctOf(spent, budgeted);
  const isOver  = spent > budgeted;
  const isWarn  = pct >= 80 && !isOver;
  const barColor = isOver ? '#e05c5c' : isWarn ? '#f5a623' : color;
  const pctColor = isOver ? '#c03c3c' : isWarn ? '#8b5e0a' : '#8a97a8';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px' }}>
      <div style={{ flex: 1, height: 8, background: '#eef0f4', borderRadius: 100, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: barColor, borderRadius: 100, transition: 'width 0.3s ease' }} />
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: pctColor, minWidth: 32, textAlign: 'right' }}>{pct}%</div>
    </div>
  );
}

// ── DONUT CHART COMPONENT ─────────────────────────────────────
function DonutChart({ categories }) {
  const data      = categories.filter(c => c.spent > 0);
  const total     = data.reduce((s, c) => s + c.spent, 0);
  const circ      = 2 * Math.PI * 46;
  let offset      = 0;
  const segments  = data.map(c => {
    const pct  = c.spent / total;
    const dash = pct * circ;
    const seg  = { ...c, dash, offset, pct };
    offset += dash;
    return seg;
  });

  return (
    <div>
      <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 14px' }}>
        <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
          {total === 0
            ? <circle cx="60" cy="60" r="46" fill="none" stroke="#eef0f4" strokeWidth="16" />
            : segments.map(seg => (
                <circle key={seg.id} cx="60" cy="60" r="46" fill="none"
                  stroke={seg.color} strokeWidth="16"
                  strokeDasharray={`${seg.dash.toFixed(1)} ${(circ - seg.dash).toFixed(1)}`}
                  strokeDashoffset={(-seg.offset).toFixed(1)}
                />
              ))
          }
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontFamily: 'var(--font-sora)', fontSize: 18, fontWeight: 300, color: 'var(--navy)' }}>{fmtK(total)}</div>
          <div style={{ fontSize: 9, color: 'var(--gray)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Spent</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {segments.map(seg => (
          <div key={seg.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: seg.color, flexShrink: 0 }} />
            <div style={{ fontSize: 11, color: 'var(--gray)', flex: 1 }}>{seg.name.length > 14 ? seg.name.slice(0, 14) + '…' : seg.name}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--navy)' }}>{Math.round(seg.pct * 100)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────
export default function BudgetPage() {
  const { dbUser } = useAuth();
  const [categories, setCategories]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [expandedId, setExpandedId]     = useState(null);   // category id with open sub-budget
  const [selectedId, setSelectedId]     = useState(null);   // category id shown in banner
  const [editModal, setEditModal]       = useState(null);   // { type:'category'|'line', catId, item } or null
  const [addSheet, setAddSheet]         = useState(false);  // bottom sheet open
  const [newCat, setNewCat]             = useState({ name: '', amount: '' });
  const [addLineId, setAddLineId]       = useState(null);   // catId with open add-line form
  const [newLine, setNewLine]           = useState({ name: '', amount: '' });
  const [toast, setToast]               = useState(null);
  const [editName, setEditName]         = useState('');
  const [editAmt, setEditAmt]           = useState('');
  const [editIsFixed, setEditIsFixed]   = useState(false);
  const [view, setView]                 = useState('budget'); // 'budget' | 'collections'

  // ── COLLECTIONS STATE ──────────────────────────────────────
  const [duesTiers, setDuesTiers] = useState([
    { id: 'tier-1', name: 'In-House',     amount: 450, members: 12 },
    { id: 'tier-2', name: 'Out-of-House', amount: 300, members: 28 },
    { id: 'tier-3', name: 'Senior Reduced', amount: 200, members: 6 },
  ]);
  const [otherIncome, setOtherIncome] = useState([
    { id: 'oi-1', name: 'Alumni Donation', amount: 1500 },
    { id: 'oi-2', name: 'Fundraiser',      amount: 800  },
  ]);
  const [collectionRate, setCollectionRate] = useState(85);
  const [newTier, setNewTier] = useState({ name: '', amount: '', members: '' });
  const [showAddTier, setShowAddTier] = useState(false);
  const [newOther, setNewOther] = useState({ name: '', amount: '' });
  const [showAddOther, setShowAddOther] = useState(false);
  const [editingTierId, setEditingTierId] = useState(null);
  const [editingTierField, setEditingTierField] = useState(null);
  const [editingTierValue, setEditingTierValue] = useState('');
  const [editingOtherId, setEditingOtherId] = useState(null);
  const [editingOtherField, setEditingOtherField] = useState(null);
  const [editingOtherValue, setEditingOtherValue] = useState('');

  // ── TOAST ──────────────────────────────────────────────────
  const toastTimerRef = useRef(null);
  const countdownRef = useRef(null);
  const [toastUndo, setToastUndo] = useState(null);
  const [toastCountdown, setToastCountdown] = useState(8);

  function showToast(msg, undoFn = null) {
    clearTimeout(toastTimerRef.current);
    clearInterval(countdownRef.current);
    setToast(msg);
    setToastUndo(() => undoFn);
    setToastCountdown(8);
    if (undoFn) {
      let secs = 8;
      countdownRef.current = setInterval(() => {
        secs--;
        setToastCountdown(secs);
        if (secs <= 0) clearInterval(countdownRef.current);
      }, 1000);
      toastTimerRef.current = setTimeout(() => { setToast(null); setToastUndo(null); }, 8000);
    } else {
      toastTimerRef.current = setTimeout(() => { setToast(null); setToastUndo(null); }, 3000);
    }
  }

  // ── FETCH DATA ─────────────────────────────────────────────
  useEffect(() => {
    if (!dbUser?.chapter_id) return;
    fetchData();
  }, [dbUser]);

  async function fetchData() {
    setLoading(true);

    const [catRes, lineRes, txRes, collRes] = await Promise.all([
      supabase
        .from('budget_categories')
        .select('*')
        .eq('chapter_id', dbUser.chapter_id)
        .order('name'),
      supabase
        .from('budget_line_items')
        .select('*')
        .eq('chapter_id', dbUser.chapter_id),
      supabase
        .from('transactions')
        .select('category_id, amount, type')
        .eq('chapter_id', dbUser.chapter_id)
        .eq('type', 'expense'),
      supabase
        .from('collections_config')
        .select('*')
        .eq('chapter_id', dbUser.chapter_id)
        .single(),
    ]);

    // Calculate spent amounts from transactions
    const spentMap = {};
    if (txRes.data) {
      txRes.data.forEach(tx => {
        if (tx.category_id) {
          spentMap[tx.category_id] = (spentMap[tx.category_id] || 0) + Number(tx.amount);
        }
      });
    }

    // Build categories with line items and spent amounts
    if (catRes.data) {
      const mapped = catRes.data.map(cat => ({
        id: cat.id,
        name: cat.name,
        budgeted: Number(cat.budgeted_amount),
        spent: spentMap[cat.id] || 0,
        color: cat.color || '#8a97a8',
        is_fixed: cat.is_fixed || false,
        lineItems: (lineRes.data || [])
          .filter(li => li.category_id === cat.id)
          .map(li => ({
            id: li.id,
            name: li.name,
            budgeted: Number(li.budgeted_amount),
            spent: 0,
          })),
      }));
      setCategories(mapped);
    }

    // Load collections config if exists
    if (collRes.data) {
      setCollectionRate(collRes.data.collection_rate || 85);
      if (collRes.data.other_income) {
        setOtherIncome(collRes.data.other_income);
      }
    }

    setLoading(false);
  }

  // ── COMPUTED TOTALS ────────────────────────────────────────
  const totalBudgeted  = categories.reduce((s, c) => s + c.budgeted, 0);
  const totalSpent     = categories.reduce((s, c) => s + c.spent, 0);
  const totalRemaining = totalBudgeted - totalSpent;
  const overCount      = categories.filter(c => c.spent > c.budgeted).length;
  const budgetUsedPct  = pctOf(totalSpent, totalBudgeted);

  // ── COLLECTIONS COMPUTED ───────────────────────────────────
  const totalDues = duesTiers.reduce((s, t) => s + (t.amount * t.members), 0);
  const totalOther = otherIncome.reduce((s, o) => s + o.amount, 0);
  const totalExpectedCollections = totalDues + totalOther;
  const projectedCollections = Math.round(totalExpectedCollections * (collectionRate / 100));
  const fixedCosts = categories
    .filter(c => c.is_fixed)
    .reduce((s, c) => s + c.budgeted, 0);
  const surplus = projectedCollections - totalBudgeted;
  const coversFixed = projectedCollections >= fixedCosts;
  const trafficLight = surplus >= 0 ? 'green' : surplus >= -totalBudgeted * 0.1 ? 'yellow' : 'red';

  // ── SELECTED CATEGORY ──────────────────────────────────────
  const selectedCat = categories.find(c => c.id === selectedId) || null;

  // ── SELECT / DESELECT ──────────────────────────────────────
  function handleSelectCat(id) {
    if (selectedId === id) {
      setSelectedId(null);
    } else {
      setSelectedId(id);
    }
  }

  // ── TOGGLE SUB-BUDGET ──────────────────────────────────────
  function handleToggleSub(id) {
    if (expandedId === id) {
      // Already open — if banner hidden show it, if banner visible close sub
      if (selectedId === id) {
        setExpandedId(null);
      } else {
        setSelectedId(id);
      }
    } else {
      setExpandedId(id);
      setSelectedId(id);
    }
  }

  // ── ADD CATEGORY ───────────────────────────────────────────
  async function saveCategory() {
    const name = newCat.name.trim();
    const amt  = parseFloat(newCat.amount);
    if (!name || !amt) return;
    const color = COLORS[categories.length % COLORS.length];

    const { data, error } = await supabase
      .from('budget_categories')
      .insert({
        chapter_id: dbUser.chapter_id,
        name,
        budgeted_amount: amt,
        color,
        is_fixed: false,
      })
      .select()
      .single();

    if (data) {
      setCategories(cs => [...cs, {
        id: data.id,
        name: data.name,
        budgeted: Number(data.budgeted_amount),
        spent: 0,
        color: data.color,
        is_fixed: data.is_fixed,
        lineItems: [],
      }]);
      setNewCat({ name: '', amount: '' });
      setAddSheet(false);
      showToast(`"${name}" added — ${fmt(amt)} budgeted`);
    }
  }

  // ── ADD LINE ITEM ──────────────────────────────────────────
  async function saveLineItem(catId) {
    const name = newLine.name.trim();
    const amt  = parseFloat(newLine.amount);
    if (!name || !amt) return;

    const { data, error } = await supabase
      .from('budget_line_items')
      .insert({
        chapter_id: dbUser.chapter_id,
        category_id: catId,
        name,
        budgeted_amount: amt,
      })
      .select()
      .single();

    if (data) {
      setCategories(cs => cs.map(c => c.id !== catId ? c : {
        ...c,
        lineItems: [...c.lineItems, { id: data.id, name: data.name, budgeted: Number(data.budgeted_amount), spent: 0 }],
      }));
      setNewLine({ name: '', amount: '' });
      setAddLineId(null);
      showToast(`${name} added`);
    }
  }

  // ── OPEN EDIT MODAL ────────────────────────────────────────
  function openEditCategory(cat) {
    setEditModal({ type: 'category', catId: cat.id, item: cat });
    setEditName(cat.name);
    setEditAmt(String(cat.budgeted));
    setEditIsFixed(cat.is_fixed || false);
  }

  function openEditLine(catId, li) {
    setEditModal({ type: 'line', catId, item: li });
    setEditName(li.name);
    setEditAmt(String(li.budgeted));
  }

  // ── SAVE EDIT ──────────────────────────────────────────────
  async function saveEdit() {
    const name = editName.trim();
    const amt  = parseFloat(editAmt);
    if (!name || isNaN(amt)) { setEditModal(null); return; }

    if (editModal.type === 'category') {
      const { error } = await supabase
        .from('budget_categories')
        .update({ name, budgeted_amount: amt, is_fixed: editIsFixed })
        .eq('id', editModal.catId);

      if (!error) {
        setCategories(cs => cs.map(c => c.id !== editModal.catId ? c : { ...c, name, budgeted: amt, is_fixed: editIsFixed }));
        if (selectedId === editModal.catId) setSelectedId(editModal.catId);
      }
    } else {
      const { error } = await supabase
        .from('budget_line_items')
        .update({ name, budgeted_amount: amt })
        .eq('id', editModal.item.id);

      if (!error) {
        setCategories(cs => cs.map(c => c.id !== editModal.catId ? c : {
          ...c,
          lineItems: c.lineItems.map(li => li.id !== editModal.item.id ? li : { ...li, name, budgeted: amt }),
        }));
      }
    }
    setEditModal(null);
    showToast('Changes saved');
  }

  // ── DELETE ─────────────────────────────────────────────────
  async function deleteTarget() {
    if (editModal.type === 'category') {
      const { error } = await supabase
        .from('budget_categories')
        .delete()
        .eq('id', editModal.catId);

      if (!error) {
        if (selectedId === editModal.catId) setSelectedId(null);
        if (expandedId === editModal.catId) setExpandedId(null);
        setCategories(cs => cs.filter(c => c.id !== editModal.catId));
        showToast('Category deleted');
      }
    } else {
      const { error } = await supabase
        .from('budget_line_items')
        .delete()
        .eq('id', editModal.item.id);

      if (!error) {
        setCategories(cs => cs.map(c => c.id !== editModal.catId ? c : {
          ...c,
          lineItems: c.lineItems.filter(li => li.id !== editModal.item.id),
        }));
        showToast('Line item deleted');
      }
    }
    setEditModal(null);
  }

  // ── STYLES ─────────────────────────────────────────────────
  const S = {
    wrap:        { display: 'flex', height: '100vh', background: '#f0f3f7', fontFamily: 'var(--font-dm-sans), sans-serif' },
    sidebar:     { width: 240, background: '#0d1b2a', display: 'flex', flexDirection: 'column', flexShrink: 0 },
    logo:        { fontFamily: 'var(--font-cormorant)', fontSize: 22, fontWeight: 400, color: '#c9a84c', padding: '0 20px 20px', letterSpacing: '0.02em' },
    logoM:       { color: '#ffffff' },
    chapterBox:  { padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 0 },
    chapterName: { fontSize: 11, fontWeight: 600, color: '#ffffff', letterSpacing: '0.04em' },
    chapterSub:  { fontSize: 10, color: '#8a97a8', marginTop: 2 },
    navSection:  { padding: '0 0', flex: 1 },
    navLabel:    { fontSize: 9, fontWeight: 600, color: '#8a97a8', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '16px 24px 6px' },
    navItem:     { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 24px', fontSize: 13, color: '#8a97a8', cursor: 'pointer', textDecoration: 'none' },
    navActive:   { background: 'rgba(201,168,76,0.15)', color: '#c9a84c', fontWeight: 600, borderLeft: '3px solid #c9a84c', paddingLeft: 21 },
    navDot:      { width: 6, height: 6, borderRadius: '50%', background: '#c9a84c' },
    sideBottom:  { marginTop: 'auto', padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' },
    userRow:     { display: 'flex', alignItems: 'center', gap: 10 },
    userAv:      { width: 28, height: 28, borderRadius: '50%', background: '#c9a84c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#0d1b2a', flexShrink: 0 },
    userName:    { fontSize: 11, fontWeight: 600, color: '#ffffff' },
    userRole:    { fontSize: 10, color: '#8a97a8' },
    main:        { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    topbar:      { background: '#ffffff', borderBottom: '1px solid #dce3eb', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 },
    topTitle:    { fontSize: 16, fontWeight: 700, color: '#0d1b2a' },
    topSub:      { fontSize: 11, color: '#8a97a8', marginTop: 1 },
    topRight:    { display: 'flex', gap: 8 },
    btnOutline:  { padding: '7px 14px', borderRadius: 8, border: '1px solid #dce3eb', background: '#ffffff', fontSize: 12, fontWeight: 500, color: '#0d1b2a', cursor: 'pointer' },
    btn:         { padding: '7px 14px', borderRadius: 8, border: 'none', background: '#0d1b2a', fontSize: 12, fontWeight: 600, color: '#ffffff', cursor: 'pointer' },
    content:     { flex: 1, overflowY: 'auto', padding: 20 },
    statsRow:    { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 },
    statCard:    { background: '#ffffff', borderRadius: 10, padding: '14px 18px', borderTop: '3px solid #dce3eb' },
    statLabel:   { fontSize: 10, fontWeight: 600, color: '#8a97a8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 },
    statVal:     { fontFamily: 'var(--font-sora)', fontSize: 28, fontWeight: 300, color: '#0d1b2a', lineHeight: 1.1 },
    statSub:     { fontSize: 11, color: '#8a97a8', marginTop: 3 },
    // Banner
    banner:      { background: '#0d1b2a', borderRadius: 10, padding: '14px 24px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 0 },
    bannerName:  { fontSize: 11, fontWeight: 600, color: '#8a97a8', textTransform: 'uppercase', letterSpacing: '0.08em' },
    bannerCat:   { fontSize: 16, fontWeight: 700, color: '#ffffff', marginTop: 2 },
    bannerStat:  { flex: 1, textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.1)', padding: '0 20px' },
    bannerAmt:   { fontFamily: 'var(--font-sora)', fontSize: 26, fontWeight: 300, color: '#ffffff' },
    bannerLbl:   { fontSize: 10, fontWeight: 600, color: '#8a97a8', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 },
    bannerClose: { background: 'rgba(255,255,255,0.1)', border: 'none', color: '#ffffff', fontSize: 11, padding: '5px 10px', borderRadius: 6, cursor: 'pointer', flexShrink: 0 },
    // Main grid
    grid:        { display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, alignItems: 'start' },
    tableCard:   { background: '#ffffff', borderRadius: 10, overflow: 'hidden' },
    tableHeader: { padding: '14px 20px 8px', borderBottom: '1px solid #eef1f5' },
    tableTitle:  { fontSize: 14, fontWeight: 700, color: '#0d1b2a' },
    tableHint:   { fontSize: 11, color: '#8a97a8', marginTop: 2 },
    colHeader:   { display: 'grid', gridTemplateColumns: '180px 1fr 110px 110px 80px', padding: '7px 20px', background: '#f8f9fb' },
    colTh:       { fontSize: 9, fontWeight: 600, color: '#8a97a8', textTransform: 'uppercase', letterSpacing: '0.08em' },
    colThRight:  { fontSize: 9, fontWeight: 600, color: '#8a97a8', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'right' },
    // Category row
    catRow:      { borderBottom: '1px solid #eef1f5' },
    catRowMain:  { display: 'grid', gridTemplateColumns: '180px 1fr 110px 110px 80px', padding: '12px 20px', alignItems: 'center', cursor: 'pointer', transition: 'background 0.12s' },
    catRowSel:   { background: '#f0f7ff' },
    catNameWrap: { display: 'flex', alignItems: 'center', gap: 8 },
    catDot:      { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
    catName:     { fontSize: 13, fontWeight: 500, color: '#0d1b2a' },
    catCell:     { fontSize: 13, fontWeight: 600, color: '#0d1b2a', textAlign: 'right', paddingRight: 8 },
    catCellRed:  { fontSize: 13, fontWeight: 600, color: '#c03c3c', textAlign: 'right', paddingRight: 8 },
    rowActions:  { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
    iconBtn:     { width: 26, height: 26, borderRadius: 6, border: '1px solid #dce3eb', background: 'none', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8a97a8' },
    // Sub-budget
    subArea:     { background: '#dce6f0', borderTop: '1px solid #dce3eb' },
    subHeader:   { display: 'grid', gridTemplateColumns: '180px 1fr 110px 110px 80px', padding: '7px 20px 7px 48px', background: '#c8d6e8', borderBottom: '1px dashed #b5c9d8' },
    subTh:       { fontSize: 9, fontWeight: 600, color: '#8a97a8', textTransform: 'uppercase', letterSpacing: '0.08em' },
    subThRight:  { fontSize: 9, fontWeight: 600, color: '#8a97a8', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'right' },
    subRow:      { display: 'grid', gridTemplateColumns: '180px 1fr 110px 110px 80px', padding: '9px 20px 9px 48px', alignItems: 'center', borderBottom: '1px solid #d0dce8' },
    subName:     { fontSize: 12, color: '#0d1b2a' },
    subCell:     { fontSize: 12, fontWeight: 600, color: '#0d1b2a', textAlign: 'right', paddingRight: 8 },
    subCellRed:  { fontSize: 12, fontWeight: 600, color: '#c03c3c', textAlign: 'right', paddingRight: 8 },
    subFooter:   { display: 'grid', gridTemplateColumns: '180px 1fr 110px 110px 80px', padding: '8px 20px 8px 48px', background: '#bfcfe3', borderTop: '1px solid #dce3eb' },
    subFootLbl:  { fontSize: 11, fontWeight: 600, color: '#0d1b2a' },
    subFootVal:  { fontSize: 11, fontWeight: 600, textAlign: 'right', paddingRight: 8 },
    subUnalloc:  { display: 'grid', gridTemplateColumns: '180px 1fr 110px 110px 80px', padding: '6px 20px 6px 48px', background: '#bfcfe3', borderTop: '1px dashed #a8bdd4' },
    subUnLbl:    { fontSize: 10, fontWeight: 500, color: '#8a97a8', fontStyle: 'italic' },
    subUnVal:    { fontSize: 10, fontWeight: 600, textAlign: 'right', paddingRight: 8 },
    subAddRow:   { padding: '7px 20px 9px 48px', background: '#dce6f0', display: 'flex', justifyContent: 'flex-end' },
    subAddBtn:   { padding: '6px 14px', borderRadius: 6, border: 'none', background: '#0d1b2a', color: '#ffffff', fontSize: 11, fontWeight: 600, cursor: 'pointer' },
    addLineForm: { display: 'grid', gridTemplateColumns: '1fr 120px 80px', gap: 6, padding: '8px 20px 8px 48px', background: '#fdf8ee', borderBottom: '1px solid rgba(201,168,76,0.2)' },
    addLineInput:{ padding: '6px 10px', borderRadius: 6, border: '1px solid #dce3eb', fontSize: 12, background: '#ffffff', outline: 'none', color: '#0d1b2a' },
    addLineSave: { padding: '6px 10px', borderRadius: 6, border: 'none', background: '#0d1b2a', color: '#ffffff', fontSize: 11, fontWeight: 600, cursor: 'pointer' },
    addLineCanc: { padding: '6px 10px', borderRadius: 6, border: '1px solid #dce3eb', background: '#ffffff', fontSize: 11, cursor: 'pointer' },
    footer:      { padding: '12px 20px', borderTop: '1px solid #eef1f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    footerTxt:   { fontSize: 12, color: '#8a97a8' },
    footerBtn:   { fontSize: 12, color: '#c9a84c', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' },
    // Right column
    rightCol:    { display: 'flex', flexDirection: 'column', gap: 12 },
    card:        { background: '#ffffff', borderRadius: 10, padding: '14px 18px' },
    cardTitle:   { fontSize: 12, fontWeight: 700, color: '#0d1b2a', marginBottom: 12 },
    // Modal
    overlay:     { position: 'fixed', inset: 0, background: 'rgba(13,27,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
    modal:       { background: '#ffffff', borderRadius: 12, padding: 24, width: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
    modalTitle:  { fontSize: 16, fontWeight: 700, color: '#0d1b2a', marginBottom: 4 },
    modalSub:    { fontSize: 12, color: '#8a97a8', marginBottom: 16 },
    modalField:  { marginBottom: 12 },
    modalLabel:  { fontSize: 11, fontWeight: 600, color: '#0d1b2a', marginBottom: 4 },
    modalInput:  { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #dce3eb', fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#0d1b2a', background: '#ffffff' },
    modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20, alignItems: 'center' },
    modalDelete: { marginRight: 'auto', background: 'none', border: 'none', color: '#c03c3c', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
    // Bottom sheet
    sheetOverlay:{ position: 'fixed', inset: 0, background: 'rgba(13,27,42,0.4)', zIndex: 100 },
    sheet:       { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#ffffff', borderRadius: '16px 16px 0 0', padding: 24, zIndex: 101, boxShadow: '0 -8px 40px rgba(0,0,0,0.15)' },
    sheetTitle:  { fontSize: 16, fontWeight: 700, color: '#0d1b2a', marginBottom: 4 },
    sheetSub:    { fontSize: 12, color: '#8a97a8', marginBottom: 20 },
    sheetFields: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 },
    sheetField:  { display: 'flex', flexDirection: 'column', gap: 4 },
    sheetLabel:  { fontSize: 11, fontWeight: 600, color: '#0d1b2a' },
    sheetInput:  { padding: '8px 12px', borderRadius: 8, border: '1px solid #dce3eb', fontSize: 13, outline: 'none', color: '#0d1b2a', background: '#ffffff' },
    sheetFooter: { display: 'flex', justifyContent: 'flex-end', gap: 8 },
    // Toast
    toast:       { position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#0d1b2a', color: '#ffffff', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500, zIndex: 200, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' },
    toastX:      { background: 'none', border: 'none', color: '#8a97a8', cursor: 'pointer', fontSize: 14, padding: 0 },
  };

  // ── RENDER ─────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f0f3f7', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 32, color: '#0d1b2a', marginBottom: 12 }}>Drach<span style={{ color: '#c9a84c' }}>m</span>a</div>
        <div style={{ fontSize: 13, color: '#8a97a8' }}>Loading budget...</div>
      </div>
    </div>
  );

  return (
    <ProtectedRoute>
    <div style={S.wrap}>

      {/* SIDEBAR */}
      <Sidebar activePage="budget" />

      {/* MAIN */}
      <main style={S.main}>

        {/* TOPBAR */}
        <div style={S.topbar}>
          <div>
            <div style={S.topTitle}>Chapter Budget</div>
            <div style={S.topSub}>{SEMESTER} · {fmt(totalBudgeted)} total budget</div>
          </div>
          <div style={S.topRight}>
            {/* VIEW TOGGLE */}
            <div style={{ display: 'flex', background: '#f0f3f7', borderRadius: 8, padding: 3, gap: 2 }}>
              {[['budget', '📊 Budget'], ['collections', '💰 Collections']].map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  style={{
                    padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
                    background: view === v ? '#0d1b2a' : 'transparent',
                    color: view === v ? '#ffffff' : '#8a97a8',
                    transition: 'all 0.15s',
                  }}
                >{label}</button>
              ))}
            </div>
            {view === 'budget' && (
              <>
                <button style={S.btnOutline}>Export PDF</button>
                <button style={S.btn} onClick={() => setAddSheet(true)}>+ Add Category</button>
              </>
            )}
          </div>
        </div>

        {/* CONTENT */}
        <div style={S.content}>
          {view === 'collections' ? (
            <div>
              {/* COLLECTIONS STAT CARDS */}
              <div style={S.statsRow}>
                <div style={{ ...S.statCard, borderTopColor: '#2ecc8a' }}>
                  <div style={S.statLabel}>Expected Dues</div>
                  <div style={S.statVal}>{fmt(totalDues)}</div>
                  <div style={S.statSub}>From {duesTiers.reduce((s, t) => s + t.members, 0)} members</div>
                </div>
                <div style={{ ...S.statCard, borderTopColor: '#4a90d9' }}>
                  <div style={S.statLabel}>Other Income</div>
                  <div style={S.statVal}>{fmt(totalOther)}</div>
                  <div style={S.statSub}>{otherIncome.length} sources</div>
                </div>
                <div style={{ ...S.statCard, borderTopColor: '#c9a84c' }}>
                  <div style={S.statLabel}>Total Expected</div>
                  <div style={S.statVal}>{fmt(totalExpectedCollections)}</div>
                  <div style={S.statSub}>At 100% collection</div>
                </div>
                <div style={{ ...S.statCard, borderTopColor: trafficLight === 'green' ? '#2ecc8a' : trafficLight === 'yellow' ? '#f5a623' : '#e05c5c' }}>
                  <div style={S.statLabel}>Projected ({collectionRate}%)</div>
                  <div style={{ ...S.statVal, color: trafficLight === 'green' ? '#1a7a52' : trafficLight === 'yellow' ? '#8b5e0a' : '#c03c3c' }}>{fmt(projectedCollections)}</div>
                  <div style={S.statSub}>{surplus >= 0 ? `+${fmt(surplus)} surplus` : `${fmt(Math.abs(surplus))} shortfall`}</div>
                </div>
              </div>

              {/* TRAFFIC LIGHT BANNER */}
              <div style={{
                padding: '14px 20px', borderRadius: 10, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14,
                background: trafficLight === 'green' ? '#e8f5ee' : trafficLight === 'yellow' ? '#fff8ee' : '#fde8e8',
                border: `1px solid ${trafficLight === 'green' ? 'rgba(46,204,138,0.3)' : trafficLight === 'yellow' ? 'rgba(245,166,35,0.3)' : 'rgba(224,92,92,0.3)'}`,
              }}>
                <div style={{ fontSize: 24 }}>{trafficLight === 'green' ? '🟢' : trafficLight === 'yellow' ? '🟡' : '🔴'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0d1b2a', marginBottom: 2 }}>
                    {trafficLight === 'green' ? 'Budget is fully covered' : trafficLight === 'yellow' ? 'Budget is nearly covered' : 'Budget is at risk'}
                  </div>
                  <div style={{ fontSize: 12, color: '#8a97a8' }}>
                    {trafficLight === 'green'
                      ? `At ${collectionRate}% collection you have a ${fmt(surplus)} surplus over your total budget.`
                      : trafficLight === 'yellow'
                      ? `At ${collectionRate}% collection you're ${fmt(Math.abs(surplus))} short of your total budget but fixed costs are covered.`
                      : `At ${collectionRate}% collection you're ${fmt(Math.abs(surplus))} short. ${coversFixed ? 'Fixed costs are covered.' : 'Fixed costs may not be covered — consider reducing discretionary spending.'}`
                    }
                  </div>
                </div>
                {!coversFixed && (
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#c03c3c', background: '#fde8e8', padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(224,92,92,0.3)', flexShrink: 0 }}>
                    ⚠ Fixed costs at risk
                  </div>
                )}
              </div>

              {/* COLLECTION RATE SLIDER */}
              <div style={{ background: '#ffffff', borderRadius: 10, padding: '16px 20px', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0d1b2a' }}>Collection Rate Forecast</div>
                  <div style={{ fontSize: 20, fontWeight: 300, color: '#0d1b2a', fontFamily: 'var(--font-sora)' }}>{collectionRate}%</div>
                </div>
                <input
                  type="range" min="50" max="100" value={collectionRate}
                  onChange={e => setCollectionRate(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#0d1b2a', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#8a97a8', marginTop: 4 }}>
                  <span>50% (pessimistic)</span>
                  <span>75% (conservative)</span>
                  <span>100% (optimistic)</span>
                </div>
              </div>

              {/* TWO COLUMN LAYOUT */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                {/* DUES TIERS */}
                <div style={{ background: '#ffffff', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid #eef1f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0d1b2a' }}>Dues Tiers</div>
                      <div style={{ fontSize: 11, color: '#8a97a8', marginTop: 1 }}>Customize tiers for your chapter</div>
                    </div>
                    <button onClick={() => setShowAddTier(true)} style={S.btn}>+ Add Tier</button>
                  </div>

                  {/* TIER COLUMN HEADERS */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px 80px 40px', gap: 8, padding: '6px 20px', background: '#f8f9fb', borderBottom: '1px solid #eef0f4' }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#8a97a8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tier Name</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#8a97a8', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>Dues ($)</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#8a97a8', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>Members</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#8a97a8', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>Total</div>
                    <div />
                  </div>

                  {/* TIER ROWS */}
                  {duesTiers.map(tier => {
                    function TierCell({ field, value, type = 'text', align = 'left' }) {
                      const isEditing = editingTierId === tier.id && editingTierField === field;
                      return isEditing ? (
                        <input
                          autoFocus
                          type={type}
                          value={editingTierValue}
                          onChange={e => setEditingTierValue(e.target.value)}
                          onBlur={() => {
                            setDuesTiers(prev => prev.map(t => t.id !== tier.id ? t : {
                              ...t,
                              [field]: type === 'number' ? parseFloat(editingTierValue) || t[field] : editingTierValue,
                            }));
                            setEditingTierId(null);
                            setEditingTierField(null);
                          }}
                          onKeyDown={e => e.key === 'Enter' && e.target.blur()}
                          style={{ fontSize: 12, fontWeight: 500, color: '#0d1b2a', border: '1px solid #c9a84c', borderRadius: 6, padding: '4px 8px', outline: 'none', width: '100%', textAlign: align, fontFamily: 'inherit', background: '#fdf8ee' }}
                        />
                      ) : (
                        <div
                          onClick={() => { setEditingTierId(tier.id); setEditingTierField(field); setEditingTierValue(String(value)); }}
                          style={{ fontSize: 12, fontWeight: 500, color: '#0d1b2a', cursor: 'pointer', padding: '4px 8px', borderRadius: 6, textAlign: align, borderBottom: '1px dashed transparent' }}
                          onMouseEnter={e => e.currentTarget.style.borderBottomColor = '#8a97a8'}
                          onMouseLeave={e => e.currentTarget.style.borderBottomColor = 'transparent'}
                          title="Click to edit"
                        >{value}</div>
                      );
                    }
                    return (
                      <div key={tier.id} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px 80px 40px', gap: 8, padding: '10px 20px', borderBottom: '1px solid #f3f5f8', alignItems: 'center' }}>
                        <TierCell field="name" value={tier.name} />
                        <TierCell field="amount" value={tier.amount} type="number" align="center" />
                        <TierCell field="members" value={tier.members} type="number" align="center" />
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1a7a52', textAlign: 'right' }}>{fmt(tier.amount * tier.members)}</div>
                        <button
                          onClick={() => {
                            const deleted = tier;
                            setDuesTiers(prev => prev.filter(t => t.id !== tier.id));
                            showToast(`"${deleted.name}" tier deleted — Undo`, () => {
                              setDuesTiers(prev => [...prev, deleted]);
                            });
                          }}
                          style={{ background: 'none', border: 'none', color: '#e05c5c', cursor: 'pointer', fontSize: 14, padding: 0 }}
                        >✕</button>
                      </div>
                    );
                  })}

                  {/* ADD TIER FORM */}
                  {showAddTier && (
                    <div style={{ padding: '12px 20px', background: '#fdf8ee', borderBottom: '1px solid rgba(201,168,76,0.2)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px', gap: 8, marginBottom: 8 }}>
                        <input
                          style={{ padding: '7px 10px', borderRadius: 7, border: '1px solid #dce3eb', fontSize: 12, outline: 'none', color: '#0d1b2a', background: '#ffffff' }}
                          placeholder="Tier name (e.g. In-House)"
                          value={newTier.name}
                          onChange={e => setNewTier(t => ({ ...t, name: e.target.value }))}
                          autoFocus
                        />
                        <input
                          style={{ padding: '7px 10px', borderRadius: 7, border: '1px solid #dce3eb', fontSize: 12, outline: 'none', color: '#0d1b2a', background: '#ffffff' }}
                          placeholder="Dues ($)"
                          type="number"
                          value={newTier.amount}
                          onChange={e => setNewTier(t => ({ ...t, amount: e.target.value }))}
                        />
                        <input
                          style={{ padding: '7px 10px', borderRadius: 7, border: '1px solid #dce3eb', fontSize: 12, outline: 'none', color: '#0d1b2a', background: '#ffffff' }}
                          placeholder="Members"
                          type="number"
                          value={newTier.members}
                          onChange={e => setNewTier(t => ({ ...t, members: e.target.value }))}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button style={S.btnOutline} onClick={() => { setShowAddTier(false); setNewTier({ name: '', amount: '', members: '' }); }}>Cancel</button>
                        <button style={S.btn} onClick={() => {
                          if (!newTier.name.trim() || !newTier.amount || !newTier.members) return;
                          setDuesTiers(prev => [...prev, { id: 'tier-' + Date.now(), name: newTier.name.trim(), amount: parseFloat(newTier.amount), members: parseInt(newTier.members) }]);
                          setNewTier({ name: '', amount: '', members: '' });
                          setShowAddTier(false);
                          showToast('Tier added');
                        }}>Add Tier</button>
                      </div>
                    </div>
                  )}

                  {/* DUES TOTAL */}
                  <div style={{ padding: '10px 20px', background: '#f8f9fb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#0d1b2a' }}>Total Expected Dues</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1a7a52' }}>{fmt(totalDues)}</div>
                  </div>
                </div>

                {/* OTHER INCOME */}
                <div style={{ background: '#ffffff', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid #eef1f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0d1b2a' }}>Other Income</div>
                      <div style={{ fontSize: 11, color: '#8a97a8', marginTop: 1 }}>Alumni donations, fundraisers, etc.</div>
                    </div>
                    <button onClick={() => setShowAddOther(true)} style={S.btn}>+ Add</button>
                  </div>

                  {/* OTHER INCOME COLUMN HEADERS */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 40px', gap: 8, padding: '6px 20px', background: '#f8f9fb', borderBottom: '1px solid #eef0f4' }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#8a97a8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Source</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#8a97a8', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>Amount</div>
                    <div />
                  </div>

                  {/* OTHER INCOME ROWS */}
                  {otherIncome.map(item => {
                    function OtherCell({ field, value, type = 'text', align = 'left' }) {
                      const isEditing = editingOtherId === item.id && editingOtherField === field;
                      return isEditing ? (
                        <input
                          autoFocus
                          type={type}
                          value={editingOtherValue}
                          onChange={e => setEditingOtherValue(e.target.value)}
                          onBlur={() => {
                            setOtherIncome(prev => prev.map(o => o.id !== item.id ? o : {
                              ...o,
                              [field]: type === 'number' ? parseFloat(editingOtherValue) || o[field] : editingOtherValue,
                            }));
                            setEditingOtherId(null);
                            setEditingOtherField(null);
                          }}
                          onKeyDown={e => e.key === 'Enter' && e.target.blur()}
                          style={{ fontSize: 12, fontWeight: 500, color: '#0d1b2a', border: '1px solid #c9a84c', borderRadius: 6, padding: '4px 8px', outline: 'none', width: '100%', textAlign: align, fontFamily: 'inherit', background: '#fdf8ee' }}
                        />
                      ) : (
                        <div
                          onClick={() => { setEditingOtherId(item.id); setEditingOtherField(field); setEditingOtherValue(String(value)); }}
                          style={{ fontSize: 12, fontWeight: 500, color: '#0d1b2a', cursor: 'pointer', padding: '4px 8px', borderRadius: 6, textAlign: align, borderBottom: '1px dashed transparent' }}
                          onMouseEnter={e => e.currentTarget.style.borderBottomColor = '#8a97a8'}
                          onMouseLeave={e => e.currentTarget.style.borderBottomColor = 'transparent'}
                          title="Click to edit"
                        >{value}</div>
                      );
                    }
                    return (
                      <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 40px', gap: 8, padding: '10px 20px', borderBottom: '1px solid #f3f5f8', alignItems: 'center' }}>
                        <OtherCell field="name" value={item.name} />
                        <OtherCell field="amount" value={item.amount} type="number" align="right" />
                        <button
                          onClick={() => {
                            const deleted = item;
                            setOtherIncome(prev => prev.filter(o => o.id !== item.id));
                            showToast(`"${deleted.name}" deleted — Undo`, () => {
                              setOtherIncome(prev => [...prev, deleted]);
                            });
                          }}
                          style={{ background: 'none', border: 'none', color: '#e05c5c', cursor: 'pointer', fontSize: 14, padding: 0 }}
                        >✕</button>
                      </div>
                    );
                  })}

                  {/* ADD OTHER FORM */}
                  {showAddOther && (
                    <div style={{ padding: '12px 20px', background: '#fdf8ee', borderBottom: '1px solid rgba(201,168,76,0.2)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 8, marginBottom: 8 }}>
                        <input
                          style={{ padding: '7px 10px', borderRadius: 7, border: '1px solid #dce3eb', fontSize: 12, outline: 'none', color: '#0d1b2a', background: '#ffffff' }}
                          placeholder="Income source name"
                          value={newOther.name}
                          onChange={e => setNewOther(o => ({ ...o, name: e.target.value }))}
                          autoFocus
                        />
                        <input
                          style={{ padding: '7px 10px', borderRadius: 7, border: '1px solid #dce3eb', fontSize: 12, outline: 'none', color: '#0d1b2a', background: '#ffffff' }}
                          placeholder="Amount ($)"
                          type="number"
                          value={newOther.amount}
                          onChange={e => setNewOther(o => ({ ...o, amount: e.target.value }))}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button style={S.btnOutline} onClick={() => { setShowAddOther(false); setNewOther({ name: '', amount: '' }); }}>Cancel</button>
                        <button style={S.btn} onClick={() => {
                          if (!newOther.name.trim() || !newOther.amount) return;
                          setOtherIncome(prev => [...prev, { id: 'oi-' + Date.now(), name: newOther.name.trim(), amount: parseFloat(newOther.amount) }]);
                          setNewOther({ name: '', amount: '' });
                          setShowAddOther(false);
                          showToast('Income source added');
                        }}>Add</button>
                      </div>
                    </div>
                  )}

                  {/* OTHER TOTAL */}
                  <div style={{ padding: '10px 20px', background: '#f8f9fb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#0d1b2a' }}>Total Other Income</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1a7a52' }}>{fmt(totalOther)}</div>
                  </div>
                </div>

              </div>

              {/* SUMMARY ROW */}
              <div style={{ background: '#0d1b2a', borderRadius: 10, padding: '16px 24px', marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                {[
                  { label: 'Total Expected', value: fmt(totalExpectedCollections), sub: 'At 100% collection' },
                  { label: 'Projected', value: fmt(projectedCollections), sub: `At ${collectionRate}% collection` },
                  { label: 'Total Budgeted', value: fmt(totalBudgeted), sub: 'All expense categories' },
                  { label: surplus >= 0 ? 'Surplus' : 'Shortfall', value: fmt(Math.abs(surplus)), sub: surplus >= 0 ? 'Available after expenses' : 'Gap to cover' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontFamily: 'var(--font-sora)', fontSize: 22, fontWeight: 300, color: s.label === 'Shortfall' ? '#e05c5c' : s.label === 'Surplus' ? '#2ecc8a' : '#ffffff' }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{s.sub}</div>
                  </div>
                ))}
              </div>

            </div>
          ) : (
          <div>

          {/* STAT CARDS */}
          <div style={S.statsRow}>
            <div style={{ ...S.statCard, borderTopColor: '#4a90d9' }}>
              <div style={S.statLabel}>Total Budget</div>
              <div style={S.statVal}>{fmt(totalBudgeted)}</div>
              <div style={S.statSub}>{SEMESTER}</div>
            </div>
            <div style={{ ...S.statCard, borderTopColor: '#c9a84c' }}>
              <div style={S.statLabel}>Spent</div>
              <div style={S.statVal}>{fmt(totalSpent)}</div>
              <div style={S.statSub}>{budgetUsedPct}% of budget used</div>
            </div>
            <div style={{ ...S.statCard, borderTopColor: '#a78bfa' }}>
              <div style={S.statLabel}>Remaining</div>
              <div style={S.statVal}>{fmt(totalRemaining)}</div>
              <div style={S.statSub}>{100 - budgetUsedPct}% left</div>
            </div>
            <div style={{ ...S.statCard, borderTopColor: overCount > 0 ? '#e05c5c' : '#2ecc8a' }}>
              <div style={S.statLabel}>Over Budget</div>
              <div style={S.statVal}>{overCount} {overCount === 1 ? 'category' : 'categories'}</div>
              <div style={S.statSub}>{overCount > 0 ? 'Need attention' : 'All on track'}</div>
            </div>
          </div>

          {/* VIEWING CATEGORY BANNER */}
          {selectedCat && (
            <div style={S.banner}>
              <div style={{ minWidth: 160, paddingRight: 20 }}>
                <div style={S.bannerName}>Viewing Category</div>
                <div style={S.bannerCat}>{selectedCat.name}</div>
              </div>
              {[
                { label: 'Budgeted',  val: fmt(selectedCat.budgeted) },
                { label: 'Spent',     val: fmt(selectedCat.spent) },
                { label: 'Remaining', val: fmt(selectedCat.budgeted - selectedCat.spent) },
                { label: 'Used',      val: pctOf(selectedCat.spent, selectedCat.budgeted) + '%' },
              ].map(s => (
                <div key={s.label} style={S.bannerStat}>
                  <div style={S.bannerAmt}>{s.val}</div>
                  <div style={S.bannerLbl}>{s.label}</div>
                </div>
              ))}
              <button style={S.bannerClose} onClick={() => { setSelectedId(null); setExpandedId(null); }}>✕ Clear</button>
            </div>
          )}

          {/* MAIN GRID */}
          <div style={S.grid}>

            {/* BUDGET TABLE */}
            <div style={S.tableCard}>
              <div style={S.tableHeader}>
                <div style={S.tableTitle}>Budget Categories</div>
                <div style={S.tableHint}>Click a row to filter · ▾ to expand sub-budget · ✎ to edit</div>
              </div>

              {/* COLUMN HEADERS */}
              <div style={S.colHeader}>
                <div style={S.colTh}>Category</div>
                <div style={S.colTh}>Progress</div>
                <div style={S.colThRight}>Budgeted</div>
                <div style={S.colThRight}>Spent</div>
                <div style={S.colThRight}>Actions</div>
              </div>

              {/* CATEGORY ROWS */}
              {categories.map(cat => {
                const isSelected = selectedId === cat.id;
                const isExpanded = expandedId === cat.id;
                const liTotal    = cat.lineItems.reduce((s, li) => s + li.budgeted, 0);
                const liSpent    = cat.lineItems.reduce((s, li) => s + li.spent, 0);
                const unalloc    = cat.budgeted - liTotal;

                return (
                  <div key={cat.id} style={S.catRow}>

                    {/* MAIN ROW */}
                    <div
                      style={{ ...S.catRowMain, ...(isSelected ? S.catRowSel : {}) }}
                      onClick={() => handleSelectCat(cat.id)}
                    >
                      <div style={S.catNameWrap}>
                        <div style={{ ...S.catDot, background: cat.color }} />
                        <div style={S.catName}>{cat.name}</div>
                      </div>
                      <ProgressBar budgeted={cat.budgeted} spent={cat.spent} color={cat.color} />
                      <div style={S.catCell}>{fmt(cat.budgeted)}</div>
                      <div style={cat.spent > cat.budgeted ? S.catCellRed : S.catCell}>{fmt(cat.spent)}</div>
                      <div style={S.rowActions} onClick={e => e.stopPropagation()}>
                        <button style={S.iconBtn} onClick={() => openEditCategory(cat)} title="Edit">✎</button>
                        <button
                          style={{ ...S.iconBtn, ...(isExpanded ? { background: '#0d1b2a', color: '#ffffff', border: 'none' } : {}) }}
                          onClick={() => handleToggleSub(cat.id)}
                          title="Sub-budget"
                        >▾</button>
                      </div>
                    </div>

                    {/* SUB-BUDGET */}
                    {isExpanded && (
                      <div style={S.subArea}>

                        {/* SUB HEADER */}
                        <div style={S.subHeader}>
                          <div style={S.subTh}>Line Item</div>
                          <div />
                          <div style={S.subThRight}>Budgeted</div>
                          <div style={S.subThRight}>Spent</div>
                          <div />
                        </div>

                        {/* LINE ITEM ROWS */}
                        {cat.lineItems.map(li => {
                          const liOver = li.spent > li.budgeted;
                          return (
                            <div key={li.id} style={S.subRow}>
                              <div style={S.subName}>{li.name}</div>
                              <ProgressBar budgeted={li.budgeted} spent={li.spent} color={cat.color} />
                              <div style={S.subCell}>{fmt(li.budgeted)}</div>
                              <div style={liOver ? S.subCellRed : S.subCell}>{fmt(li.spent)}</div>
                              <div style={S.rowActions}>
                                <button style={S.iconBtn} onClick={() => openEditLine(cat.id, li)} title="Edit">✎</button>
                              </div>
                            </div>
                          );
                        })}

                        {/* ADD LINE FORM */}
                        {addLineId === cat.id && (
                          <div style={S.addLineForm}>
                            <input
                              style={S.addLineInput}
                              placeholder="Line item name"
                              value={newLine.name}
                              onChange={e => setNewLine(l => ({ ...l, name: e.target.value }))}
                              autoFocus
                            />
                            <input
                              style={S.addLineInput}
                              placeholder="Amount ($)"
                              type="number"
                              value={newLine.amount}
                              onChange={e => setNewLine(l => ({ ...l, amount: e.target.value }))}
                            />
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button style={S.addLineSave} onClick={() => saveLineItem(cat.id)}>Add</button>
                              <button style={S.addLineCanc} onClick={() => { setAddLineId(null); setNewLine({ name: '', amount: '' }); }}>✕</button>
                            </div>
                          </div>
                        )}

                        {/* SUB FOOTER */}
                        <div style={S.subFooter}>
                          <div style={S.subFootLbl}>Sub-total</div>
                          <div />
                          <div style={{ ...S.subFootVal, color: '#0d1b2a' }}>{fmt(liTotal)}</div>
                          <div style={{ ...S.subFootVal, color: liSpent > liTotal ? '#c03c3c' : '#0d1b2a' }}>{fmt(liSpent)}</div>
                          <div />
                        </div>

                        {/* UNALLOCATED */}
                        <div style={S.subUnalloc}>
                          <div style={S.subUnLbl}>Unallocated</div>
                          <div />
                          <div style={{ ...S.subUnVal, color: unalloc < 0 ? '#c03c3c' : '#8a97a8' }}>
                            {unalloc < 0 ? `-${fmt(Math.abs(unalloc))}` : fmt(unalloc)}
                          </div>
                          <div /><div />
                        </div>

                        {/* ADD LINE BUTTON */}
                        <div style={S.subAddRow}>
                          <button
                            style={S.subAddBtn}
                            onClick={() => { setAddLineId(addLineId === cat.id ? null : cat.id); setNewLine({ name: '', amount: '' }); }}
                          >+ Add Line Item</button>
                        </div>

                      </div>
                    )}
                  </div>
                );
              })}

              {/* TABLE FOOTER */}
              <div style={S.footer}>
                <div style={S.footerTxt}>{categories.length} categories · {fmt(totalBudgeted)} total budget</div>
                <button style={S.footerBtn} onClick={() => setAddSheet(true)}>+ Add Category</button>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div style={S.rightCol}>

              {/* SPEND BY CATEGORY */}
              <div style={S.card}>
                <div style={S.cardTitle}>Spend by Category</div>
                <DonutChart categories={categories} />
              </div>

              {/* BUDGET HEALTH */}
              <div style={S.card}>
                <div style={S.cardTitle}>Budget Health</div>
                <div style={{ display: 'inline-block', padding: '5px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600, background: '#fff8ec', color: '#8b5e0a', marginBottom: 10 }}>
                  ⚠ Attention Needed
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {categories.filter(c => c.spent >= c.budgeted).map(c => (
                    <div key={c.id} style={{ display: 'flex', gap: 6, fontSize: 11, color: '#8a97a8', alignItems: 'flex-start' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#e05c5c', marginTop: 3, flexShrink: 0 }} />
                      {c.name} is fully spent
                    </div>
                  ))}
                  {categories.filter(c => c.spent > 0 && c.spent < c.budgeted && pctOf(c.spent, c.budgeted) >= 80).map(c => (
                    <div key={c.id} style={{ display: 'flex', gap: 6, fontSize: 11, color: '#8a97a8', alignItems: 'flex-start' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f5a623', marginTop: 3, flexShrink: 0 }} />
                      {c.name} is {pctOf(c.spent, c.budgeted)}% spent
                    </div>
                  ))}
                  {categories.filter(c => c.spent === 0).map(c => (
                    <div key={c.id} style={{ display: 'flex', gap: 6, fontSize: 11, color: '#8a97a8', alignItems: 'flex-start' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#8a97a8', marginTop: 3, flexShrink: 0 }} />
                      {c.name} untouched
                    </div>
                  ))}
                </div>
              </div>

              {/* SEMESTER PROGRESS */}
              <div style={S.card}>
                <div style={S.cardTitle}>Semester Progress</div>
                {[
                  { label: 'Budget Used',       pct: budgetUsedPct, color: 'linear-gradient(90deg,#2ecc8a,#c9a84c)' },
                  { label: 'Semester Complete',  pct: SEMESTER_PCT,  color: '#4a90d9' },
                ].map(bar => (
                  <div key={bar.label} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#8a97a8', marginBottom: 5 }}>
                      <span>{bar.label}</span><span>{bar.pct}%</span>
                    </div>
                    <div style={{ height: 8, background: '#eef0f4', borderRadius: 100, overflow: 'hidden' }}>
                      <div style={{ width: `${bar.pct}%`, height: '100%', background: bar.color, borderRadius: 100 }} />
                    </div>
                  </div>
                ))}
                <div style={{ fontSize: 11, color: '#8a97a8', marginTop: 4 }}>
                  {budgetUsedPct > SEMESTER_PCT
                    ? `Spending is slightly ahead of pace. At this rate you'll use ~${Math.round(budgetUsedPct / SEMESTER_PCT * 100)}% of budget by semester end.`
                    : `Spending is on pace with the semester.`}
                </div>
              </div>

            </div>
          </div>
          </div>
        )}
        </div>
      </main>

      {/* EDIT MODAL */}
      {editModal && (
        <div style={S.overlay} onClick={() => setEditModal(null)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={S.modalTitle}>{editModal.type === 'category' ? 'Edit Category' : 'Edit Line Item'}</div>
            <div style={S.modalSub}>Update the name or budget amount</div>
            <div style={S.modalField}>
              <div style={S.modalLabel}>Name</div>
              <input style={S.modalInput} value={editName} onChange={e => setEditName(e.target.value)} autoFocus />
            </div>
            <div style={S.modalField}>
              <div style={S.modalLabel}>Budget Amount</div>
              <input style={S.modalInput} type="number" value={editAmt} onChange={e => setEditAmt(e.target.value)} />
            </div>
            {editModal.type === 'category' && (
              <div style={{ ...S.modalField, display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  checked={editIsFixed}
                  onChange={e => setEditIsFixed(e.target.checked)}
                  style={{ width: 15, height: 15, cursor: 'pointer', accentColor: '#0d1b2a' }}
                />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#0d1b2a' }}>Fixed cost</div>
                  <div style={{ fontSize: 11, color: '#8a97a8' }}>Must pay regardless of collections (e.g. rent, nationals)</div>
                </div>
              </div>
            )}
            <div style={S.modalFooter}>
              <button style={S.modalDelete} onClick={deleteTarget}>
                Delete {editModal.type === 'category' ? 'category' : 'line item'}
              </button>
              <button style={S.btnOutline} onClick={() => setEditModal(null)}>Cancel</button>
              <button style={S.btn} onClick={saveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD CATEGORY BOTTOM SHEET */}
      {addSheet && (
        <>
          <div style={S.sheetOverlay} onClick={() => setAddSheet(false)} />
          <div style={S.sheet}>
            <div style={S.sheetTitle}>Add Category</div>
            <div style={S.sheetSub}>Create a new budget category for this semester</div>
            <div style={S.sheetFields}>
              <div style={S.sheetField}>
                <div style={S.sheetLabel}>Category Name</div>
                <input style={S.sheetInput} placeholder="e.g. Philanthropy" value={newCat.name} onChange={e => setNewCat(n => ({ ...n, name: e.target.value }))} autoFocus />
              </div>
              <div style={S.sheetField}>
                <div style={S.sheetLabel}>Budget Amount</div>
                <input style={S.sheetInput} type="number" placeholder="e.g. 1500" value={newCat.amount} onChange={e => setNewCat(n => ({ ...n, amount: e.target.value }))} />
              </div>
            </div>
            <div style={S.sheetFooter}>
              <button style={S.btnOutline} onClick={() => setAddSheet(false)}>Cancel</button>
              <button style={S.btn} onClick={saveCategory}>Add Category</button>
            </div>
          </div>
        </>
      )}

      {/* TOAST */}
      {toast && (
        <div style={S.toast}>
          <span style={{ flex: 1 }}>{toast}</span>
          {toastUndo && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', width: 14, textAlign: 'center' }}>{toastCountdown}</span>
              <button onClick={() => { toastUndo(); setToast(null); setToastUndo(null); clearTimeout(toastTimerRef.current); clearInterval(countdownRef.current); }} style={{ background: '#c9a84c', border: 'none', color: '#0d1b2a', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: '5px 12px', borderRadius: 6 }}>Undo</button>
            </div>
          )}
          <button style={S.toastX} onClick={() => { setToast(null); setToastUndo(null); clearTimeout(toastTimerRef.current); clearInterval(countdownRef.current); }}>✕</button>
        </div>
      )}

    </div>
    </ProtectedRoute>
  );
}