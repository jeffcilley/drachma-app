'use client';

import { useState, useRef, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../lib/supabase';

// ── DATA ─────────────────────────────────────────────────────────────────────

const DOC_CATEGORIES = [
  { id: 'financial', label: 'Financial Records', icon: '💰', color: '#2ecc8a' },
  { id: 'policies',  label: 'Chapter Policies',  icon: '📋', color: '#4a90d9' },
  { id: 'vendors',   label: 'Vendor Contacts',   icon: '🤝', color: '#a78bfa' },
  { id: 'access',    label: 'Access & Contacts', icon: '🔑', color: '#f5a623' },
  { id: 'other',     label: 'Other',             icon: '📁', color: '#8a97a8' },
];

const CONTACT_CATEGORIES = [
  { id: 'vendor',    label: 'Vendors',          icon: '🏢', color: '#a78bfa' },
  { id: 'university',label: 'University',       icon: '🎓', color: '#4a90d9' },
  { id: 'nationals', label: 'National HQ',      icon: '🏛️', color: '#c9a84c' },
  { id: 'alumni',    label: 'Alumni',           icon: '👤', color: '#2ecc8a' },
  { id: 'other',     label: 'Other',            icon: '📞', color: '#8a97a8' },
];

// Data now loaded from Supabase

const HANDOFF_CHECKLIST = [
  { id: 'h1',  label: 'Export and save final semester budget' },
  { id: 'h2',  label: 'Reconcile all outstanding transactions' },
  { id: 'h3',  label: 'Resolve all unreconciled receipts' },
  { id: 'h4',  label: 'Update vendor contacts' },
  { id: 'h5',  label: 'Update Access & Contacts documents' },
  { id: 'h6',  label: 'Transfer bank account signatory access' },
  { id: 'h7',  label: 'Brief incoming treasurer on open items' },
  { id: 'h8',  label: 'Share software account references' },
  { id: 'h9',  label: 'Upload final semester report to Documents' },
  { id: 'h10', label: 'Send handoff package to incoming treasurer' },
];

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const inputStyle = {
  padding: '8px 12px', borderRadius: 8, border: '1px solid #dce3eb',
  fontSize: 13, color: '#0d1b2a', fontFamily: 'inherit', outline: 'none',
  background: '#ffffff', width: '100%', boxSizing: 'border-box',
};

// ── UPLOAD MODAL ──────────────────────────────────────────────────────────────

function UploadModal({ onClose, onSave }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [cat, setCat] = useState('');
  const [error, setError] = useState(false);

  function handleSave() {
    if (!name.trim() || !cat) { setError(true); return; }
    setError(false);
    onSave({ name: name.trim(), desc: desc.trim(), cat, date: new Date().toISOString().split('T')[0], size: '—' });
    onClose();
  }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }} style={{ position: 'fixed', inset: 0, background: 'rgba(13,27,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#ffffff', borderRadius: 16, padding: 28, width: 480, boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#0d1b2a', marginBottom: 4 }}>Upload Document</div>
        <div style={{ fontSize: 13, color: '#8a97a8', marginBottom: 16 }}>Add a document to the chapter library</div>

        {/* SECURITY WARNING */}
        <div style={{ padding: '10px 14px', background: '#fde8e8', border: '1px solid rgba(224,92,92,0.3)', borderRadius: 8, fontSize: 12, color: '#c03c3c', fontWeight: 500, marginBottom: 16, lineHeight: 1.5 }}>
          🔒 Never upload sensitive information, passwords, or bank account details to Drachma. Store contact references only.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Upload Zone */}
          <div
            style={{ border: '2px dashed #dce3eb', borderRadius: 10, padding: '20px', textAlign: 'center', background: '#f8f9fb', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#c9a84c'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#dce3eb'}
          >
            <div style={{ fontSize: 24, marginBottom: 6 }}>📎</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#0d1b2a', marginBottom: 4 }}>Click to browse or drag file here</div>
            <div style={{ fontSize: 11, color: '#8a97a8' }}>PDF, DOCX, XLSX, JPG, PNG supported</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#0d1b2a' }}>Document Name *</label>
            <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Spring 2026 Budget Export" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#0d1b2a' }}>Description</label>
            <input style={inputStyle} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Brief description of what this document contains" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#0d1b2a' }}>Category *</label>
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={cat} onChange={e => setCat(e.target.value)}>
              <option value="">Select a category...</option>
              {DOC_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
            </select>
          </div>

          {cat === 'access' && (
            <div style={{ padding: '10px 14px', background: '#fff8ee', border: '1px solid rgba(245,166,35,0.3)', borderRadius: 8, fontSize: 12, color: '#8b5e0a' }}>
              ⚠ Store bank names, contact persons, and phone numbers only — never actual login credentials.
            </div>
          )}

          {error && (
            <div style={{ padding: '8px 12px', background: '#fde8e8', borderRadius: 8, fontSize: 12, color: '#c03c3c', fontWeight: 500 }}>
              Please fill in all required fields.
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 16, borderTop: '1px solid #eef0f4' }}>
            <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #dce3eb', background: '#ffffff', color: '#0d1b2a', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            <button onClick={handleSave} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#0d1b2a', color: '#ffffff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Upload Document</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ADD CONTACT MODAL ─────────────────────────────────────────────────────────

function AddContactModal({ onClose, onSave, existing }) {
  const [name, setName] = useState(existing?.name || '');
  const [role, setRole] = useState(existing?.role || '');
  const [company, setCompany] = useState(existing?.company || '');
  const [phone, setPhone] = useState(existing?.phone || '');
  const [email, setEmail] = useState(existing?.email || '');
  const [cat, setCat] = useState(existing?.cat || '');
  const [desc, setDesc] = useState(existing?.desc || '');
  const [error, setError] = useState(false);

  function handleSave() {
    if (!name.trim() || !cat) { setError(true); return; }
    setError(false);
    onSave({ name: name.trim(), role: role.trim(), company: company.trim(), phone: phone.trim(), email: email.trim(), cat, desc: desc.trim() });
    onClose();
  }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }} style={{ position: 'fixed', inset: 0, background: 'rgba(13,27,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#ffffff', borderRadius: 16, padding: 28, width: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#0d1b2a', marginBottom: 4 }}>{existing ? 'Edit Contact' : 'Add Contact'}</div>
        <div style={{ fontSize: 13, color: '#8a97a8', marginBottom: 20 }}>{existing ? 'Update contact details' : 'Add a new contact to the chapter directory'}</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#0d1b2a' }}>Name *</label>
              <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sarah Mitchell" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#0d1b2a' }}>Role / Title</label>
              <input style={inputStyle} value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Event Coordinator" />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#0d1b2a' }}>Company / Organization</label>
            <input style={inputStyle} value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Grand Ballroom" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#0d1b2a' }}>Phone</label>
              <input style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} placeholder="(208) 555-0100" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#0d1b2a' }}>Email</label>
              <input style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#0d1b2a' }}>Category *</label>
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={cat} onChange={e => setCat(e.target.value)}>
              <option value="">Select a category...</option>
              {CONTACT_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#0d1b2a' }}>Description / Notes</label>
            <input style={inputStyle} value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g. Primary contact for venue bookings, books out early" />
          </div>

          {error && (
            <div style={{ padding: '8px 12px', background: '#fde8e8', borderRadius: 8, fontSize: 12, color: '#c03c3c', fontWeight: 500 }}>
              Please fill in all required fields.
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 16, borderTop: '1px solid #eef0f4' }}>
            <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #dce3eb', background: '#ffffff', color: '#0d1b2a', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            <button onClick={handleSave} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#0d1b2a', color: '#ffffff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{existing ? 'Save Changes' : 'Add Contact'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── COLLAPSIBLE SECTION HEADER ────────────────────────────────────────────────

function SectionHeader({ title, count, color, isOpen, onToggle, action }) {
  return (
    <div
      onClick={onToggle}
      style={{ padding: '10px 20px', background: '#f8f9fb', borderBottom: '1px solid #eef0f4', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}
      onMouseEnter={e => e.currentTarget.style.background = '#f0f3f7'}
      onMouseLeave={e => e.currentTarget.style.background = '#f8f9fb'}
    >
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <div style={{ fontSize: 11, fontWeight: 600, color: '#0d1b2a', textTransform: 'uppercase', letterSpacing: '0.06em', flex: 1 }}>{title}</div>
      <div style={{ fontSize: 10, color: '#8a97a8' }}>{count}</div>
      {action && <div onClick={e => e.stopPropagation()}>{action}</div>}
      <div style={{ fontSize: 10, color: '#8a97a8', marginLeft: 4 }}>{isOpen ? '▲' : '▼'}</div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const { dbUser } = useAuth();
  const [docs, setDocs] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkedItems, setCheckedItems] = useState(new Set());
  const [handoffNotes, setHandoffNotes] = useState('');
  const [savedNotes, setSavedNotes] = useState([]);
  const [showNotesPreview, setShowNotesPreview] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [toast, setToast] = useState('');
  const [toastUndo, setToastUndo] = useState(null);
  const [toastCountdown, setToastCountdown] = useState(8);
  const toastTimerRef = useRef(null);
  const countdownRef = useRef(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [docsOpen, setDocsOpen] = useState(true);
  const [contactsOpen, setContactsOpen] = useState(true);
  const [openDocCats, setOpenDocCats] = useState(new Set(DOC_CATEGORIES.map(c => c.id)));
  const [openContactCats, setOpenContactCats] = useState(new Set(CONTACT_CATEGORIES.map(c => c.id)));

  // ── FETCH DATA ─────────────────────────────────────────────
  useEffect(() => {
    if (!dbUser?.chapter_id) return;
    fetchData();
  }, [dbUser]);

  async function fetchData() {
    setLoading(true);
    const [docsRes, contactsRes, notesRes] = await Promise.all([
      supabase.from('documents').select('*').eq('chapter_id', dbUser.chapter_id).order('created_at', { ascending: false }),
      supabase.from('contacts').select('*').eq('chapter_id', dbUser.chapter_id).order('name'),
      supabase.from('handoff_notes').select('*').eq('chapter_id', dbUser.chapter_id).order('created_at', { ascending: false }),
    ]);

    if (docsRes.data) {
      setDocs(docsRes.data.map(d => ({
        id: d.id,
        name: d.name,
        desc: d.description || '',
        cat: d.category,
        date: d.created_at.split('T')[0],
        size: d.file_size || '—',
      })));
    }

    if (contactsRes.data) {
      setContacts(contactsRes.data.map(c => ({
        id: c.id,
        name: c.name,
        role: c.role || '',
        company: c.company || '',
        phone: c.phone || '',
        email: c.email || '',
        cat: c.category,
        desc: c.description || '',
      })));
    }

    if (notesRes.data) {
      setSavedNotes(notesRes.data.map(n => ({
        id: n.id,
        text: n.note_text,
        date: new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      })));
    }

    // Load checklist state
    const { data: checklistData } = await supabase
      .from('handoff_checklist')
      .select('item_id')
      .eq('chapter_id', dbUser.chapter_id);

    if (checklistData) {
      setCheckedItems(new Set(checklistData.map(r => r.item_id)));
    }

    setLoading(false);
  }

  async function saveChecklist(newCheckedItems) {
    await supabase.from('handoff_checklist')
      .delete()
      .eq('chapter_id', dbUser.chapter_id);

    if (newCheckedItems.size > 0) {
      await supabase.from('handoff_checklist')
        .insert(Array.from(newCheckedItems).map(item_id => ({
          chapter_id: dbUser.chapter_id,
          item_id,
        })));
    }
  }

  const checklistProgress = Math.round((checkedItems.size / HANDOFF_CHECKLIST.length) * 100);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  async function handleUpload(data) {
    const { data: newDoc, error } = await supabase
      .from('documents')
      .insert({
        chapter_id: dbUser.chapter_id,
        name: data.name,
        description: data.desc,
        category: data.cat,
        file_size: '—',
      })
      .select()
      .single();

    if (newDoc) {
      setDocs(prev => [{
        id: newDoc.id,
        name: newDoc.name,
        desc: newDoc.description || '',
        cat: newDoc.category,
        date: newDoc.created_at.split('T')[0],
        size: '—',
      }, ...prev]);
      showToast('Document uploaded successfully');
    }
  }

  async function handleSaveContact(data) {
    if (editingContact) {
      await supabase.from('contacts').update({
        name: data.name,
        role: data.role,
        company: data.company,
        phone: data.phone,
        email: data.email,
        category: data.cat,
        description: data.desc,
      }).eq('id', editingContact.id);
      setContacts(prev => prev.map(c => c.id === editingContact.id ? { ...data, id: editingContact.id } : c));
      showToast('Contact updated');
    } else {
      const { data: newContact, error } = await supabase
        .from('contacts')
        .insert({
          chapter_id: dbUser.chapter_id,
          name: data.name,
          role: data.role,
          company: data.company,
          phone: data.phone,
          email: data.email,
          category: data.cat,
          description: data.desc,
        })
        .select()
        .single();

      if (newContact) {
        setContacts(prev => [...prev, {
          id: newContact.id,
          name: newContact.name,
          role: newContact.role || '',
          company: newContact.company || '',
          phone: newContact.phone || '',
          email: newContact.email || '',
          cat: newContact.category,
          desc: newContact.description || '',
        }]);
        showToast('Contact added');
      }
    }
    setEditingContact(null);
  }

  async function handleDeleteDoc(id) {
    await supabase.from('documents').delete().eq('id', id);
    setDocs(prev => prev.filter(d => d.id !== id));
    setShowDeleteConfirm(null);
    showToast('Document deleted');
  }

  async function handleDeleteContact(id) {
    const deleted = contacts.find(c => c.id === id);
    setContacts(prev => prev.filter(c => c.id !== id));
    await supabase.from('contacts').delete().eq('id', id);
    setToast(`"${deleted.name}" deleted`);
    setToastUndo(() => async () => {
      const { data: restored } = await supabase.from('contacts').insert({
        chapter_id: dbUser.chapter_id,
        name: deleted.name,
        role: deleted.role,
        company: deleted.company,
        phone: deleted.phone,
        email: deleted.email,
        category: deleted.cat,
        description: deleted.desc,
      }).select().single();
      if (restored) {
        setContacts(prev => [...prev, { ...deleted, id: restored.id }]);
      }
    });
    setToastCountdown(8);
    clearTimeout(toastTimerRef.current);
    clearInterval(countdownRef.current);
    let secs = 8;
    countdownRef.current = setInterval(() => {
      secs--;
      setToastCountdown(secs);
      if (secs <= 0) clearInterval(countdownRef.current);
    }, 1000);
    toastTimerRef.current = setTimeout(() => { setToast(''); setToastUndo(null); }, 8000);
  }

  function toggleCheck(id) {
    setCheckedItems(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      saveChecklist(next);
      return next;
    });
  }

  function toggleDocCat(id) {
    setOpenDocCats(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleContactCat(id) {
    setOpenContactCats(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 32, color: '#0d1b2a', marginBottom: 12 }}>Drach<span style={{ color: '#c9a84c' }}>m</span>a</div>
        <div style={{ fontSize: 13, color: '#8a97a8' }}>Loading documents...</div>
      </div>
    </div>
  );

  return (
    <ProtectedRoute>
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f5f7fa', fontFamily: "'DM Sans', sans-serif" }}>
      <Sidebar activePage="documents" />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* TOPBAR */}
        <div style={{ padding: '20px 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#0d1b2a' }}>Documents</div>
            <div style={{ fontSize: 12, color: '#8a97a8', marginTop: 2 }}>Chapter records, contacts, and treasurer handoff</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setEditingContact(null); setShowContactModal(true); }} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #dce3eb', background: '#ffffff', color: '#0d1b2a', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
              + Add Contact
            </button>
            <button onClick={() => setShowUploadModal(true)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#0d1b2a', color: '#ffffff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              + Upload Document
            </button>
          </div>
        </div>

        {/* STAT CARDS */}
        <div style={{ padding: '16px 28px 0', flexShrink: 0 }}>
          <div className="stats-row">
            <StatCard label="DOCUMENTS"        value={String(docs.length)}      sub="In chapter library"  colorClass="blue" />
            <StatCard label="CONTACTS"         value={String(contacts.length)}  sub="In directory"        colorClass="gold" valueColor="#0d1b2a" />
            <StatCard label="HANDOFF PROGRESS" value={`${checklistProgress}%`} sub="Checklist complete"  colorClass={checklistProgress === 100 ? 'green' : 'red'} valueColor="#0d1b2a" />
            <StatCard label="RECENT UPLOADS"   value={String(docs.filter(d => new Date(d.date) > new Date('2026-03-01')).length)} sub="Last 30 days" colorClass="green" valueColor="#0d1b2a" />
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, display: 'flex', gap: 16, padding: '16px 28px 20px', overflow: 'hidden', minHeight: 0 }}>

          {/* LEFT — DOCUMENTS + CONTACTS STACKED */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', minWidth: 0 }}>

            {/* DOCUMENT LIBRARY */}
            <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #eef0f4', overflow: 'hidden', flexShrink: 0 }}>
              {/* Main Header */}
              <div
                onClick={() => setDocsOpen(o => !o)}
                style={{ padding: '14px 20px', borderBottom: docsOpen ? '1px solid #eef0f4' : 'none', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8f9fb'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ fontSize: 16 }}>📄</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0d1b2a', flex: 1 }}>Document Library</div>
                <div style={{ fontSize: 11, color: '#8a97a8' }}>{docs.length} documents</div>
                <div style={{ fontSize: 11, color: '#8a97a8' }}>{docsOpen ? '▲' : '▼'}</div>
              </div>

              {docsOpen && (
                <div>
                  {DOC_CATEGORIES.map(cat => {
                    const catDocs = docs.filter(d => d.cat === cat.id);
                    const isOpen = openDocCats.has(cat.id);
                    return (
                      <div key={cat.id}>
                        <SectionHeader
                          title={`${cat.icon} ${cat.label}`}
                          count={`${catDocs.length} ${catDocs.length === 1 ? 'doc' : 'docs'}`}
                          color={cat.color}
                          isOpen={isOpen}
                          onToggle={() => toggleDocCat(cat.id)}
                          action={cat.id === 'access' && (
                            <div style={{ fontSize: 10, color: '#8b5e0a', background: '#fff8ee', padding: '2px 8px', borderRadius: 100, border: '1px solid rgba(245,166,35,0.3)', fontWeight: 600 }}>
                              ⚠ References only
                            </div>
                          )}
                        />
                        {isOpen && (
                          <div>
                            {catDocs.length === 0 ? (
                              <div style={{ padding: '12px 20px', fontSize: 12, color: '#8a97a8', fontStyle: 'italic' }}>No documents in this category yet</div>
                            ) : catDocs.map(doc => (
                              <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid #f3f5f8', transition: 'background 0.1s' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#f8f9fb'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              >
                                <div style={{ fontSize: 20, flexShrink: 0 }}>📄</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 13, fontWeight: 500, color: '#0d1b2a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.name}</div>
                                  {doc.desc && <div style={{ fontSize: 11, color: '#8a97a8', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.desc}</div>}
                                  <div style={{ fontSize: 10, color: '#c0c8d0', marginTop: 2 }}>Added {formatDate(doc.date)} · {doc.size}</div>
                                </div>
                                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                  <button onClick={() => showToast('Downloading...')} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #dce3eb', background: '#ffffff', fontSize: 11, fontWeight: 600, color: '#0d1b2a', cursor: 'pointer', fontFamily: 'inherit' }}>⬇ Download</button>
                                  <button onClick={() => setShowDeleteConfirm(doc.id)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #eef0f4', background: '#ffffff', cursor: 'pointer', fontSize: 12, color: '#e05c5c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div style={{ padding: '10px 20px', borderTop: '1px solid #eef0f4', fontSize: 12, color: '#8a97a8' }}>
                    {docs.length} total documents
                  </div>
                </div>
              )}
            </div>

            {/* CONTACTS */}
            <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #eef0f4', overflow: 'hidden', flexShrink: 0 }}>
              {/* Main Header */}
              <div
                onClick={() => setContactsOpen(o => !o)}
                style={{ padding: '14px 20px', borderBottom: contactsOpen ? '1px solid #eef0f4' : 'none', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8f9fb'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ fontSize: 16 }}>📞</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0d1b2a', flex: 1 }}>Contacts</div>
                <div style={{ fontSize: 11, color: '#8a97a8' }}>{contacts.length} contacts</div>
                <div style={{ fontSize: 11, color: '#8a97a8' }}>{contactsOpen ? '▲' : '▼'}</div>
              </div>

              {contactsOpen && (
                <div>
                  {CONTACT_CATEGORIES.map(cat => {
                    const catContacts = contacts.filter(c => c.cat === cat.id);
                    const isOpen = openContactCats.has(cat.id);
                    return (
                      <div key={cat.id}>
                        <SectionHeader
                          title={`${cat.icon} ${cat.label}`}
                          count={`${catContacts.length} ${catContacts.length === 1 ? 'contact' : 'contacts'}`}
                          color={cat.color}
                          isOpen={isOpen}
                          onToggle={() => toggleContactCat(cat.id)}
                        />
                        {isOpen && (
                          <div>
                            {catContacts.length === 0 ? (
                              <div style={{ padding: '12px 20px', fontSize: 12, color: '#8a97a8', fontStyle: 'italic' }}>No contacts in this category yet</div>
                            ) : catContacts.map(contact => (
                              <div key={contact.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid #f3f5f8', transition: 'background 0.1s' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#f8f9fb'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              >
                                <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg, ${cat.color}, ${cat.color}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#ffffff', flexShrink: 0 }}>
                                  {contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 13, fontWeight: 500, color: '#0d1b2a' }}>{contact.name}</div>
                                  {(contact.role || contact.company) && (
                                    <div style={{ fontSize: 11, color: '#8a97a8', marginTop: 1 }}>{[contact.role, contact.company].filter(Boolean).join(' · ')}</div>
                                  )}
                                  {contact.desc && <div style={{ fontSize: 11, color: '#8a97a8', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{contact.desc}</div>}
                                  <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                                    {contact.phone && <div style={{ fontSize: 11, color: '#4a90d9' }}>📞 {contact.phone}</div>}
                                    {contact.email && <div style={{ fontSize: 11, color: '#4a90d9' }}>✉ {contact.email}</div>}
                                  </div>
                                </div>
                                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                  <button onClick={() => { setEditingContact(contact); setShowContactModal(true); }} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #eef0f4', background: '#ffffff', cursor: 'pointer', fontSize: 12, color: '#8a97a8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✎</button>
                                  <button onClick={() => handleDeleteContact(contact.id)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #eef0f4', background: '#ffffff', cursor: 'pointer', fontSize: 12, color: '#e05c5c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div style={{ padding: '10px 20px', borderTop: '1px solid #eef0f4', fontSize: 12, color: '#8a97a8' }}>
                    {contacts.length} total contacts
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* RIGHT — TREASURER HANDOFF */}
          <div style={{ width: 340, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', flexShrink: 0 }}>

            {/* NOTES TO INCOMING TREASURER */}
            <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #eef0f4', padding: 16, flexShrink: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#0d1b2a', marginBottom: 6 }}>Notes to Incoming Treasurer</div>
              <div style={{ fontSize: 11, color: '#8a97a8', marginBottom: 10, lineHeight: 1.5 }}>
                Leave context on open items, upcoming deadlines, or anything the next treasurer should know.
              </div>
              <textarea
                value={handoffNotes}
                onChange={e => setHandoffNotes(e.target.value)}
                placeholder="e.g. The Spring Formal venue deposit is due April 1st — make sure to follow up with Grand Ballroom. Housing payment auto-drafts on the 1st of each month..."
                style={{
                  width: '100%', minHeight: 110, padding: '10px 12px', borderRadius: 8,
                  border: '1px solid #dce3eb', fontSize: 12, color: '#0d1b2a',
                  fontFamily: 'inherit', outline: 'none', resize: 'vertical',
                  boxSizing: 'border-box', lineHeight: 1.6, background: '#ffffff',
                }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button
                  onClick={async () => {
                    if (!handoffNotes.trim()) return;
                    const { data: newNote } = await supabase
                      .from('handoff_notes')
                      .insert({
                        chapter_id: dbUser.chapter_id,
                        note_text: handoffNotes.trim(),
                        created_by: dbUser.id,
                      })
                      .select()
                      .single();
                    if (newNote) {
                      setSavedNotes(prev => [{
                        id: newNote.id,
                        text: newNote.note_text,
                        date: new Date(newNote.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                      }, ...prev]);
                      setHandoffNotes('');
                      setShowNotesPreview(true);
                      showToast('✓ Note saved!');
                    }
                  }}
                  style={{ padding: '7px 14px', borderRadius: 7, border: 'none', background: '#0d1b2a', color: '#ffffff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                >Save Note</button>
                {savedNotes.length > 0 && (
                  <button
                    onClick={() => setShowNotesPreview(o => !o)}
                    style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid #dce3eb', background: '#ffffff', color: '#0d1b2a', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
                  >{showNotesPreview ? 'Hide' : `View Saved (${savedNotes.length})`}</button>
                )}
              </div>

              {/* SAVED NOTES PREVIEW */}
              {showNotesPreview && savedNotes.length > 0 && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {savedNotes.map(note => (
                    <div key={note.id} style={{ padding: '10px 12px', background: '#f8f9fb', borderRadius: 8, border: '1px solid #eef0f4' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: '#8a97a8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{note.date}</div>
                        <button
                          onClick={async () => {
                            await supabase.from('handoff_notes').delete().eq('id', note.id);
                            setSavedNotes(prev => prev.filter(n => n.id !== note.id));
                          }}
                          style={{ background: 'none', border: 'none', color: '#e05c5c', cursor: 'pointer', fontSize: 13, padding: 0, lineHeight: 1 }}
                        >✕</button>
                      </div>
                      <div style={{ fontSize: 12, color: '#0d1b2a', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{note.text}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* HANDOFF CHECKLIST */}
            <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #eef0f4', overflow: 'hidden', flexShrink: 0 }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #eef0f4' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#0d1b2a' }}>Handoff Checklist</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: checklistProgress === 100 ? '#1a7a52' : '#8a97a8' }}>{checkedItems.size}/{HANDOFF_CHECKLIST.length}</div>
                </div>
                <div style={{ height: 4, background: '#eef0f4', borderRadius: 100, overflow: 'hidden' }}>
                  <div style={{ width: `${checklistProgress}%`, height: '100%', background: checklistProgress === 100 ? '#2ecc8a' : '#c9a84c', borderRadius: 100, transition: 'width 0.3s ease' }} />
                </div>
              </div>
              <div>
                {HANDOFF_CHECKLIST.map((item, i) => {
                  const isChecked = checkedItems.has(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleCheck(item.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                        borderBottom: i < HANDOFF_CHECKLIST.length - 1 ? '1px solid #f3f5f8' : 'none',
                        cursor: 'pointer', background: isChecked ? '#f0fdf6' : 'transparent', transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => { if (!isChecked) e.currentTarget.style.background = '#f8f9fb'; }}
                      onMouseLeave={e => { if (!isChecked) e.currentTarget.style.background = isChecked ? '#f0fdf6' : 'transparent'; }}
                    >
                      <div style={{
                        width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                        border: `2px solid ${isChecked ? '#2ecc8a' : '#dce3eb'}`,
                        background: isChecked ? '#2ecc8a' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                      }}>
                        {isChecked && <div style={{ color: '#ffffff', fontSize: 11, fontWeight: 700 }}>✓</div>}
                      </div>
                      <div style={{ fontSize: 12, color: isChecked ? '#8a97a8' : '#0d1b2a', textDecoration: isChecked ? 'line-through' : 'none', transition: 'all 0.15s' }}>
                        {item.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* GENERATE HANDOFF PACKAGE */}
            <div style={{ background: '#0d1b2a', borderRadius: 12, padding: 16, flexShrink: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#ffffff', marginBottom: 6 }}>📦 Treasurer Handoff Package</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 14, lineHeight: 1.5 }}>
                Bundles all documents, contacts, your checklist, and notes into a single package for the incoming treasurer.
              </div>
              {checklistProgress < 100 && (
                <div style={{ padding: '8px 12px', background: 'rgba(245,166,35,0.15)', border: '1px solid rgba(245,166,35,0.3)', borderRadius: 8, fontSize: 11, color: '#f5a623', marginBottom: 12 }}>
                  ⚠ {HANDOFF_CHECKLIST.length - checkedItems.size} checklist items remaining
                </div>
              )}
              <button
                onClick={() => showToast('Handoff package coming soon!')}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: '#c9a84c', color: '#0d1b2a', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Generate & Send Package
              </button>
            </div>

          </div>
        </div>
      </main>

      {/* MODALS */}
      {showUploadModal && <UploadModal onClose={() => setShowUploadModal(false)} onSave={handleUpload} />}
      {showContactModal && (
        <AddContactModal
          onClose={() => { setShowContactModal(false); setEditingContact(null); }}
          onSave={handleSaveContact}
          existing={editingContact}
        />
      )}

      {/* DELETE CONFIRM */}
      {showDeleteConfirm && (
        <div onClick={e => { if (e.target === e.currentTarget) setShowDeleteConfirm(null); }} style={{ position: 'fixed', inset: 0, background: 'rgba(13,27,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#ffffff', borderRadius: 16, padding: 28, width: 380, boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#0d1b2a', marginBottom: 8 }}>Delete this document?</div>
            <div style={{ fontSize: 13, color: '#8a97a8', marginBottom: 24, lineHeight: 1.6 }}>This will permanently remove the document from the chapter library. This cannot be undone.</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowDeleteConfirm(null)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #dce3eb', background: '#ffffff', color: '#0d1b2a', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={() => handleDeleteDoc(showDeleteConfirm)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#e05c5c', color: '#ffffff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          background: '#0d1b2a', color: '#ffffff', padding: '14px 18px',
          borderRadius: 12, fontSize: 13, fontWeight: 500, zIndex: 200,
          display: 'flex', alignItems: 'center', gap: 16,
          boxShadow: '0 8px 40px rgba(0,0,0,0.35)', minWidth: 320,
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <span style={{ flex: 1 }}>{toast}</span>
          {toastUndo && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', width: 14, textAlign: 'center' }}>{toastCountdown}</span>
              <button onClick={() => { toastUndo(); setToast(''); setToastUndo(null); clearTimeout(toastTimerRef.current); clearInterval(countdownRef.current); }} style={{ background: '#c9a84c', border: 'none', color: '#0d1b2a', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: '5px 12px', borderRadius: 6 }}>Undo</button>
            </div>
          )}
          <button onClick={() => { setToast(''); setToastUndo(null); clearTimeout(toastTimerRef.current); clearInterval(countdownRef.current); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 14, padding: 0 }}>✕</button>
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