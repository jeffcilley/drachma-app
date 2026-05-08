'use client';

import { useState } from 'react';
import Sidebar from '../components/Sidebar';

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

const RECENT_SCANS = [
  { id: 1, desc: 'Venue Deposit — Spring Formal', amount: 1200, date: '2026-03-28', cat: 'social', status: 'saved' },
  { id: 2, desc: 'Chapter Meeting Dinner',        amount: 340,  date: '2026-03-25', cat: 'ops',    status: 'saved' },
  { id: 3, desc: 'Rush Food & Drinks',            amount: 400,  date: '2026-03-20', cat: 'recruit',status: 'saved' },
  { id: 4, desc: 'Office Supplies',               amount: 85,   date: '2026-03-18', cat: 'ops',    status: 'saved' },
  { id: 5, desc: 'DJ Deposit — Spring Formal',    amount: 600,  date: '2026-03-15', cat: 'social', status: 'saved' },
];

const MOCK_AI_RESULT = {
  desc: 'Campus Party Supplies Co.',
  amount: '284.50',
  date: new Date().toISOString().split('T')[0],
  cat: 'social',
  notes: 'Receipt #4821',
};

// Which fields the AI was uncertain about
const LOW_CONFIDENCE_FIELDS = ['amount', 'cat'];

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const inputStyle = {
  padding: '8px 12px', borderRadius: 8, border: '1px solid #dce3eb',
  fontSize: 13, color: '#0d1b2a', fontFamily: 'inherit', outline: 'none',
  background: '#ffffff', width: '100%', boxSizing: 'border-box',
};

const inputLowStyle = {
  ...inputStyle,
  border: '1px solid #f5a623',
  background: '#fffbf2',
};

const selectStyle = { ...inputStyle, cursor: 'pointer' };
const selectLowStyle = { ...inputLowStyle, cursor: 'pointer' };

