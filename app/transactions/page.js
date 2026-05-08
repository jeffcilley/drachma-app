'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Sidebar from '../components/Sidebar';

// ── CONSTANTS ────────────────────────────────────────────────────────────────

const CATEGORIES = {
  housing:   { name: 'Housing / Rent',  color: '#4a90d9' },
  nationals: { name: 'Nationals Dues',  color: '#c9a84c' },
  insurance: { name: 'Insurance',       color: '#2ecc8a' },
  social:    { name: 'Social Events',   color: '#a78bfa' },
  phil:      { name: 'Philanthropy',    color: '#e05c5c' },
  recruit:   { name: 'Recruitment',     color: '#f5a623' },
  ops:       { name: 'Operations',      color: '#8a97a8' },
  dues:      { name: 'Dues Collected',  color: '#2ecc8a' },
  other:     { name: 'Uncategorized',   color: '#dce3eb' },
};

const BUDGET_AMOUNTS = {
  housing:   { name: 'Housing / Rent',  budgeted: 6000,  color: '#4a90d9' },
  nationals: { name: 'Nationals Dues',  budgeted: 2500,  color: '#c9a84c' },
  insurance: { name: 'Insurance',       budgeted: 1200,  color: '#2ecc8a' },
  social:    { name: 'Social Events',   budgeted: 3000,  color: '#a78bfa' },
  phil:      { name: 'Philanthropy',    budgeted: 1500,  color: '#e05c5c' },
  recruit:   { name: 'Recruitment',     budgeted: 2500,  color: '#f5a623' },
  ops:       { name: 'Operations',      budgeted: 1300,  color: '#8a97a8' },
};

const INITIAL_TRANSACTIONS = [
  { id: 1,  date: '2026-03-05', desc: 'Spring Dues — Batch 4',            cat: 'dues',     amount: 3300,  type: 'income',  receipt: true,  notes: '11 members' },
  { id: 2,  date: '2026-03-01', desc: 'Spring Dues — Batch 3',            cat: 'dues',     amount: 3600,  type: 'income',  receipt: true,  notes: '12 members' },
  { id: 3,  date: '2026-02-28', desc: 'Venue Deposit — Spring Formal',    cat: 'social',   amount: 1200,  type: 'expense', receipt: false, notes: '' },
  { id: 4,  date: '2026-02-28', desc: 'Monthly House Payment',            cat: 'housing',  amount: 2100,  type: 'expense', receipt: true,  notes: 'Feb payment' },
  { id: 5,  date: '2026-02-26', desc: 'Chapter Meeting Dinner',           cat: 'ops',      amount: 340,   type: 'expense', receipt: false, notes: '' },
  { id: 6,  date: '2026-02-24', desc: 'Spring Dues — Batch 2',            cat: 'dues',     amount: 3000,  type: 'income',  receipt: true,  notes: '10 members' },
  { id: 7,  date: '2026-02-20', desc: 'Nationals Per-Member Fee',         cat: 'nationals',amount: 2500,  type: 'expense', receipt: true,  notes: 'Spring 2025' },
  { id: 8,  date: '2026-02-18', desc: 'Liability Insurance Premium',      cat: 'insurance',amount: 600,   type: 'expense', receipt: true,  notes: 'Semi-annual' },
  { id: 9,  date: '2026-02-15', desc: 'DJ Deposit — Spring Formal',       cat: 'social',   amount: 600,   type: 'expense', receipt: true,  notes: '' },
  { id: 10, date: '2026-02-12', desc: 'Spring Dues — Batch 1',            cat: 'dues',     amount: 3300,  type: 'income',  receipt: true,  notes: '11 members' },
  { id: 11, date: '2026-02-10', desc: 'Member Shirts — Rush',             cat: 'recruit',  amount: 600,   type: 'expense', receipt: true,  notes: '20 shirts' },
  { id: 12, date: '2026-02-08', desc: 'Monthly House Payment',            cat: 'housing',  amount: 2100,  type: 'expense', receipt: true,  notes: 'Jan payment' },
  { id: 13, date: '2026-02-05', desc: 'Rush Food & Drinks',               cat: 'recruit',  amount: 400,   type: 'expense', receipt: true,  notes: '' },
  { id: 14, date: '2026-02-01', desc: 'Event Supplies — Philanthropy',    cat: 'phil',     amount: 500,   type: 'expense', receipt: true,  notes: '' },
  { id: 15, date: '2026-01-28', desc: 'Alumni Donation',                  cat: 'other',    amount: 1500,  type: 'income',  receipt: false, notes: 'Annual gift' },
  { id: 16, date: '2026-01-25', desc: 'Office Supplies',                  cat: 'ops',      amount: 85,    type: 'expense', receipt: false, notes: '' },
  { id: 17, date: '2026-01-20', desc: 'Marketing / Flyers — Philanthropy',cat: 'phil',     amount: 400,   type: 'expense', receipt: true,  notes: '' },
  { id: 18, date: '2026-01-18', desc: 'Monthly House Payment',            cat: 'housing',  amount: 2100,  type: 'expense', receipt: true,  notes: 'Dec payment' },
  { id: 19, date: '2026-01-15', desc: 'Food & Drinks — Social',           cat: 'social',   amount: 240,   type: 'expense', receipt: true,  notes: '' },
  { id: 20, date: '2026-01-12', desc: 'Fall Dues Carryover',              cat: 'dues',     amount: 2400,  type: 'income',  receipt: true,  notes: '8 late members' },
  { id: 21, date: '2026-01-10', desc: 'Bid Day Supplies',                 cat: 'recruit',  amount: 200,   type: 'expense', receipt: true,  notes: '' },
  { id: 22, date: '2026-01-08', desc: 'Decorations — Social',             cat: 'social',   amount: 200,   type: 'expense', receipt: true,  notes: '' },
  { id: 23, date: '2026-01-05', desc: 'Games & Activities — Rush',        cat: 'recruit',  amount: 300,   type: 'expense', receipt: true,  notes: '' },
  { id: 24, date: '2026-01-03', desc: 'Property Insurance Premium',       cat: 'insurance',amount: 400,   type: 'expense', receipt: true,  notes: '' },
];

