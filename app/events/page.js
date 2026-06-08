'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../lib/supabase';

const STATUS_CONFIG = {
  draft:    { label: 'Draft',    color: '#8a97a8', bg: '#f0f3f7' },
  approved: { label: 'Approved', color: '#4a90d9', bg: '#eaf2fb' },
  active:   { label: 'Active',   color: '#f5a623', bg: '#fff8ee' },
  complete: { label: 'Complete', color: '#2ecc8a', bg: '#e8f5ee' },
};

const STATUS_ORDER = ['draft', 'approved', 'active', 'complete'];
const EXPENSE_CATEGORIES = ['Venue', 'Entertainment', 'Food', 'Decor', 'Permits', 'Transportation', 'Marketing', 'Other'];

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatShortDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const inputStyle = {
  padding: '8px 12px', borderRadius: 8, border: '1px solid #dce3eb',
  fontSize: 13, color: '#0d1b2a', fontFamily: 'inherit', outline: 'none',
  background: '#ffffff', width: '100%', boxSizing: 'border-box',
};

// ── ADD EVENT MODAL ───────────────────────────────────────────────────────────

function AddEventModal({ onClose, onSave }) {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [budgeted, setBudgeted] = useState('');
  const [headcount, setHeadcount] = useState('');
  const [error, setError] = useState(false);

  function handleSave() {
    if (!name.trim() || !date || !budgeted) { setError(true); return; }
    setError(false);
    onSave({
      name: name.trim(), date, location: location.trim(), status: 'draft',
      budgeted: parseFloat(budgeted),
      headcountEstimated: headcount ? parseInt(headcount) : null,
      headcountActual: null, deadlines: [], expenses: [],
    });
    onClose();
  }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }} style={{ position: 'fixed', inset: 0, background: 'rgba(13,27,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#ffffff', borderRadius: 16, padding: 28, width: 480, boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#0d1b2a', marginBottom: 4 }}>New Event</div>
        <div style={{ fontSize: 13, color: '#8a97a8', marginBottom: 20 }}>Create a new event and set its budget</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#0d1b2a' }}>Event Name *</label>
            <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Spring Formal" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#0d1b2a' }}>Date *</label>
              <input style={inputStyle} type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#0d1b2a' }}>Budget ($) *</label>
              <input style={inputStyle} type="number" value={budgeted} onChange={e => setBudgeted(e.target.value)} placeholder="0.00" />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#0d1b2a' }}>Location</label>
            <input style={inputStyle} value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Grand Ballroom" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#0d1b2a' }}>Estimated Headcount</label>
            <input style={inputStyle} type="number" value={headcount} onChange={e => setHeadcount(e.target.value)} placeholder="e.g. 100" />
          </div>
          {error && (
            <div style={{ padding: '8px 12px', background: '#fde8e8', borderRadius: 8, fontSize: 12, color: '#c03c3c', fontWeight: 500 }}>
              Please fill in all required fields.
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8, paddingTop: 16, borderTop: '1px solid #eef0f4' }}>
            <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #dce3eb', background: '#ffffff', color: '#0d1b2a', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            <button onClick={handleSave} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#0d1b2a', color: '#ffffff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Create Event</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ADD/EDIT EXPENSE MODAL ────────────────────────────────────────────────────

function ExpenseModal({ onClose, onSave, existing }) {
  const [desc, setDesc] = useState(existing?.desc || '');
  const [amount, setAmount] = useState(existing?.amount ? String(existing.amount) : '');
  const [cat, setCat] = useState(existing?.cat || '');
  const [date, setDate] = useState(existing?.date || new Date().toISOString().split('T')[0]);
  const [error, setError] = useState(false);

  function handleSave() {
    if (!desc.trim() || !amount || !cat) { setError(true); return; }
    setError(false);
    onSave({ id: existing?.id, desc: desc.trim(), amount: parseFloat(amount), cat, date });
    onClose();
  }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }} style={{ position: 'fixed', inset: 0, background: 'rgba(13,27,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#ffffff', borderRadius: 16, padding: 28, width: 420, boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#0d1b2a', marginBottom: 4 }}>{existing ? 'Edit Expense' : 'Add Expense'}</div>
        <div style={{ fontSize: 13, color: '#8a97a8', marginBottom: 20 }}>{existing ? 'Update this expense' : 'Log an expense for this event'}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#0d1b2a' }}>Description *</label>
            <input style={inputStyle} value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g. Venue deposit" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#0d1b2a' }}>Amount ($) *</label>
              <input style={inputStyle} type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#0d1b2a' }}>Date</label>
              <input style={inputStyle} type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#0d1b2a' }}>Category *</label>
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={cat} onChange={e => setCat(e.target.value)}>
              <option value="">Select a category...</option>
              {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {error && (
            <div style={{ padding: '8px 12px', background: '#fde8e8', borderRadius: 8, fontSize: 12, color: '#c03c3c', fontWeight: 500 }}>
              Please fill in all required fields.
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8, paddingTop: 16, borderTop: '1px solid #eef0f4' }}>
            <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #dce3eb', background: '#ffffff', color: '#0d1b2a', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            <button onClick={handleSave} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#0d1b2a', color: '#ffffff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{existing ? 'Save Changes' : 'Add Expense'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ADD DEADLINE MODAL ────────────────────────────────────────────────────────

function AddDeadlineModal({ onClose, onSave }) {
  const [label, setLabel] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState(false);

  function handleSave() {
    if (!label.trim() || !date) { setError(true); return; }
    setError(false);
    onSave({ label: label.trim(), date, paid: false });
    onClose();
  }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }} style={{ position: 'fixed', inset: 0, background: 'rgba(13,27,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#ffffff', borderRadius: 16, padding: 28, width: 380, boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#0d1b2a', marginBottom: 4 }}>Add Deadline</div>
        <div style={{ fontSize: 13, color: '#8a97a8', marginBottom: 20 }}>Add a deposit or payment deadline</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#0d1b2a' }}>Label *</label>
            <input style={inputStyle} value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Venue Deposit" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#0d1b2a' }}>Due Date *</label>
            <input style={inputStyle} type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          {error && (
            <div style={{ padding: '8px 12px', background: '#fde8e8', borderRadius: 8, fontSize: 12, color: '#c03c3c', fontWeight: 500 }}>
              Please fill in all required fields.
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8, paddingTop: 16, borderTop: '1px solid #eef0f4' }}>
            <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #dce3eb', background: '#ffffff', color: '#0d1b2a', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            <button onClick={handleSave} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#0d1b2a', color: '#ffffff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Add Deadline</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────

export default function EventsPage() {
  const { dbUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingHeadcount, setEditingHeadcount] = useState(false);
  const [headcountInput, setHeadcountInput] = useState('');
  const [editingEstHeadcount, setEditingEstHeadcount] = useState(false);
  const [estHeadcountInput, setEstHeadcountInput] = useState('');
  const [editingBudgeted, setEditingBudgeted] = useState(false);
  const [budgetedInput, setBudgetedInput] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // expense IDs now come from Supabase
  const [toast, setToast] = useState({ message: '', undoFn: null, countdown: 8 });
  const toastTimerRef = useRef(null);
  const countdownRef = useRef(null);

  const selected = events.find(e => e.id === selectedId);
  const totalBudgeted = events.reduce((s, e) => s + e.budgeted, 0);
  const totalSpent = events.reduce((s, e) => s + e.expenses.reduce((es, ex) => es + ex.amount, 0), 0);
  const upcomingCount = events.filter(e => e.status === 'active' || e.status === 'approved').length;
  const filtered = events.filter(e => statusFilter === 'all' || e.status === statusFilter);
  const selectedSpent = selected ? selected.expenses.reduce((s, e) => s + e.amount, 0) : 0;
  const estCostPerPerson = selected?.headcountEstimated ? (selected.budgeted / selected.headcountEstimated).toFixed(2) : null;
  const actualCostPerPerson = selected?.headcountActual ? (selectedSpent / selected.headcountActual).toFixed(2) : null;

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

  // ── FETCH DATA ─────────────────────────────────────────────
  useEffect(() => {
    if (!dbUser?.chapter_id) return;
    fetchData();
  }, [dbUser]);

  async function fetchData() {
    setLoading(true);
    const [eventsRes, expensesRes, deadlinesRes] = await Promise.all([
      supabase.from('events').select('*').eq('chapter_id', dbUser.chapter_id).order('date', { ascending: false }),
      supabase.from('event_expenses').select('*').eq('chapter_id', dbUser.chapter_id),
      supabase.from('event_deadlines').select('*').eq('chapter_id', dbUser.chapter_id),
    ]);

    if (eventsRes.data) {
      const mapped = eventsRes.data.map(e => ({
        id: e.id,
        name: e.name,
        date: e.date,
        location: e.location || '',
        status: e.status || 'draft',
        budgeted: Number(e.budgeted_amount) || 0,
        headcountEstimated: e.headcount_estimated,
        headcountActual: e.headcount_actual,
        deadlines: (deadlinesRes.data || [])
          .filter(d => d.event_id === e.id)
          .map(d => ({ id: d.id, label: d.label, date: d.due_date, paid: d.paid })),
        expenses: (expensesRes.data || [])
          .filter(ex => ex.event_id === e.id)
          .map(ex => ({
            id: ex.id,
            desc: ex.description,
            amount: Number(ex.amount),
            cat: ex.category || 'Other',
            date: ex.date,
            transaction_id: ex.transaction_id,
          })),
      }));
      setEvents(mapped);
      if (mapped.length > 0) setSelectedId(mapped[0].id);
    }
    setLoading(false);
  }

  async function handleAddEvent(data) {
    const { data: newEvent, error } = await supabase
      .from('events')
      .insert({
        chapter_id: dbUser.chapter_id,
        name: data.name,
        date: data.date,
        location: data.location,
        status: data.status,
        budgeted_amount: data.budgeted,
        headcount_estimated: data.headcountEstimated,
      })
      .select()
      .single();

    if (newEvent) {
      const mapped = {
        id: newEvent.id,
        name: newEvent.name,
        date: newEvent.date,
        location: newEvent.location || '',
        status: newEvent.status || 'draft',
        budgeted: Number(newEvent.budgeted_amount) || 0,
        headcountEstimated: newEvent.headcount_estimated,
        headcountActual: newEvent.headcount_actual,
        deadlines: [],
        expenses: [],
      };
      setEvents(prev => [mapped, ...prev]);
      setSelectedId(mapped.id);
    }
  }

  async function handleDeleteEvent() {
    const deletedEvent = selected;
    const remaining = events.filter(e => e.id !== selectedId);
    setEvents(remaining);
    setSelectedId(remaining.length > 0 ? remaining[0].id : null);
    setShowDeleteConfirm(false);
    await supabase.from('events').delete().eq('id', selectedId);
    showToast(`"${deletedEvent.name}" deleted`);
  }

  async function handleStatusChange(eventId, newStatus) {
    await supabase.from('events').update({ status: newStatus }).eq('id', eventId);
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: newStatus } : e));
  }

  async function handleToggleDeadline(eventId, index) {
    const event = events.find(e => e.id === eventId);
    const deadline = event.deadlines[index];
    const newPaid = !deadline.paid;
    await supabase.from('event_deadlines').update({ paid: newPaid }).eq('id', deadline.id);
    setEvents(prev => prev.map(e => {
      if (e.id !== eventId) return e;
      const newDeadlines = e.deadlines.map((d, i) => i === index ? { ...d, paid: newPaid } : d);
      return { ...e, deadlines: newDeadlines };
    }));
  }

  async function handleAddDeadline(deadline) {
    const { data, error } = await supabase
      .from('event_deadlines')
      .insert({
        chapter_id: dbUser.chapter_id,
        event_id: selectedId,
        label: deadline.label,
        due_date: deadline.date,
        paid: false,
      })
      .select()
      .single();

    if (data) {
      const mapped = { id: data.id, label: data.label, date: data.due_date, paid: data.paid };
      setEvents(prev => prev.map(e => e.id !== selectedId ? e : { ...e, deadlines: [...e.deadlines, mapped] }));
    }
  }

  async function handleSaveExpense(expense) {
    if (expense.id) {
      // Edit existing expense
      await supabase.from('event_expenses').update({
        description: expense.desc,
        amount: expense.amount,
        category: expense.cat,
        date: expense.date,
      }).eq('id', expense.id);

      // Update linked transaction if exists
      const existing = selected.expenses.find(ex => ex.id === expense.id);
      if (existing?.transaction_id) {
        await supabase.from('transactions').update({
          description: `${expense.desc} — ${selected.name}`,
          amount: expense.amount,
          date: expense.date,
        }).eq('id', existing.transaction_id);
      }

      setEvents(prev => prev.map(e => {
        if (e.id !== selectedId) return e;
        return { ...e, expenses: e.expenses.map(ex => ex.id === expense.id ? { ...ex, ...expense } : ex) };
      }));
    } else {
      // Add new expense — also create a transaction
      const { data: txData } = await supabase.from('transactions').insert({
        chapter_id: dbUser.chapter_id,
        date: expense.date,
        description: `${expense.desc} — ${selected.name}`,
        amount: expense.amount,
        type: 'expense',
        event_id: selectedId,
        verified: false,
        notes: `Event expense: ${expense.cat}`,
      }).select().single();

      const { data: expData } = await supabase.from('event_expenses').insert({
        chapter_id: dbUser.chapter_id,
        event_id: selectedId,
        transaction_id: txData?.id || null,
        description: expense.desc,
        amount: expense.amount,
        category: expense.cat,
        date: expense.date,
      }).select().single();

      if (expData) {
        const mapped = {
          id: expData.id,
          desc: expData.description,
          amount: Number(expData.amount),
          cat: expData.category || 'Other',
          date: expData.date,
          transaction_id: expData.transaction_id,
        };
        setEvents(prev => prev.map(e => e.id !== selectedId ? e : { ...e, expenses: [...e.expenses, mapped] }));
      }
    }
  }

  async function handleDeleteExpense(expenseId) {
    const expense = selected.expenses.find(ex => ex.id === expenseId);
    setEvents(prev => prev.map(e => e.id !== selectedId ? e : { ...e, expenses: e.expenses.filter(ex => ex.id !== expenseId) }));

    // Delete linked transaction if exists
    if (expense.transaction_id) {
      await supabase.from('transactions').delete().eq('id', expense.transaction_id);
    }
    await supabase.from('event_expenses').delete().eq('id', expenseId);

    showToast(`"${expense.desc}" deleted`, async () => {
      // Restore expense and transaction on undo
      const { data: txData } = await supabase.from('transactions').insert({
        chapter_id: dbUser.chapter_id,
        date: expense.date,
        description: `${expense.desc} — ${selected.name}`,
        amount: expense.amount,
        type: 'expense',
        event_id: selectedId,
        verified: false,
      }).select().single();

      const { data: expData } = await supabase.from('event_expenses').insert({
        chapter_id: dbUser.chapter_id,
        event_id: selectedId,
        transaction_id: txData?.id || null,
        description: expense.desc,
        amount: expense.amount,
        category: expense.cat,
        date: expense.date,
      }).select().single();

      if (expData) {
        setEvents(prev => prev.map(e => e.id !== selectedId ? e : {
          ...e, expenses: [...e.expenses, { ...expense, id: expData.id, transaction_id: txData?.id }]
        }));
      }
    });
  }

  async function handleSaveHeadcount() {
    const val = parseInt(headcountInput);
    if (!isNaN(val) && val > 0) {
      await supabase.from('events').update({ headcount_actual: val }).eq('id', selectedId);
      setEvents(prev => prev.map(e => e.id !== selectedId ? e : { ...e, headcountActual: val }));
    }
    setEditingHeadcount(false);
    setHeadcountInput('');
  }

  async function handleSaveEstHeadcount() {
    const val = parseInt(estHeadcountInput);
    if (!isNaN(val) && val > 0) {
      await supabase.from('events').update({ headcount_estimated: val }).eq('id', selectedId);
      setEvents(prev => prev.map(e => e.id !== selectedId ? e : { ...e, headcountEstimated: val }));
    }
    setEditingEstHeadcount(false);
    setEstHeadcountInput('');
  }

  async function handleSaveBudgeted() {
    const val = parseFloat(budgetedInput);
    if (!isNaN(val) && val > 0) {
      await supabase.from('events').update({ budgeted_amount: val }).eq('id', selectedId);
      setEvents(prev => prev.map(e => e.id !== selectedId ? e : { ...e, budgeted: val }));
    }
    setEditingBudgeted(false);
    setBudgetedInput('');
  }

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 32, color: '#0d1b2a', marginBottom: 12 }}>Drach<span style={{ color: '#c9a84c' }}>m</span>a</div>
        <div style={{ fontSize: 13, color: '#8a97a8' }}>Loading events...</div>
      </div>
    </div>
  );

  return (
    <ProtectedRoute>
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f5f7fa', fontFamily: "'DM Sans', sans-serif" }}>
      <Sidebar activePage="events" />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* TOPBAR */}
        <div style={{ padding: '20px 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#0d1b2a' }}>Events</div>
            <div style={{ fontSize: 12, color: '#8a97a8', marginTop: 2 }}>Spring 2026 · {events.length} events</div>
          </div>
          <button onClick={() => setShowAddModal(true)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#0d1b2a', color: '#ffffff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            + New Event
          </button>
        </div>

        {/* STAT CARDS */}
        <div style={{ padding: '16px 28px 0', flexShrink: 0 }}>
          <div className="stats-row">
            <StatCard label="TOTAL EVENTS"   value={String(events.length)}                sub="This semester"        colorClass="blue" />
            <StatCard label="TOTAL BUDGETED" value={`$${totalBudgeted.toLocaleString()}`} sub="Across all events"    colorClass="gold" valueColor="#0d1b2a" />
            <StatCard label="TOTAL SPENT"    value={`$${totalSpent.toLocaleString()}`}    sub="Across all events"    colorClass="red" />
            <StatCard label="UPCOMING"       value={String(upcomingCount)}                sub="Active or approved"   colorClass="green" valueColor="#0d1b2a" />
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, display: 'flex', gap: 16, padding: '16px 28px 20px', overflow: 'hidden', minHeight: 0 }}>

          {/* LEFT — EVENT LIST */}
          <div style={{ width: 320, display: 'flex', flexDirection: 'column', flexShrink: 0, background: '#ffffff', borderRadius: 12, border: '1px solid #eef0f4', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #eef0f4' }}>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{ width: '100%', padding: '6px 10px', borderRadius: 7, border: '1px solid #dce3eb', fontSize: 12, fontFamily: 'inherit', color: '#0d1b2a', background: '#f8f9fb', cursor: 'pointer', outline: 'none' }}
              >
                <option value="all">All Events</option>
                <option value="draft">Draft</option>
                <option value="approved">Approved</option>
                <option value="active">Active</option>
                <option value="complete">Complete</option>
              </select>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filtered.map(event => {
                const spent = event.expenses.reduce((s, e) => s + e.amount, 0);
                const pct = event.budgeted > 0 ? Math.min(Math.round(spent / event.budgeted * 100), 100) : 0;
                const isOver = spent > event.budgeted;
                const isSelected = selectedId === event.id;
                const status = STATUS_CONFIG[event.status];
                return (
                  <div
                    key={event.id}
                    onClick={() => setSelectedId(event.id)}
                    style={{
                      padding: '14px 16px', borderBottom: '1px solid #f3f5f8', cursor: 'pointer',
                      background: isSelected ? 'rgba(201,168,76,0.06)' : 'transparent',
                      borderLeft: isSelected ? '3px solid #c9a84c' : '3px solid transparent',
                      transition: 'all 0.1s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0d1b2a', flex: 1, marginRight: 8 }}>{event.name}</div>
                      <div style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 100, background: status.bg, color: status.color, flexShrink: 0 }}>
                        {status.label}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: '#8a97a8', marginBottom: 8 }}>
                      📅 {formatShortDate(event.date)} {event.location && `· 📍 ${event.location.split(',')[0]}`}
                    </div>
                    <div style={{ height: 4, background: '#eef0f4', borderRadius: 100, overflow: 'hidden', marginBottom: 4 }}>
                      <div style={{ width: pct + '%', height: '100%', background: isOver ? '#e05c5c' : '#c9a84c', borderRadius: 100 }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 10, color: '#8a97a8' }}>${spent.toLocaleString()} spent</span>
                      <span style={{ fontSize: 10, color: isOver ? '#e05c5c' : '#8a97a8' }}>of ${event.budgeted.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT — EVENT DETAIL */}
          {selected && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', minWidth: 0 }}>

              {/* Header */}
              <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #eef0f4', padding: 20, flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: '#0d1b2a', marginBottom: 4 }}>{selected.name}</div>
                    <div style={{ fontSize: 12, color: '#8a97a8' }}>
                      📅 {formatDate(selected.date)} {selected.location && `· 📍 ${selected.location}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* Status Workflow */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {STATUS_ORDER.map((s, i) => {
                        const isCurrent = selected.status === s;
                        const isPast = STATUS_ORDER.indexOf(selected.status) > i;
                        const cfg = STATUS_CONFIG[s];
                        return (
                          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <button
                              onClick={() => handleStatusChange(selected.id, s)}
                              style={{
                                padding: '4px 10px', borderRadius: 100, border: 'none', cursor: 'pointer',
                                fontFamily: 'inherit', fontSize: 11, fontWeight: 600,
                                background: isCurrent ? cfg.bg : isPast ? '#f0f3f7' : '#f8f9fb',
                                color: isCurrent ? cfg.color : isPast ? '#8a97a8' : '#c0c8d0',
                                transition: 'all 0.15s',
                              }}
                            >{cfg.label}</button>
                            {i < STATUS_ORDER.length - 1 && <span style={{ color: '#dce3eb', fontSize: 10 }}>→</span>}
                          </div>
                        );
                      })}
                    </div>
                    {/* Delete Event */}
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(224,92,92,0.3)', background: '#fde8e8', color: '#c03c3c', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                    >🗑 Delete</button>
                  </div>
                </div>

                {/* Key Stats */}
                <div style={{ fontSize: 11, color: '#8a97a8', marginBottom: 8, fontStyle: 'italic' }}>
                  💡 Click Budgeted, Est. Headcount, or Actual Headcount to edit
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>

                  {/* Editable Budgeted */}
                  <div style={{ background: '#f8f9fb', borderRadius: 8, padding: '10px 12px', cursor: 'pointer' }} onClick={() => { setEditingBudgeted(true); setBudgetedInput(String(selected.budgeted)); }}>
                    <div style={{ fontSize: 10, color: '#8a97a8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Budgeted</div>
                    {editingBudgeted ? (
                      <input autoFocus type="number" value={budgetedInput} onChange={e => setBudgetedInput(e.target.value)} onBlur={handleSaveBudgeted} onKeyDown={e => e.key === 'Enter' && handleSaveBudgeted()} style={{ fontSize: 14, fontWeight: 600, color: '#0d1b2a', border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: 'inherit' }} />
                    ) : (
                      <div style={{ fontSize: 16, fontWeight: 600, color: '#0d1b2a' }}>${selected.budgeted.toLocaleString()}</div>
                    )}
                  </div>

                  {/* Spent — read only */}
                  <div style={{ background: '#f8f9fb', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, color: '#8a97a8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Spent</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#0d1b2a' }}>${selectedSpent.toLocaleString()}</div>
                  </div>

                  {/* Editable Est Headcount */}
                  <div style={{ background: '#f8f9fb', borderRadius: 8, padding: '10px 12px', cursor: 'pointer' }} onClick={() => { setEditingEstHeadcount(true); setEstHeadcountInput(selected.headcountEstimated ? String(selected.headcountEstimated) : ''); }}>
                    <div style={{ fontSize: 10, color: '#8a97a8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Est. Headcount</div>
                    {editingEstHeadcount ? (
                      <input autoFocus type="number" value={estHeadcountInput} onChange={e => setEstHeadcountInput(e.target.value)} onBlur={handleSaveEstHeadcount} onKeyDown={e => e.key === 'Enter' && handleSaveEstHeadcount()} style={{ fontSize: 14, fontWeight: 600, color: '#0d1b2a', border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: 'inherit' }} />
                    ) : (
                      <div style={{ fontSize: 16, fontWeight: 600, color: selected.headcountEstimated ? '#0d1b2a' : '#c9a84c' }}>
                        {selected.headcountEstimated ?? 'Click to add'}
                      </div>
                    )}
                  </div>

                  {/* Editable Actual Headcount */}
                  <div style={{ background: '#f8f9fb', borderRadius: 8, padding: '10px 12px', cursor: 'pointer' }} onClick={() => { setEditingHeadcount(true); setHeadcountInput(selected.headcountActual ? String(selected.headcountActual) : ''); }}>
                    <div style={{ fontSize: 10, color: '#8a97a8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Actual Headcount</div>
                    {editingHeadcount ? (
                      <input autoFocus type="number" value={headcountInput} onChange={e => setHeadcountInput(e.target.value)} onBlur={handleSaveHeadcount} onKeyDown={e => e.key === 'Enter' && handleSaveHeadcount()} style={{ fontSize: 14, fontWeight: 600, color: '#0d1b2a', border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: 'inherit' }} />
                    ) : (
                      <div style={{ fontSize: 16, fontWeight: 600, color: selected.headcountActual ? '#0d1b2a' : '#c9a84c' }}>
                        {selected.headcountActual ?? 'Click to add'}
                      </div>
                    )}
                  </div>

                </div>

                {/* Cost per person banners */}
                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                  {estCostPerPerson && (
                    <div style={{ flex: 1, padding: '8px 12px', background: '#eaf2fb', border: '1px solid rgba(74,144,217,0.2)', borderRadius: 8, fontSize: 12, color: '#2c5f8a' }}>
                      📊 Estimated cost per person: <strong>${estCostPerPerson}</strong> based on {selected.headcountEstimated} expected attendees
                    </div>
                  )}
                  {actualCostPerPerson && (
                    <div style={{ flex: 1, padding: '8px 12px', background: '#f0fdf6', border: '1px solid rgba(46,204,138,0.2)', borderRadius: 8, fontSize: 12, color: '#1a7a52' }}>
                      💡 Actual cost per person: <strong>${actualCostPerPerson}</strong> based on {selected.headcountActual} attendees
                    </div>
                  )}
                </div>
              </div>

              {/* Deadlines + Expenses */}
              <div style={{ display: 'flex', gap: 14, flexShrink: 0 }}>

                {/* Deadlines */}
                <div style={{ flex: 1, background: '#ffffff', borderRadius: 12, border: '1px solid #eef0f4', overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #eef0f4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#0d1b2a' }}>Deadlines & Deposits</div>
                    <button onClick={() => setShowDeadlineModal(true)} style={{ padding: '3px 10px', borderRadius: 6, border: '1px solid #dce3eb', background: '#ffffff', fontSize: 11, fontWeight: 600, color: '#0d1b2a', cursor: 'pointer', fontFamily: 'inherit' }}>+ Add</button>
                  </div>
                  <div>
                    {selected.deadlines.length === 0 ? (
                      <div style={{ padding: '16px', fontSize: 12, color: '#8a97a8', textAlign: 'center' }}>No deadlines added yet</div>
                    ) : selected.deadlines.map((d, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: i < selected.deadlines.length - 1 ? '1px solid #f3f5f8' : 'none' }}>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: d.paid ? '#e8f5ee' : '#fde8e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0 }}>
                          {d.paid ? '✓' : '!'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 500, color: '#0d1b2a' }}>{d.label}</div>
                          <div style={{ fontSize: 10, color: '#8a97a8' }}>{formatShortDate(d.date)}</div>
                        </div>
                        <button
                          onClick={() => handleToggleDeadline(selected.id, i)}
                          style={{
                            fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
                            border: `1px solid ${d.paid ? 'rgba(46,204,138,0.3)' : 'rgba(224,92,92,0.3)'}`,
                            background: d.paid ? '#e8f5ee' : '#fde8e8',
                            color: d.paid ? '#1a7a52' : '#c03c3c',
                          }}
                        >{d.paid ? 'Paid' : 'Due'}</button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Expenses */}
                <div style={{ flex: 1, background: '#ffffff', borderRadius: 12, border: '1px solid #eef0f4', overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #eef0f4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#0d1b2a' }}>Expenses</div>
                    <button onClick={() => { setEditingExpense(null); setShowExpenseModal(true); }} style={{ padding: '3px 10px', borderRadius: 6, border: '1px solid #dce3eb', background: '#ffffff', fontSize: 11, fontWeight: 600, color: '#0d1b2a', cursor: 'pointer', fontFamily: 'inherit' }}>+ Add</button>
                  </div>
                  <div>
                    {selected.expenses.length === 0 ? (
                      <div style={{ padding: '16px', fontSize: 12, color: '#8a97a8', textAlign: 'center' }}>No expenses logged yet</div>
                    ) : selected.expenses.map((ex, i) => (
                      <div key={ex.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: i < selected.expenses.length - 1 ? '1px solid #f3f5f8' : 'none' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 500, color: '#0d1b2a' }}>{ex.desc}</div>
                          <div style={{ fontSize: 10, color: '#8a97a8' }}>{ex.cat} · {formatShortDate(ex.date)}</div>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0d1b2a' }}>−${ex.amount.toLocaleString()}</div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            onClick={() => { setEditingExpense(ex); setShowExpenseModal(true); }}
                            style={{ width: 24, height: 24, borderRadius: 5, border: '1px solid #eef0f4', background: '#ffffff', cursor: 'pointer', fontSize: 11, color: '#8a97a8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >✎</button>
                          <button
                            onClick={() => handleDeleteExpense(ex.id)}
                            style={{ width: 24, height: 24, borderRadius: 5, border: '1px solid #eef0f4', background: '#ffffff', cursor: 'pointer', fontSize: 11, color: '#e05c5c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODALS */}
      {showAddModal && <AddEventModal onClose={() => setShowAddModal(false)} onSave={handleAddEvent} />}
      {showExpenseModal && (
        <ExpenseModal
          onClose={() => { setShowExpenseModal(false); setEditingExpense(null); }}
          onSave={handleSaveExpense}
          existing={editingExpense}
        />
      )}
      {showDeadlineModal && <AddDeadlineModal onClose={() => setShowDeadlineModal(false)} onSave={handleAddDeadline} />}

      {/* TOAST */}
      {toast.message && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          background: '#0d1b2a', color: '#ffffff', padding: '14px 18px',
          borderRadius: 12, fontSize: 13, fontWeight: 500, zIndex: 200,
          display: 'flex', alignItems: 'center', gap: 16,
          boxShadow: '0 8px 40px rgba(0,0,0,0.35)', minWidth: 360,
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <span style={{ flex: 1 }}>{toast.message}</span>
          {toast.undoFn && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', width: 14, textAlign: 'center' }}>{toast.countdown}</span>
              <button onClick={() => { toast.undoFn(); hideToast(); }} style={{ background: '#c9a84c', border: 'none', color: '#0d1b2a', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: '5px 12px', borderRadius: 6 }}>Undo</button>
            </div>
          )}
          <button onClick={hideToast} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 14, padding: 0 }}>✕</button>
        </div>
      )}

      {/* DELETE EVENT CONFIRMATION */}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,27,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#ffffff', borderRadius: 16, padding: 28, width: 380, boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#0d1b2a', marginBottom: 8 }}>Delete this event?</div>
            <div style={{ fontSize: 13, color: '#8a97a8', marginBottom: 24, lineHeight: 1.6 }}>
              This will permanently delete <strong style={{ color: '#0d1b2a' }}>{selected?.name}</strong> and all its expenses and deadlines.
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #dce3eb', background: '#ffffff', color: '#0d1b2a', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
              <button onClick={handleDeleteEvent} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#e05c5c', color: '#ffffff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
    </ProtectedRoute>
  );
}

function StatCard({ label, value, sub, colorClass, valueColor }) {
  return (
    <div className={`stat-card ${colorClass}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={valueColor ? { color: valueColor } : undefined}>{value}</div>
      <div className="stat-sub">{sub}</div>
    </div>
  );
}