export default function ScannerPage() {
  const [stage, setStage] = useState('upload');
  const [dragOver, setDragOver] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [form, setForm] = useState(MOCK_AI_RESULT);
  const [recentScans, setRecentScans] = useState(RECENT_SCANS);
  const [savedTx, setSavedTx] = useState(null);
  const [showDiscard, setShowDiscard] = useState(false);

  const totalScanned = recentScans.reduce((sum, s) => sum + s.amount, 0);
  const isLowConfidence = LOW_CONFIDENCE_FIELDS.length > 0;

  function handleFile(file) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setUploadedImage(url);
    setStage('scanning');
    setTimeout(() => {
      setForm(MOCK_AI_RESULT);
      setStage('review');
    }, 2000);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }

  function handleFileInput(e) {
    handleFile(e.target.files[0]);
  }

  function handleSave() {
    const newScan = {
      id: recentScans.length + 1,
      desc: form.desc,
      amount: parseFloat(form.amount),
      date: form.date,
      cat: form.cat,
      status: 'saved',
    };
    setSavedTx(newScan);
    setRecentScans(prev => [newScan, ...prev]);
    setStage('success');
  }

  function handleReset() {
    setStage('upload');
    setUploadedImage(null);
    setForm(MOCK_AI_RESULT);
    setSavedTx(null);
    setShowDiscard(false);
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f5f7fa', fontFamily: "'DM Sans', sans-serif" }}>
      <Sidebar activePage="scanner" />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* TOPBAR */}
        <div style={{ padding: '20px 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#0d1b2a' }}>Receipt Scanner</div>
            <div style={{ fontSize: 12, color: '#8a97a8', marginTop: 2 }}>Upload a receipt and AI will extract the details</div>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, display: 'flex', gap: 16, padding: '20px 28px', overflow: 'hidden', minHeight: 0 }}>

          {/* LEFT — MAIN */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>

            {/* UPLOAD STAGE */}
            {stage === 'upload' && (
              <div style={{ flex: 1, background: '#ffffff', borderRadius: 12, border: '1px solid #eef0f4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('fileInput').click()}
                  style={{
                    width: '100%', maxWidth: 480, border: `2px dashed ${dragOver ? '#c9a84c' : '#dce3eb'}`,
                    borderRadius: 16, padding: '60px 40px', textAlign: 'center', cursor: 'pointer',
                    background: dragOver ? '#fdf8ee' : '#f8f9fb', transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🧾</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#0d1b2a', marginBottom: 8 }}>
                    Drop your receipt here
                  </div>
                  <div style={{ fontSize: 13, color: '#8a97a8', marginBottom: 24, lineHeight: 1.6 }}>
                    Or click to browse — supports JPG, PNG, and PDF
                  </div>
                  <div style={{
                    display: 'inline-block', padding: '10px 24px', borderRadius: 8,
                    background: '#0d1b2a', color: '#ffffff', fontSize: 13, fontWeight: 600,
                  }}>
                    Choose File
                  </div>
                  <input
                    id="fileInput"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileInput}
                    style={{ display: 'none' }}
                  />
                </div>

                <div style={{ marginTop: 40, display: 'flex', gap: 32, textAlign: 'center' }}>
                  {[
                    { icon: '📤', title: 'Upload', desc: 'Drop or select your receipt image' },
                    { icon: '🤖', title: 'AI Reads It', desc: 'Claude extracts vendor, amount & date' },
                    { icon: '✅', title: 'Confirm & Save', desc: 'Review, edit if needed, then save' },
                  ].map(step => (
                    <div key={step.title} style={{ maxWidth: 140 }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>{step.icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0d1b2a', marginBottom: 4 }}>{step.title}</div>
                      <div style={{ fontSize: 11, color: '#8a97a8', lineHeight: 1.5 }}>{step.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SCANNING STAGE */}
            {stage === 'scanning' && (
              <div style={{ flex: 1, background: '#ffffff', borderRadius: 12, border: '1px solid #eef0f4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
                <div style={{ fontSize: 48 }}>🤖</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#0d1b2a' }}>Reading your receipt...</div>
                <div style={{ fontSize: 13, color: '#8a97a8' }}>Claude is extracting the details</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 8, height: 8, borderRadius: '50%', background: '#c9a84c',
                      animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
                <style>{`
                  @keyframes pulse {
                    0%, 100% { opacity: 0.3; transform: scale(0.8); }
                    50% { opacity: 1; transform: scale(1.2); }
                  }
                `}</style>
              </div>
            )}

            {/* REVIEW STAGE */}
            {stage === 'review' && (
              <div style={{ flex: 1, display: 'flex', gap: 16, minHeight: 0 }}>

                {/* Receipt Preview */}
                <div style={{ width: 280, background: '#ffffff', borderRadius: 12, border: '1px solid #eef0f4', overflow: 'hidden', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #eef0f4', fontSize: 12, fontWeight: 600, color: '#0d1b2a' }}>Receipt Preview</div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: '#f8f9fb' }}>
                    {uploadedImage ? (
                      <img src={uploadedImage} alt="Receipt" style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                    ) : (
                      <div style={{ fontSize: 64 }}>🧾</div>
                    )}
                  </div>
                </div>

                {/* Review Form */}
                <div style={{ flex: 1, background: '#ffffff', borderRadius: 12, border: '1px solid #eef0f4', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '12px 20px', borderBottom: '1px solid #eef0f4', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: isLowConfidence ? '#f5a623' : '#2ecc8a' }} />
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#0d1b2a' }}>
                      {isLowConfidence ? 'AI extracted these details — some fields need review' : 'AI extracted these details — review and confirm'}
                    </div>
                  </div>

                  <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                      {/* Description */}
                      <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 500, color: '#0d1b2a' }}>Description</label>
                        <input
                          style={LOW_CONFIDENCE_FIELDS.includes('desc') ? inputLowStyle : inputStyle}
                          value={form.desc}
                          onChange={e => setForm(f => ({ ...f, desc: e.target.value }))}
                        />
                        {LOW_CONFIDENCE_FIELDS.includes('desc') && (
                          <span style={{ fontSize: 11, color: '#f5a623' }}>⚠ AI wasn't sure about this field</span>
                        )}
                      </div>

                      {/* Amount */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 500, color: '#0d1b2a' }}>Amount ($)</label>
                        <input
                          style={LOW_CONFIDENCE_FIELDS.includes('amount') ? inputLowStyle : inputStyle}
                          type="number"
                          value={form.amount}
                          onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                        />
                        {LOW_CONFIDENCE_FIELDS.includes('amount') && (
                          <span style={{ fontSize: 11, color: '#f5a623' }}>⚠ AI wasn't sure about this field</span>
                        )}
                      </div>

                      {/* Date */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 500, color: '#0d1b2a' }}>Date</label>
                        <input
                          style={LOW_CONFIDENCE_FIELDS.includes('date') ? inputLowStyle : inputStyle}
                          type="date"
                          value={form.date}
                          onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                        />
                        {LOW_CONFIDENCE_FIELDS.includes('date') && (
                          <span style={{ fontSize: 11, color: '#f5a623' }}>⚠ AI wasn't sure about this field</span>
                        )}
                      </div>

                      {/* Category */}
                      <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 500, color: '#0d1b2a' }}>Category</label>
                        <select
                          style={LOW_CONFIDENCE_FIELDS.includes('cat') ? selectLowStyle : selectStyle}
                          value={form.cat}
                          onChange={e => setForm(f => ({ ...f, cat: e.target.value }))}
                        >
                          {Object.entries(CATEGORIES).map(([k, v]) => (
                            <option key={k} value={k}>{v.name}</option>
                          ))}
                        </select>
                        {LOW_CONFIDENCE_FIELDS.includes('cat') && (
                          <span style={{ fontSize: 11, color: '#f5a623' }}>⚠ AI wasn't sure about this field</span>
                        )}
                      </div>

                      {/* Notes */}
                      <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 500, color: '#0d1b2a' }}>Notes (optional)</label>
                        <input
                          style={inputStyle}
                          value={form.notes}
                          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                          placeholder="Any additional details..."
                        />
                      </div>

                    </div>

                    {/* Confidence Banner */}
                    {isLowConfidence ? (
                      <div style={{ background: '#fffbf2', border: '1px solid rgba(245,166,35,0.3)', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14 }}>⚠️</span>
                        <span style={{ fontSize: 12, color: '#8b5e0a' }}>AI confidence: <strong>Medium</strong> — please review the highlighted fields before saving</span>
                      </div>
                    ) : (
                      <div style={{ background: '#f0fdf6', border: '1px solid rgba(46,204,138,0.2)', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14 }}>✨</span>
                        <span style={{ fontSize: 12, color: '#1a7a52' }}>AI confidence: <strong>High</strong> — all fields extracted successfully</span>
                      </div>
                    )}
                  </div>

                  <div style={{ padding: '16px 20px', borderTop: '1px solid #eef0f4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <button onClick={() => setShowDiscard(true)} style={{ background: 'none', border: 'none', color: '#8a97a8', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>← Upload different receipt</button>
                      <span style={{ color: '#dce3eb' }}>|</span>
                      <button onClick={() => setShowDiscard(true)} style={{ background: 'none', border: 'none', color: '#e05c5c', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>🗑 Discard</button>
                    </div>
                    <button onClick={handleSave} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#0d1b2a', color: '#ffffff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Confirm & Save Transaction
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SUCCESS STAGE */}
            {stage === 'success' && (
              <div style={{ flex: 1, background: '#ffffff', borderRadius: 12, border: '1px solid #eef0f4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 40 }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#e8f5ee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>✅</div>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#0d1b2a' }}>Transaction Saved!</div>
                <div style={{ fontSize: 13, color: '#8a97a8', textAlign: 'center', maxWidth: 340, lineHeight: 1.6 }}>
                  <strong style={{ color: '#0d1b2a' }}>{savedTx?.desc}</strong> for <strong style={{ color: '#0d1b2a' }}>${savedTx?.amount}</strong> has been logged as a verified transaction with the receipt attached.
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button onClick={handleReset} style={{ padding: '10px 24px', borderRadius: 8, border: '1px solid #dce3eb', background: '#ffffff', color: '#0d1b2a', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Scan Another
                  </button>
                  <a href="/transactions" style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#0d1b2a', color: '#ffffff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                    View Transactions →
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — RECENT SCANS */}
          <div style={{ width: 300, background: '#ffffff', borderRadius: 12, border: '1px solid #eef0f4', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #eef0f4', fontSize: 12, fontWeight: 600, color: '#0d1b2a' }}>
              Recent Scans
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {recentScans.map(scan => {
                const cat = CATEGORIES[scan.cat];
                return (
                  <div key={scan.id} style={{ padding: '12px 16px', borderBottom: '1px solid #f3f5f8', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f8f9fb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🧾</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: '#0d1b2a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{scan.desc}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 10, color: '#8a97a8' }}>{cat.name} · {formatDate(scan.date)}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0d1b2a', flexShrink: 0 }}>${scan.amount.toLocaleString()}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ padding: '12px 16px', borderTop: '1px solid #eef0f4', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#8a97a8' }}>{recentScans.length} receipts scanned</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#0d1b2a' }}>${totalScanned.toLocaleString()}</span>
              </div>
              <div style={{ fontSize: 10, color: '#8a97a8', marginTop: 2 }}>total this semester</div>
            </div>
          </div>

        </div>
      </main>

      {/* DISCARD CONFIRMATION MODAL */}
      {showDiscard && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,27,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#ffffff', borderRadius: 16, padding: 28, width: 380, boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#0d1b2a', marginBottom: 8 }}>Discard this scan?</div>
            <div style={{ fontSize: 13, color: '#8a97a8', marginBottom: 24, lineHeight: 1.6 }}>
              This will discard the uploaded receipt and all extracted data. This cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowDiscard(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #dce3eb', background: '#ffffff', color: '#0d1b2a', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
              <button onClick={handleReset} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#e05c5c', color: '#ffffff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Yes, Discard
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}