// ── HELPERS ──────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatCurrency(amount, showSign = false) {
  const str = '$' + Math.abs(amount).toLocaleString();
  if (!showSign) return str;
  return amount < 0 ? '-' + str : str;
}

function highlightText(text, search) {
  if (!search) return text;
  try {
    const parts = text.split(new RegExp('(' + search + ')', 'gi'));
    return parts.map((p, i) =>
      p.toLowerCase() === search.toLowerCase()
        ? <mark key={i} style={{ background: '#fdf2a0', borderRadius: 2, padding: '0 1px' }}>{p}</mark>
        : p
    );
  } catch { return text; }
}

function computeBalanceMap(transactions) {
  // Sort oldest to newest by date, then by id as tiebreaker
  const sorted = [...transactions].sort((a, b) => {
    if (a.date < b.date) return -1;
    if (a.date > b.date) return 1;
    return a.id - b.id;
  });

  // Accumulate balance
  let bal = 0;
  const rawBal = {};
  sorted.forEach(tx => {
    bal += tx.type === 'income' ? tx.amount : -tx.amount;
    rawBal[tx.id] = bal;
  });

  // Group by date — all same-date transactions get the LAST balance of that date
  const dateGroups = {};
  sorted.forEach(tx => { dateGroups[tx.date] = rawBal[tx.id]; });
  const balMap = {};
  sorted.forEach(tx => { balMap[tx.id] = dateGroups[tx.date]; });

  return balMap;
}

function txMatchesDateFilter(tx, filter) {
  if (filter === 'semester' || filter === 'all') return true;
  const txDate = new Date(tx.date + 'T12:00:00');
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = (todayMidnight - txDate) / (1000 * 60 * 60 * 24);
  if (filter === '30days') return diffDays <= 30;
  if (filter === '7days')  return diffDays <= 7;
  return true;
}

// ── MODAL COMPONENTS ─────────────────────────────────────────────────────────

function TypeToggle({ value, onChange, prefix = '' }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button
        onClick={() => onChange('expense')}
        style={{
          flex: 1, padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
          fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
          border: value === 'expense' ? '1.5px solid #e05c5c' : '1.5px solid #dce3eb',
          background: value === 'expense' ? '#fef2f2' : '#ffffff',
          color: value === 'expense' ? '#c03c3c' : '#8a97a8',
        }}
      >⬇ Expense</button>
      <button
        onClick={() => onChange('income')}
        style={{
          flex: 1, padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
          fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
          border: value === 'income' ? '1.5px solid #2ecc8a' : '1.5px solid #dce3eb',
          background: value === 'income' ? '#f0fdf6' : '#ffffff',
          color: value === 'income' ? '#1a7a52' : '#8a97a8',
        }}
      >⬆ Income</button>
    </div>
  );
}

function ModalField({ label, children, full = false }) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : undefined, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: '#0d1b2a' }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  padding: '8px 12px', borderRadius: 8, border: '1px solid #dce3eb',
  fontSize: 13, color: '#0d1b2a', fontFamily: 'inherit', outline: 'none',
  background: '#ffffff',
};

const selectStyle = { ...inputStyle, cursor: 'pointer' };

function CategorySelect({ value, onChange, id }) {
  return (
    <select id={id} value={value} onChange={e => onChange(e.target.value)} style={selectStyle}>
      <option value="">Select a category...</option>
      {Object.entries(CATEGORIES).map(([k, v]) => (
        <option key={k} value={k}>{v.name}</option>
      ))}
    </select>
  );
}

