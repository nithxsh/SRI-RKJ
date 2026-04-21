import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, setDoc, query, orderBy, deleteDoc } from 'firebase/firestore';
import emailjs from '@emailjs/browser';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import '../index.css';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

const STATUS_COLORS = {
  pending:   { bg: 'rgba(212,175,55,0.15)',  color: '#D4AF37', label: '⏳ Pending' },
  waiting_verification: { bg: 'rgba(255,165,0,0.15)', color: '#FFA500', label: '💳 Pay Pending' },
  confirmed: { bg: 'rgba(32,178,170,0.15)',  color: '#20B2AA', label: '✅ Confirmed' },
  completed: { bg: 'rgba(100,220,100,0.15)', color: '#6fc96f', label: '✔ Completed' },
  cancelled: { bg: 'rgba(234,67,53,0.12)',   color: '#EA4335', label: '✕ Cancelled' },
};

export default function AdminPanel() {
  const { currentUser } = useAuth();
  const [bookings, setBookings]             = useState([]);
  const [loading, setLoading]               = useState(true);
  const [activeTab, setActiveTab]           = useState('bookings');
  const [filter, setFilter]                 = useState('all');
  const [search, setSearch]                 = useState('');
  const [updatingId, setUpdatingId]         = useState(null);
  const [confirmDates, setConfirmDates]     = useState({});
  const [notes, setNotes]                   = useState({});
  const [savingNote, setSavingNote]         = useState({});
  const [reviews, setReviews]               = useState([]);
  const [userTokens, setUserTokens]         = useState({});
  const [dateFilter, setDateFilter]         = useState('');

  useEffect(() => { 
    if (currentUser?.email === ADMIN_EMAIL) fetchData(); 
  }, [currentUser]);

  async function fetchData() {
    setLoading(true);
    try {
      const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setBookings(data);
      
      const cPrefill = {};
      data.forEach(b => { if (b.confirmedDate) cPrefill[b.id] = { date: b.confirmedDate, slot: b.confirmedSlot || '' }; });
      setConfirmDates(cPrefill);
      
      const nSnap = await getDocs(collection(db, 'adminNotes'));
      const nData = {}; nSnap.forEach(d => nData[d.id] = d.data().content);
      setNotes(nData);
      
      const rSnap = await getDocs(query(collection(db, 'reviews'), orderBy('createdAt', 'desc')));
      setReviews(rSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      
      const uSnap = await getDocs(collection(db, 'users'));
      const tokens = {}; uSnap.forEach(d => { if(d.data().fcmToken) tokens[d.id] = d.data().fcmToken; });
      setUserTokens(tokens);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  async function updateStatus(id, status) {
    setUpdatingId(id);
    try { 
      await updateDoc(doc(db, 'bookings', id), { status }); 
      setBookings(p => p.map(x => x.id === id ? { ...x, status } : x)); 
    } catch(e){console.error(e)} finally{setUpdatingId(null)}
  }

  async function verifyPayment(b) {
    setUpdatingId(b.id);
    try { 
      await updateDoc(doc(db, 'bookings', b.id), { paymentStatus: 'verified' }); 
      setBookings(p => p.map(x => x.id === b.id ? { ...x, paymentStatus: 'verified' } : x)); 
    } catch(e){console.error(e)} finally{setUpdatingId(null)}
  }

  async function saveNote(id) {
    setSavingNote(p => ({ ...p, [id]: true }));
    try { await setDoc(doc(db, 'adminNotes', id), { content: notes[id] || '', updatedAt: new Date().toISOString() }, { merge: true }); }
    catch(e){console.error(e)} finally{setTimeout(() => setSavingNote(p => ({ ...p, [id]: false })), 800)}
  }

  // ── Communication Helpers ───────────────────────────────────────────
  const sendWhatsApp = (b) => {
    // Priority: 1. Current input state (unsaved) 2. Confirmed DB state 3. Preferred state
    const currentInput = confirmDates[b.id] || {};
    const dateStr = currentInput.date || b.confirmedDate || b.preferredDate;
    const slotStr = currentInput.slot || b.confirmedSlot || b.preferredSlot;

    // Detect consultation mode
    const isOnline = b.category?.toLowerCase().includes('online') || b.purpose?.toLowerCase().includes('online');
    const isOffline = b.category?.toLowerCase().includes('offline') || b.purpose?.toLowerCase().includes('offline') || b.category?.toLowerCase().includes('vaasthu');
    
    let msg = "";

    if (isOnline) {
      msg = `\u0950 *OM NAMO NARAYANAYA* \u0950\n\nNamaste *${b.name}* ji, this is from the *Shri Namo Narayanaya Astrology Office*. \uD83D\uDE4F\n\n\u2605 *ONLINE CONSULTATION CONFIRMED* \u2605\n━━━━━━━━━━━━━━━━━━━━\n\u25CF *Service:* ${b.category}\n\u25CF *Date:* ${dateStr}\n\u25CF *Slot:* ${slotStr}\n\u25CF *Mode:* WhatsApp Video / Call\n━━━━━━━━━━━━━━━━━━━━\n\n\uD83D\uDCDD *Instructions:*\n- Please be in a quiet space with good network.\n- Keep your *Birth Details* ready for reference.\n- Our Acharya will connect with you at your chosen time.\n\nMay divine light guide your path! \u0950 \u2728`;
    } else if (isOffline) {
      msg = `\u0950 *OM NAMO NARAYANAYA* \u0950\n\nNamaste *${b.name}* ji, this is from the *Shri Namo Narayanaya Astrology Office*. \uD83D\uDE4F\n\n\u0950 *OFFICE VISIT CONFIRMED* \u0950\n━━━━━━━━━━━━━━━━━━━━\n\u25CF *Service:* ${b.category}\n\u25CF *Date:* ${dateStr}\n\u25CF *Slot:* ${slotStr}\n\u25CF *Location:* Mailpatti Office\n━━━━━━━━━━━━━━━━━━━━\n\n\u25CF *Address:* Shri Namo Narayanaya Office, Near Gudiyattam, Vellore (635805).\n\n\uD83D\uDCDD *Note:* Please arrive 10-15 minutes prior to your slot. We look forward to your visit! \uD83D\uDE4F\u2728`;
    } else {
      msg = `\u0950 *OM NAMO NARAYANAYA* \u0950\n\nNamaste *${b.name}* ji, this is from the *Shri Namo Narayanaya Astrology Office*. \uD83D\uDE4F\n\n\u2605 *CONSULTATION UPDATE* \u2605\n━━━━━━━━━━━━━━━━━━━━\n\u25CF *Service:* ${b.category}\n\u25CF *Date:* ${dateStr}\n\u25CF *Status:* Awaiting Action\n━━━━━━━━━━━━━━━━━━━━\n\nWe are looking forward to guiding you on your divine journey. How can we assist you today? \u2728`;
    }

    // Clean phone number (Ensure it has 91 if it's a 10-digit Indian number)
    let phone = b.mobile.replace(/\D/g, '');
    if (phone.length === 10) phone = '91' + phone;
    
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const sendEmail = (b) => {
    window.location.href = `mailto:${b.email}?subject=Consultation Update - Shri Namo Narayanaya&body=Namaste ${b.name},`;
  };

  const makeCall = (b) => {
    window.location.href = `tel:${b.mobile}`;
  };

  const sendPush = async (b) => {
    const token = userTokens[b.userId];
    if (!token) return alert('Seeker has not enabled notifications.');
    alert('Sending push notification to seeker...');
    // Real FCM trigger logic would go here
  };

  const counts = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  };

  // Group bookings by date for the calendar
  const dailyStats = {};
  bookings.forEach(b => {
    const d = b.confirmedDate || b.preferredDate;
    if (!d) return;
    if (!dailyStats[d]) dailyStats[d] = { total: 0, done: 0 };
    dailyStats[d].total++;
    if (b.status === 'completed') dailyStats[d].done++;
  });

  const sortedDates = Object.keys(dailyStats).sort();

  const filtered = bookings.filter(b => {
    const mf = filter === 'all' 
      ? (b.status === 'pending' || b.status === 'confirmed') 
      : (filter === 'payments' ? b.paymentStatus === 'waiting_verification' : b.status === filter);
    const ms = !search || b.name?.toLowerCase().includes(search.toLowerCase()) || b.mobile?.includes(search);
    const md = !dateFilter || (b.confirmedDate === dateFilter || b.preferredDate === dateFilter);
    return mf && ms && md;
  });

  const tabStyle = (t) => ({ padding: '0.8rem 1.5rem', borderRadius: '10px', border: 'none', cursor: 'pointer', background: activeTab === t ? 'var(--accent-gold)' : 'rgba(255,255,255,0.05)', color: activeTab === t ? '#000' : 'white', fontWeight: 700 });

  if (currentUser?.email !== ADMIN_EMAIL) return <div style={{paddingTop:'150px', textAlign:'center', color:'#EA4335'}}>🚫 Access Denied</div>;

  return (
    <section style={{ paddingTop: '120px', minHeight: '80vh', paddingBottom: '4rem' }} className="container">
      {/* Header */}
      <div className="glass-panel" style={{ padding: '2.5rem', marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent-gold)', fontSize: '2.2rem', margin: 0 }}>🛡 Command Center</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Vedic Astrology & Vaasthu Administration</p>
        </div>
        <button onClick={fetchData} className="btn-secondary">🔄 Refresh</button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {[
          ['all', '📋', 'All', counts.total],
          ['pending', '⏳', 'Pending', counts.pending],
          ['completed', '✅', 'Completed', counts.completed],
          ['cancelled', '✕', 'Cancelled', counts.cancelled]
        ].map(([key, icon, label, val]) => (
          <div key={key} onClick={() => { setFilter(key); setDateFilter(''); }} className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', cursor: 'pointer', border: filter === key ? '2px solid var(--accent-gold)' : '1px solid transparent', flex: 1 }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{icon}</div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'white' }}>{val}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Daily Performance Calendar */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--accent-gold)' }}>📅 Daily Summary (Calendar)</h3>
          {dateFilter && <button onClick={() => setDateFilter('')} style={{ background: 'none', border: 'none', color: 'var(--accent-teal)', fontSize: '0.8rem', cursor: 'pointer' }}>Show All Dates</button>}
        </div>
        <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '10px' }} className="custom-scroll">
          {sortedDates.length === 0 ? <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No scheduled bookings found.</p> : 
           sortedDates.map(date => (
            <div 
              key={date} 
              onClick={() => { setDateFilter(date); setFilter('all'); }}
              style={{ 
                minWidth: '130px', 
                background: date === dateFilter ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.03)', 
                border: `1px solid ${date === dateFilter ? 'var(--accent-gold)' : 'rgba(255,255,255,0.1)'}`, 
                padding: '1rem', 
                borderRadius: '12px', 
                textAlign: 'center', 
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white', marginBottom: '0.5rem' }}>{new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                <span title="Total" style={{ fontSize: '0.75rem', background: 'rgba(32,178,170,0.15)', color: 'var(--accent-teal)', padding: '2px 6px', borderRadius: '5px' }}>T: {dailyStats[date].total}</span>
                <span title="Done" style={{ fontSize: '0.75rem', background: 'rgba(100,220,100,0.15)', color: '#6fc96f', padding: '2px 6px', borderRadius: '5px' }}>D: {dailyStats[date].done}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '2rem' }}>
        <button style={tabStyle('bookings')} onClick={() => setActiveTab('bookings')}>Bookings</button>
        <button style={tabStyle('reviews')} onClick={() => setActiveTab('reviews')}>Reviews</button>
      </div>

      {activeTab === 'bookings' ? (
        <>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <input type="text" placeholder="Search by name..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
            <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} style={{ width: '200px', padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {filtered.map((b, i) => {
              const st = STATUS_COLORS[b.status] || STATUS_COLORS.pending;
              const isConfirmed = b.status === 'confirmed';
              return (
                <div key={b.id} className="glass-panel" style={{ position: 'relative', padding: '2.5rem 2rem 2rem 2rem', borderRadius: '24px', borderLeft: `6px solid ${st.color}`, overflow: 'hidden' }}>
                  {/* Status Corner Badge */}
                  <div style={{ position: 'absolute', top: 0, left: 0, background: st.color, color: '#000', padding: '4px 15px', borderBottomRightRadius: '12px', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                    {b.status}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <div>
                      <h3 style={{ margin: 0, color: 'white', fontSize: '1.6rem', fontFamily: 'var(--font-heading)' }}>{b.name}</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>{b.email} · {b.mobile}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => updateStatus(b.id, 'completed')} style={{ background: 'rgba(111,201,111,0.1)', color: '#6fc96f', border: 'none', padding: '8px 16px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700 }}>✔ Done</button>
                      <button onClick={() => updateStatus(b.id, 'cancelled')} style={{ background: 'rgba(234,67,53,0.1)', color: '#EA4335', border: 'none', padding: '8px 16px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700 }}>✕ Cancel</button>
                      <button onClick={() => deleteBooking(b.id)} style={{ padding: '8px', opacity: 0.3, background: 'none', border: 'none', color: 'white' }}>🗑</button>
                    </div>
                  </div>

                  {/* Communication Row */}
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
                    <button onClick={() => sendWhatsApp(b)} style={{ background: 'rgba(37,211,102,0.1)', color: '#25D366', border: '1px solid rgba(37,211,102,0.2)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700 }}>💬 WhatsApp</button>
                    <button onClick={() => makeCall(b)} style={{ background: 'rgba(32,178,170,0.1)', color: 'var(--accent-teal)', border: '1px solid rgba(32,178,170,0.2)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700 }}>📞 Call</button>
                    <button onClick={() => sendEmail(b)} style={{ background: 'rgba(212,175,55,0.1)', color: 'var(--accent-gold)', border: '1px solid rgba(212,175,55,0.2)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700 }}>✉️ Email</button>
                    <button onClick={() => sendPush(b)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700 }}>🔔 Push</button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--accent-gold)', marginBottom: '4px' }}>CONSULTATION</div>
                      <div style={{ color: 'white', fontWeight: 600 }}>{b.category}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{b.preferredDate} · {b.preferredSlot}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', marginBottom: '8px', fontWeight: 700, letterSpacing: '1px' }}>💵 PAYMENT MANAGEMENT</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>₹</span>
                        <input 
                          type="number" 
                          value={b.amount || 0} 
                          onChange={async (e) => {
                            const newAmt = parseInt(e.target.value);
                            // Optimistic update for UI feel
                            setBookings(prev => prev.map(x => x.id === b.id ? { ...x, amount: newAmt } : x));
                            // Real update to DB
                            await updateDoc(doc(db, 'bookings', b.id), { amount: newAmt });
                          }}
                          style={{ width: '100px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', padding: '4px 8px', fontWeight: 600 }}
                        />
                        <select 
                          value={b.paymentStatus || 'unpaid'} 
                          onChange={async (e) => {
                            const newStatus = e.target.value;
                            setBookings(prev => prev.map(x => x.id === b.id ? { ...x, paymentStatus: newStatus } : x));
                            await updateDoc(doc(db, 'bookings', b.id), { paymentStatus: newStatus });
                          }}
                          style={{ 
                            fontSize: '0.8rem', 
                            color: b.paymentStatus === 'verified' ? '#000' : '#fff', 
                            background: b.paymentStatus === 'verified' ? '#6fc96f' : 'rgba(255,255,255,0.1)', 
                            padding: '2px 8px', 
                            borderRadius: '8px', 
                            fontWeight: 700,
                            border: 'none',
                            cursor: 'pointer',
                            appearance: 'none',
                            textAlign: 'center'
                          }}
                        >
                          <option value="unpaid" style={{ background: '#0A192F', color: 'white' }}>❌ Unpaid</option>
                          <option value="waiting_verification" style={{ background: '#0A192F', color: 'white' }}>⏳ Waiting</option>
                          <option value="verified" style={{ background: '#6fc96f', color: 'black' }}>✔ Verified (Paid)</option>
                        </select>
                      </div>
                      
                      {b.transactionId && (
                        <div style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>REF: {b.transactionId}</p>
                          <button 
                            onClick={() => verifyPayment(b)} 
                            style={{ width: '100%', padding: '6px', fontSize: '0.8rem', borderRadius: '8px', background: b.paymentStatus === 'verified' ? '#6fc96f' : 'var(--accent-gold)', color: '#000', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                          >
                            {b.paymentStatus === 'verified' ? '✔ Verified' : 'Confirm Payment'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Scheduling Section */}
                  <div style={{ background: 'rgba(32,178,170,0.05)', padding: '1.5rem', borderRadius: '16px', marginBottom: '1.5rem', border: '1px solid rgba(32,178,170,0.2)' }}>
                    <p style={{ color: 'var(--accent-teal)', fontSize: '0.85rem', fontWeight: 800, marginBottom: '1rem' }}>
                      {isConfirmed ? '🔄 RESCHEDULE APPOINTMENT' : '📅 CONFIRM APPOINTMENT'}
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <input type="date" value={confirmDates[b.id]?.date || ''} onChange={e => setConfirmDates(p => ({ ...p, [b.id]: { ...p[b.id], date: e.target.value } }))} style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }} />
                      <select value={confirmDates[b.id]?.slot || ''} onChange={e => setConfirmDates(p => ({ ...p, [b.id]: { ...p[b.id], slot: e.target.value } }))} style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', color: 'white', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <option value="">Select Slot</option>
                        <option value="Morning (9 AM - 12 PM)">Morning (9 AM - 12 PM)</option>
                        <option value="Afternoon (1 PM - 4 PM)">Afternoon (1 PM - 4 PM)</option>
                        <option value="Evening (5 PM - 8 PM)">Evening (5 PM - 8 PM)</option>
                      </select>
                      <button 
                        onClick={async () => {
                          const cd = confirmDates[b.id];
                          if (!cd?.date) return alert('Select date');
                          await updateDoc(doc(db, 'bookings', b.id), { status: 'confirmed', confirmedDate: cd.date, confirmedSlot: cd.slot });
                          setBookings(p => p.map(x => x.id === b.id ? { ...x, status: 'confirmed', confirmedDate: cd.date, confirmedSlot: cd.slot } : x));
                        }} 
                        style={{ padding: '0.8rem 1.5rem', border: 'none', borderRadius: '8px', background: 'var(--accent-teal)', color: '#000', fontWeight: 800, cursor: 'pointer' }}>
                        {isConfirmed ? 'Reschedule' : 'Confirm'}
                      </button>
                    </div>
                  </div>

                  {/* Private Notes */}
                  <div style={{ position: 'relative' }}>
                    <textarea 
                      placeholder="Admin notes (Internal use)..." 
                      value={notes[b.id] || ''} 
                      onChange={e => setNotes(p => ({ ...p, [b.id]: e.target.value }))}
                      onBlur={() => saveNote(b.id)}
                      style={{ width: '100%', height: '80px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '10px' }}
                    />
                    {savingNote[b.id] && <div style={{ position: 'absolute', right: '10px', bottom: '10px', fontSize: '0.65rem', color: 'var(--accent-gold)' }}>Saved</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {reviews.map(r => (
            <div key={r.id} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>{r.userName} · {'★'.repeat(r.rating)}</p>
                <p style={{ color: 'white' }}>"{r.comment}"</p>
              </div>
              <button onClick={() => deleteDoc(doc(db, 'reviews', r.id))} style={{ background: 'rgba(234,67,53,0.1)', color: '#EA4335', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px' }}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

async function deleteBooking(id) {
  if (!window.confirm('Delete permanently?')) return;
  const { deleteDoc, doc } = await import('firebase/firestore');
  await deleteDoc(doc(db, 'bookings', id));
}