function AddTransactionModal({ onClose, onSave }) {
  const [type, setType] = useState('expense');
  const [validationError, setValidationError] = useState(false);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [cat, setCat] = useState('');
  const [notes, setNotes] = useState('');

  function handleSave() {
    if (!desc.trim() || !amount || !date || !cat) {
      setValidationError(true);
      return;
    }
    setValidationError(false);
    onSave({ type, desc: desc.trim(), amount: parseFloat(amount), date, cat, notes: notes.trim(), receipt: false });
    onClose();
  }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }} style={overlayStyle}>
      <div style={modalStyle}>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#0d1b2a', marginBottom: 4 }}>Add Transaction</div>
        <div style={{ fontSize: 13, color: '#8a97a8', marginBottom: 20 }}>Log a new income or expense</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <ModalField label="Type" full>
            <TypeToggle value={type} onChange={setType} />
          </ModalField>
          <ModalField label="Description" full>
            <input style={inputStyle} value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g. Venue deposit for Spring Formal" />
          </ModalField>
          <ModalField label="Amount ($)">
            <input style={inputStyle} type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
          </ModalField>
          <ModalField label="Date">
            <input style={inputStyle} type="date" value={date} onChange={e => setDate(e.target.value)} />
          </ModalField>
          <ModalField label="Category" full>
            <CategorySelect value={cat} onChange={setCat} />
          </ModalField>
          <ModalField label="Notes (optional)" full>
            <input style={inputStyle} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional details..." />
          </ModalField>
        </div>
        {validationError && (
          <div style={{ marginTop: 12, padding: '8px 12px', background: '#fde8e8', borderRadius: 8, fontSize: 12, color: '#c03c3c', fontWeight: 500 }}>
            Please fill in all required fields before saving.
          </div>
        )}
        <div style={modalFooterStyle}>
          <button onClick={onClose} style={btnOutlineStyle}>Cancel</button>
          <button onClick={handleSave} style={btnStyle}>Add Transaction</button>
        </div>
      </div>
    </div>
  );
}

function EditTransactionModal({ tx, onClose, onSave, onDelete }) {
  const [type, setType] = useState(tx.type);
  const [desc, setDesc] = useState(tx.desc);
  const [amount, setAmount] = useState(String(tx.amount));
  const [date, setDate] = useState(tx.date);
  const [cat, setCat] = useState(tx.cat);
  const [notes, setNotes] = useState(tx.notes || '');
  const [verified, setVerified] = useState(tx.receipt);

  function handleSave() {
    if (!desc.trim() || !amount) return;
    onSave({ ...tx, type, desc: desc.trim(), amount: parseFloat(amount), date, cat, notes: notes.trim(), receipt: verified });
    onClose();
  }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }} style={overlayStyle}>
      <div style={modalStyle}>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#0d1b2a', marginBottom: 4 }}>Edit Transaction</div>
        <div style={{ fontSize: 13, color: '#8a97a8', marginBottom: 20 }}>Update the details for this transaction</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <ModalField label="Type" full>
            <TypeToggle value={type} onChange={setType} />
          </ModalField>
          <ModalField label="Description">
            <input style={inputStyle} value={desc} onChange={e => setDesc(e.target.value)} />
          </ModalField>
          <ModalField label="Amount ($)">
            <input style={inputStyle} type="number" value={amount} onChange={e => setAmount(e.target.value)} />
          </ModalField>
          <ModalField label="Category">
            <CategorySelect value={cat} onChange={setCat} />
          </ModalField>
          <ModalField label="Date">
            <input style={inputStyle} type="date" value={date} onChange={e => setDate(e.target.value)} />
          </ModalField>
          <ModalField label="Notes (optional)">
            <input style={inputStyle} value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. 12 members" />
          </ModalField>
          <ModalField label="Verified">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 36, padding: '0 12px', border: '1px solid #dce3eb', borderRadius: 8, background: '#ffffff' }}>
              <input type="checkbox" checked={verified} onChange={e => setVerified(e.target.checked)} style={{ width: 15, height: 15, cursor: 'pointer', accentColor: '#0d1b2a', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#0d1b2a' }}>Mark as verified</span>
            </div>
          </ModalField>
          <ModalField label="Receipt" full>
            <div style={{ border: '1px dashed #dce3eb', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8f9fb' }}>
              {tx.receipt ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2ecc8a' }} />
                    <span style={{ fontSize: 12, color: '#0d1b2a', fontWeight: 500 }}>Receipt attached</span>
                  </div>
                  <button style={smallBtnStyle}>👁 View Receipt</button>
                </>
              ) : (
                <>
                  <span style={{ fontSize: 12, color: '#8a97a8' }}>No receipt attached</span>
                  <button style={smallBtnStyle}>📎 Attach Receipt</button>
                </>
              )}
            </div>
          </ModalField>
        </div>
        <div style={{ ...modalFooterStyle, justifyContent: 'space-between' }}>
          <button onClick={onDelete} style={{ background: 'none', border: 'none', color: '#e05c5c', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Delete transaction</button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={btnOutlineStyle}>Cancel</button>
            <button onClick={handleSave} style={btnStyle}>Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── TOAST ─────────────────────────────────────────────────────────────────────

function Toast({ message, onUndo, onClose, countdown }) {
  if (!message) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
      background: '#0d1b2a', color: '#ffffff', padding: '14px 18px',
      borderRadius: 12, fontSize: 13, fontWeight: 500, zIndex: 200,
      display: 'flex', alignItems: 'center', gap: 16,
      boxShadow: '0 8px 40px rgba(0,0,0,0.35)', minWidth: 360,
      border: '1px solid rgba(255,255,255,0.1)',
    }}>
      <span style={{ flex: 1 }}>{message}</span>
      {onUndo && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 300, width: 14, textAlign: 'center' }}>{countdown}</span>
          <button onClick={onUndo} style={{ background: '#c9a84c', border: 'none', color: '#0d1b2a', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: '5px 12px', borderRadius: 6 }}>Undo</button>
        </div>
      )}
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1 }}>✕</button>
    </div>
  );
}

// ── INLINE CATEGORY POPUP ─────────────────────────────────────────────────────

function InlineCatPopup({ txId, anchorRect, onSelect, onClose }) {
  useEffect(() => {
    const handler = (e) => {
      e.stopPropagation && e.stopPropagation();
      onClose();
    };
    const timer = setTimeout(() => document.addEventListener('click', handler), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handler);
    };
  }, [onClose]);

  if (!anchorRect) return null;
  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        position: 'fixed', top: anchorRect.bottom + 4, left: anchorRect.left,
        background: '#ffffff', border: '1px solid #dce3eb', borderRadius: 10,
        boxShadow: '0 8px 30px rgba(0,0,0,0.15)', zIndex: 300, minWidth: 180, padding: 6,
      }}>
      {Object.entries(CATEGORIES).map(([id, cat]) => (
        <div
          key={id}
          onClick={() => { onSelect(txId, id); }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12, color: '#0d1b2a' }}
          onMouseEnter={e => e.currentTarget.style.background = '#f0f3f7'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
          {cat.name}
        </div>
      ))}
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('semester');
  const [catFilter, setCatFilter] = useState(null);
  const [catView, setCatView] = useState('spending');
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState(0);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTx, setEditTx] = useState(null);
  const [toast, setToast] = useState({ message: '', undoFn: null, countdown: 8 });
  const [inlineCat, setInlineCat] = useState({ txId: null, rect: null });
  const toastTimerRef = useRef(null);
  const countdownRef = useRef(null);
  const nextIdRef = useRef(25);

  // ── TOAST ────────────────────────────────────────────────────────────────

  const showToast = useCallback((message, undoFn = null) => {
    clearTimeout(toastTimerRef.current);
    clearInterval(countdownRef.current);
    setToast({ message, undoFn, countdown: 8 });
    if (undoFn) {
      let secs = 8;
      countdownRef.current = setInterval(() => {
        secs--;
        setToast(t => ({ ...t, countdown: secs }));
        if (secs <= 0) clearInterval(countdownRef.current);
      }, 1000);
      toastTimerRef.current = setTimeout(() => setToast({ message: '', undoFn: null, countdown: 8 }), 8000);
    } else {
      toastTimerRef.current = setTimeout(() => setToast({ message: '', undoFn: null, countdown: 8 }), 3000);
    }
  }, []);

  const hideToast = useCallback(() => {
    clearTimeout(toastTimerRef.current);
    clearInterval(countdownRef.current);
    setToast({ message: '', undoFn: null, countdown: 8 });
  }, []);

  // ── FILTERING & SORTING ──────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = transactions.filter(tx => {
      const matchSearch = tx.desc.toLowerCase().includes(search.toLowerCase()) ||
                          CATEGORIES[tx.cat].name.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === 'all' ||
                        (typeFilter === 'income' && tx.type === 'income') ||
                        (typeFilter === 'expense' && tx.type === 'expense');
      const matchDate = txMatchesDateFilter(tx, dateFilter);
      const matchCat  = !catFilter || tx.cat === catFilter;
      return matchSearch && matchType && matchDate && matchCat;
    });

    if (sortCol && sortDir !== 0) {
      list = [...list].sort((a, b) => {
        let av, bv;
        if (sortCol === 'date')   { av = a.date; bv = b.date; }
        if (sortCol === 'desc')   { av = a.desc.toLowerCase(); bv = b.desc.toLowerCase(); }
        if (sortCol === 'cat')    { av = CATEGORIES[a.cat].name; bv = CATEGORIES[b.cat].name; }
        if (sortCol === 'amount') { av = a.amount; bv = b.amount; }
        if (av < bv) return -1 * sortDir;
        if (av > bv) return 1 * sortDir;
        return (a.id - b.id) * sortDir;
      });
    } else {
      // Default: newest first by date, then by id descending
      list = [...list].sort((a, b) => {
        if (a.date > b.date) return -1;
        if (a.date < b.date) return 1;
        return b.id - a.id;
      });
    }

    return list;
  }, [transactions, search, typeFilter, dateFilter, catFilter, sortCol, sortDir]);

  const balMap = useMemo(() => computeBalanceMap(transactions), [transactions]);

  // ── TOTALS ───────────────────────────────────────────────────────────────

  const totals = useMemo(() => {
    const totalIn  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalOut = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const net      = totalIn - totalOut;
    const unrec    = transactions.filter(t => !t.receipt).length;
    return { totalIn, totalOut, net, unrec };
  }, [transactions]);

  // ── SORT ─────────────────────────────────────────────────────────────────

  function handleSort(col) {
    if (sortCol === col) {
      const next = sortDir === 1 ? -1 : sortDir === -1 ? 0 : 1;
      setSortDir(next);
      if (next === 0) setSortCol(null);
    } else {
      setSortCol(col);
      setSortDir(1);
    }
  }

  function sortIcon(col) {
    if (sortCol !== col) return ' ↕';
    if (sortDir === 1) return ' ↑';
    if (sortDir === -1) return ' ↓';
    return ' ↕';
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────

  function handleAdd(data) {
    const newTx = { id: nextIdRef.current++, ...data };
    setTransactions(prev => [newTx, ...prev]);
    showToast(`"${data.desc}" added`);
  }

  function handleSaveEdit(updated) {
    setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t));
    showToast('Transaction updated');
  }

  function handleDelete(id) {
    const tx = transactions.find(t => t.id === id);
    const idx = transactions.findIndex(t => t.id === id);
    setTransactions(prev => prev.filter(t => t.id !== id));
    showToast(`"${tx.desc}" deleted`, () => {
      setTransactions(prev => {
        const next = [...prev];
        next.splice(idx, 0, tx);
        return next;
      });
    });
  }

  function handleDeleteFromEdit(id) {
    setEditTx(null);
    handleDelete(id);
  }

  function handleDuplicate(id) {
    const tx = transactions.find(t => t.id === id);
    const newTx = { ...tx, id: nextIdRef.current++, desc: tx.desc + ' (copy)', receipt: false };
    setTransactions(prev => [newTx, ...prev]);
    showToast(`"${tx.desc}" duplicated`);
  }

  function handleInlineCatChange(txId, catId) {
    setTransactions(prev => prev.map(t => t.id !== txId ? t : { ...t, cat: catId }));
    setInlineCat({ txId: null, rect: null });
    showToast('Category updated');
  }

  // ── BULK ─────────────────────────────────────────────────────────────────

  function toggleSelect(id) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(t => t.id)));
    }
  }

  function handleBulkDelete() {
    const count = selectedIds.size;
    const deleted = transactions.filter(t => selectedIds.has(t.id));
    setTransactions(prev => prev.filter(t => !selectedIds.has(t.id)));
    setSelectedIds(new Set());
    showToast(`${count} transactions deleted`, () => {
      setTransactions(prev => [...prev, ...deleted].sort((a, b) => b.id - a.id));
    });
  }

  // ── EXPORT CSV ───────────────────────────────────────────────────────────

  function exportCSV() {
    const headers = ['Date', 'Description', 'Notes', 'Category', 'Type', 'Amount', 'Balance After'];
    const rows = [...transactions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(tx => [
        formatDate(tx.date),
        '"' + tx.desc.replace(/"/g, '""') + '"',
        '"' + (tx.notes || '').replace(/"/g, '""') + '"',
        CATEGORIES[tx.cat].name,
        tx.type,
        (tx.type === 'income' ? '' : '-') + tx.amount,
        balMap[tx.id],
      ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'drachma-transactions.csv'; a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exported');
  }

  // ── SPENDING / COLLECTIONS BY CATEGORY ──────────────────────────────────

  const catBreakdown = useMemo(() => {
    const isSpending = catView === 'spending';
    const relevant = transactions.filter(t => t.type === (isSpending ? 'expense' : 'income'));
    const bycat = {};
    relevant.forEach(t => { bycat[t.cat] = (bycat[t.cat] || 0) + t.amount; });
    const total = Object.values(bycat).reduce((s, v) => s + v, 0);
    return Object.entries(bycat)
      .sort((a, b) => b[1] - a[1])
      .map(([catId, amt]) => ({
        catId, amt,
        cat: CATEGORIES[catId],
        pct: total > 0 ? Math.round(amt / total * 100) : 0,
      }));
  }, [transactions, catView]);

  const budgetImpact = useMemo(() => {
    const spent = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      spent[t.cat] = (spent[t.cat] || 0) + t.amount;
    });
    return Object.entries(BUDGET_AMOUNTS).map(([catId, cat]) => {
      const spentAmt = spent[catId] || 0;
      const pct = cat.budgeted > 0 ? Math.min(Math.round(spentAmt / cat.budgeted * 100), 100) : 0;
      const isOver = spentAmt > cat.budgeted;
      return { catId, cat, spentAmt, pct, isOver };
    }).sort((a, b) => b.spentAmt - a.spentAmt);
  }, [transactions]);

  const missingReceipts = useMemo(() =>
    transactions.filter(t => !t.receipt).slice(0, 5),
    [transactions]
  );

  // ── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f5f7fa', fontFamily: "'DM Sans', sans-serif" }}>
      <Sidebar activePage="transactions" />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* TOPBAR */}
        <div style={{ padding: '20px 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#0d1b2a' }}>Transactions</div>
            <div style={{ fontSize: 12, color: '#8a97a8', marginTop: 2 }}>Spring 2025 · {transactions.length} transactions</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={exportCSV} style={btnOutlineStyle}>Export CSV</button>
            <button onClick={() => setShowAddModal(true)} style={btnStyle}>+ Add Transaction</button>
          </div>
        </div>

        {/* STAT CARDS */}
        <div style={{ padding: '16px 28px 0', flexShrink: 0 }}>
          <div className="stats-row">
            <StatCard label="TOTAL IN" value={formatCurrency(totals.totalIn)} sub="Dues + other income" colorClass="green" valueColor="#1a7a52" />
            <StatCard label="TOTAL OUT" value={formatCurrency(totals.totalOut)} sub="All expenses" colorClass="red" />
            <StatCard label="NET BALANCE" value={formatCurrency(totals.net, true)} sub="This semester" colorClass="blue" valueColor={totals.net < 0 ? '#e05c5c' : undefined} />
            <StatCard label="UNRECONCILED" value={String(totals.unrec)} sub="Missing receipts" colorClass="gold" />
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, display: 'flex', gap: 16, padding: '0 28px 20px', overflow: 'hidden', minHeight: 0 }}>

          {/* LEFT — TABLE */}
          <div style={{ flex: 1, background: '#ffffff', borderRadius: 12, border: '1px solid #eef0f4', display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

            {/* TOOLBAR */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #eef0f4', display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#8a97a8', fontSize: 13 }}>🔍</span>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search transactions..."
                  style={{ ...inputStyle, width: '100%', paddingLeft: 34, boxSizing: 'border-box' }}
                />
              </div>
              {['all', 'income', 'expense'].map(f => (
                <button key={f} onClick={() => setTypeFilter(f)} style={{
                  padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 12, fontWeight: 500,
                  background: typeFilter === f ? '#0d1b2a' : 'transparent',
                  color: typeFilter === f ? '#ffffff' : '#8a97a8',
                }}>{f === 'all' ? 'All' : f === 'income' ? 'Income' : 'Expenses'}</button>
              ))}
              <button onClick={() => setShowAddModal(true)} style={{ ...btnStyle, fontSize: 12, padding: '6px 12px', whiteSpace: 'nowrap' }}>+ Add Transaction</button>
              <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} style={{ ...selectStyle, fontSize: 11, padding: '6px 10px' }}>
                <option value="semester">This semester</option>
                <option value="30days">Last 30 days</option>
                <option value="7days">Last 7 days</option>
                <option value="all">All time</option>
              </select>
            </div>

            {/* BULK BAR */}
            {selectedIds.size > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', background: '#0d1b2a', color: '#ffffff', fontSize: 13, flexShrink: 0 }}>
                <span>{selectedIds.size} selected</span>
                <button onClick={handleBulkDelete} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: '#e05c5c', color: '#ffffff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Delete Selected</button>
                <button onClick={() => setSelectedIds(new Set())} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>✕ Clear</button>
              </div>
            )}

            {/* COLUMN HEADERS */}
            <div style={{ display: 'grid', gridTemplateColumns: '36px 80px 1fr 150px 100px 110px 120px', padding: '8px 20px', background: '#f8f9fb', borderBottom: '1px solid #eef0f4', flexShrink: 0 }}>
              <div><input type="checkbox" checked={selectedIds.size === filtered.length && filtered.length > 0} onChange={toggleSelectAll} style={{ cursor: 'pointer', accentColor: '#0d1b2a' }} /></div>
              {[['date', 'Date'], ['desc', 'Description'], ['cat', 'Category'], ['amount', 'Amount'], [null, 'Balance After'], [null, 'Actions']].map(([col, label], i) => (
                <div
                  key={i}
                  onClick={col ? () => handleSort(col) : undefined}
                  style={{
                    fontSize: 11, fontWeight: 600, color: '#8a97a8', letterSpacing: '0.05em', textTransform: 'uppercase',
                    cursor: col ? 'pointer' : 'default', userSelect: 'none',
                    textAlign: i >= 4 ? 'center' : undefined,
                  }}
                >
                  {label}{col ? sortIcon(col) : ''}
                </div>
              ))}
            </div>

            {/* ROWS */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filtered.map(tx => {
                const cat = CATEGORIES[tx.cat];
                const isInc = tx.type === 'income';
                const bal = balMap[tx.id];
                const isSelected = selectedIds.has(tx.id);
                return (
                  <div
                    key={tx.id}
                    style={{
                      display: 'grid', gridTemplateColumns: '36px 80px 1fr 150px 100px 110px 120px',
                      padding: '12px 20px', alignItems: 'center',
                      borderBottom: '1px solid #f3f5f8',
                      background: isSelected ? '#eaf2fb' : 'transparent',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f8f9fb'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {/* Checkbox */}
                    <div onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(tx.id)} style={{ cursor: 'pointer', accentColor: '#0d1b2a' }} />
                    </div>

                    {/* Date */}
                    <div style={{ fontSize: 12, color: '#8a97a8' }}>{formatDate(tx.date)}</div>

                    {/* Description */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#0d1b2a' }}>{highlightText(tx.desc, search)}</div>
                        {!tx.receipt && (
                          <div title="Needs verification" style={{ width: 7, height: 7, borderRadius: '50%', background: '#f5a623', flexShrink: 0 }} />
                        )}
                      </div>
                      {tx.notes && <div style={{ fontSize: 11, color: '#8a97a8', marginTop: 2 }}>{tx.notes}</div>}
                    </div>

                    {/* Category */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                      <span
                        onClick={e => { e.stopPropagation(); setInlineCat({ txId: tx.id, rect: e.currentTarget.getBoundingClientRect() }); }}
                        style={{ fontSize: 12, color: '#0d1b2a', cursor: 'pointer', borderBottom: '1px dashed transparent' }}
                        onMouseEnter={e => e.currentTarget.style.borderBottomColor = '#8a97a8'}
                        onMouseLeave={e => e.currentTarget.style.borderBottomColor = 'transparent'}
                        title="Click to change category"
                      >{cat.name}</span>
                    </div>

                    {/* Amount */}
                    <div style={{ fontSize: 13, fontWeight: 600, color: isInc ? '#1a7a52' : '#0d1b2a', textAlign: 'right', paddingRight: 8 }}>
                      {isInc ? '+' : '−'}${tx.amount.toLocaleString()}
                    </div>

                    {/* Balance After */}
                    <div style={{ fontSize: 12, fontWeight: 500, color: bal >= 0 ? '#1a7a52' : '#c03c3c', textAlign: 'center' }}>
                      {bal >= 0 ? '$' : '-$'}{Math.abs(bal).toLocaleString()}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }} onClick={e => e.stopPropagation()}>
                      <ActionBtn title="Duplicate" onClick={() => handleDuplicate(tx.id)}>⧉</ActionBtn>
                      <ActionBtn title="Edit" onClick={() => setEditTx(tx)}>✎</ActionBtn>
                      <ActionBtn title="Delete" onClick={() => handleDelete(tx.id)}>✕</ActionBtn>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* FOOTER */}
            <div style={{ padding: '10px 20px', borderTop: '1px solid #eef0f4', fontSize: 12, color: '#8a97a8', flexShrink: 0 }}>
              Showing {filtered.length} of {transactions.length} transactions ·{' '}
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f5a623', display: 'inline-block' }} />
                no receipt attached
              </span>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div style={{ width: 320, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', flexShrink: 0 }}>

            {/* BUDGET IMPACT */}
            <SideCard title="Budget Impact">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {budgetImpact.map(({ catId, cat, spentAmt, pct, isOver }) => (
                  <div key={catId}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, fontWeight: 500, color: '#0d1b2a' }}>{cat.name}</span>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 600, color: isOver ? '#c03c3c' : pct >= 80 ? '#8b5e0a' : '#8a97a8' }}>{pct}%</span>
                    </div>
                    <div style={{ height: 5, background: '#eef0f4', borderRadius: 100, overflow: 'hidden', marginBottom: 3 }}>
                      <div style={{ width: pct + '%', height: '100%', background: isOver ? '#e05c5c' : cat.color, borderRadius: 100, transition: 'width 0.3s ease' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 10, color: '#8a97a8' }}>${spentAmt.toLocaleString()} spent</span>
                      <span style={{ fontSize: 10, color: '#8a97a8' }}>of ${cat.budgeted.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </SideCard>

            {/* SPENDING / COLLECTIONS */}
            <SideCard
              title={catView === 'spending' ? 'Spending by Category' : 'Collections by Category'}
              titleExtra={
                <div style={{ display: 'flex', background: '#f0f3f7', borderRadius: 6, padding: 2, gap: 2 }}>
                  {['spending', 'collections'].map(v => (
                    <button key={v} onClick={() => setCatView(v)} style={{
                      padding: '3px 8px', borderRadius: 4, border: 'none',
                      fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                      background: catView === v ? '#0d1b2a' : 'transparent',
                      color: catView === v ? '#ffffff' : '#8a97a8',
                      transition: 'all 0.15s',
                    }}>{v.charAt(0).toUpperCase() + v.slice(1)}</button>
                  ))}
                </div>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {catBreakdown.map(({ catId, cat, amt, pct }) => {
                  const isActive = catFilter === catId;
                  return (
                    <div
                      key={catId}
                      onClick={() => setCatFilter(isActive ? null : catId)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 7, padding: '4px 6px',
                        borderRadius: 6, cursor: 'pointer',
                        background: isActive ? 'rgba(201,168,76,0.08)' : 'transparent',
                        transition: 'background 0.1s',
                      }}
                    >
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: cat.color, flexShrink: 0, boxShadow: isActive ? `0 0 0 2px ${cat.color}40` : undefined }} />
                      <div style={{ flex: 1, fontSize: 11, fontWeight: isActive ? 600 : 400, color: '#0d1b2a' }}>{cat.name}</div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#0d1b2a' }}>${amt.toLocaleString()}</div>
                        <div style={{ fontSize: 9, color: '#8a97a8' }}>{pct}%</div>
                      </div>
                    </div>
                  );
                })}
                {catFilter && (
                  <div style={{ textAlign: 'center', marginTop: 4 }}>
                    <button onClick={() => setCatFilter(null)} style={{ background: 'none', border: 'none', fontSize: 11, color: '#8a97a8', cursor: 'pointer', fontFamily: 'inherit' }}>✕ Clear filter</button>
                  </div>
                )}
              </div>
            </SideCard>

            {/* MISSING RECEIPTS */}
            <SideCard title="Missing Receipts">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {missingReceipts.length === 0 ? (
                  <div style={{ fontSize: 12, color: '#8a97a8', textAlign: 'center', padding: '8px 0' }}>All transactions verified ✓</div>
                ) : missingReceipts.map(tx => (
                  <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, background: '#fde8e8', borderRadius: 7 }}>
                    <div style={{ fontSize: 18 }}>🧾</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: '#0d1b2a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.desc}</div>
                      <div style={{ fontSize: 10, color: '#8a97a8' }}>{formatDate(tx.date)} · ${tx.amount.toLocaleString()}</div>
                    </div>
                    <button onClick={() => setEditTx(tx)} style={{ padding: '3px 8px', borderRadius: 5, border: '1px solid #0d1b2a', background: '#0d1b2a', color: '#ffffff', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>Add</button>
                  </div>
                ))}
              </div>
            </SideCard>

          </div>
        </div>
      </main>

      {/* MODALS */}
      {showAddModal && <AddTransactionModal onClose={() => setShowAddModal(false)} onSave={handleAdd} />}
      {editTx && (
        <EditTransactionModal
          tx={editTx}
          onClose={() => setEditTx(null)}
          onSave={handleSaveEdit}
          onDelete={() => handleDeleteFromEdit(editTx.id)}
        />
      )}

      {/* INLINE CATEGORY POPUP */}
      {inlineCat.txId && (
        <InlineCatPopup
          txId={inlineCat.txId}
          anchorRect={inlineCat.rect}
          onSelect={handleInlineCatChange}
          onClose={() => setInlineCat({ txId: null, rect: null })}
        />
      )}

      {/* TOAST */}
      <Toast
        message={toast.message}
        onUndo={toast.undoFn ? () => {
          toast.undoFn();
          hideToast();
        } : null}
        onClose={hideToast}
        countdown={toast.countdown}
      />
    </div>
  );
}

// ── SMALL COMPONENTS ──────────────────────────────────────────────────────────

function StatCard({ label, value, sub, colorClass, valueColor }) {
  return (
    <div className={`stat-card ${colorClass}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={valueColor ? { color: valueColor } : undefined}>{value}</div>
      <div className="stat-sub">{sub}</div>
    </div>
  );
}

function SideCard({ title, children, titleExtra }) {
  return (
    <div style={{ background: '#ffffff', borderRadius: 12, padding: 16, border: '1px solid #eef0f4', flexShrink: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#0d1b2a' }}>{title}</div>
        {titleExtra}
      </div>
      {children}
    </div>
  );
}

function ActionBtn({ onClick, title, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid #eef0f4', background: '#ffffff', cursor: 'pointer', fontSize: 12, color: '#8a97a8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onMouseEnter={e => { e.currentTarget.style.background = '#f0f3f7'; e.currentTarget.style.color = '#0d1b2a'; }}
      onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#8a97a8'; }}
    >{children}</button>
  );
}

// ── STYLES ────────────────────────────────────────────────────────────────────

const btnStyle = {
  padding: '8px 16px', borderRadius: 8, border: 'none',
  background: '#0d1b2a', color: '#ffffff', fontSize: 13, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'inherit',
};

const btnOutlineStyle = {
  padding: '8px 16px', borderRadius: 8, border: '1px solid #dce3eb',
  background: '#ffffff', color: '#0d1b2a', fontSize: 13, fontWeight: 500,
  cursor: 'pointer', fontFamily: 'inherit',
};

const smallBtnStyle = {
  padding: '5px 12px', borderRadius: 6, border: '1px solid #dce3eb',
  background: '#ffffff', fontSize: 11, fontWeight: 600,
  color: '#0d1b2a', cursor: 'pointer', fontFamily: 'inherit',
};

const overlayStyle = {
  position: 'fixed', inset: 0, background: 'rgba(13,27,42,0.5)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
};

const modalStyle = {
  background: '#ffffff', borderRadius: 16, padding: 28, width: 520,
  maxHeight: '90vh', overflowY: 'auto',
  boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
};

const modalFooterStyle = {
  display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24,
  paddingTop: 16, borderTop: '1px solid #eef0f4',
};