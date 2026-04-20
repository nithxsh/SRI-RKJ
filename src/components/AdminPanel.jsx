import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, setDoc, query, orderBy } from 'firebase/firestore';
import emailjs from '@emailjs/browser';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import '../index.css';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'nithishog31@gmail.com';

// ── EmailJS config ── fill these after creating free account at emailjs.com
const EMAILJS_SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID  || '';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';
const EMAILJS_PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY  || '';

const STATUS_COLORS = {
  pending:   { bg: 'rgba(212,175,55,0.15)',  color: '#D4AF37', label: '⏳ Pending' },
  waiting_verification: { bg: 'rgba(255,165,0,0.15)', color: '#FFA500', label: '💳 Pay Pending' },
  confirmed: { bg: 'rgba(32,178,170,0.15)',  color: '#20B2AA', label: '✅ Confirmed' },
  completed: { bg: 'rgba(100,220,100,0.15)', color: '#6fc96f', label: '✔ Completed' },
  cancelled: { bg: 'rgba(234,67,53,0.12)',   color: '#EA4335', label: '✕ Cancelled' },
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// ─── Mini Calendar Component ───────────────────────────────────────────
function MiniCalendar({ bookings }) {
  const today = new Date();
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selected, setSelected] = useState(null);

  const firstDay = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();

  // Map confirmed bookings to dates
  const confirmedMap = {};
  bookings.filter(b => b.confirmedDate).forEach(b => {
    const key = b.confirmedDate; // format: YYYY-MM-DD
    if (!confirmedMap[key]) confirmedMap[key] = [];
    confirmedMap[key].push(b);
  });

  const prevMonth = () => setView(v => {
    const d = new Date(v.year, v.month - 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const nextMonth = () => setView(v => {
    const d = new Date(v.year, v.month + 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const selectedKey = selected
    ? `${view.year}-${String(view.month + 1).padStart(2,'0')}-${String(selected).padStart(2,'0')}`
    : null;
  const selectedBookings = selectedKey ? (confirmedMap[selectedKey] || []) : [];

  return (
    <div>
      {/* Calendar header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button onClick={prevMonth} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: 'white', width: '36px', height: '36px', borderRadius: '8px', cursor: 'pointer', fontSize: '1.2rem' }}>‹</button>
        <h3 style={{ color: 'var(--accent-gold)', fontFamily: 'var(--font-heading)' }}>{MONTHS[view.month]} {view.year}</h3>
        <button onClick={nextMonth} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: 'white', width: '36px', height: '36px', borderRadius: '8px', cursor: 'pointer', fontSize: '1.2rem' }}>›</button>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '4px' }}>
        {DAYS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const key = `${view.year}-${String(view.month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const hasBooking = !!confirmedMap[key];
          const isToday = today.getFullYear() === view.year && today.getMonth() === view.month && today.getDate() === day;
          const isSelected = selected === day;
          return (
            <div
              key={day}
              onClick={() => setSelected(isSelected ? null : day)}
              style={{
                textAlign: 'center', padding: '6px 2px', borderRadius: '8px', cursor: 'pointer',
                background: isSelected ? 'rgba(212,175,55,0.3)' : isToday ? 'rgba(32,178,170,0.15)' : 'transparent',
                border: isToday ? '1px solid rgba(32,178,170,0.4)' : '1px solid transparent',
                color: isSelected ? '#D4AF37' : 'var(--text-primary)',
                fontSize: '0.9rem', fontWeight: hasBooking ? 700 : 400,
                transition: 'all 0.15s', position: 'relative'
              }}
            >
              {day}
              {hasBooking && (
                <div style={{ position: 'absolute', bottom: '2px', left: '50%', transform: 'translateX(-50%)', width: '5px', height: '5px', borderRadius: '50%', background: '#20B2AA' }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Selected day bookings */}
      {selectedBookings.length > 0 && (
        <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.2rem' }}>
          <p style={{ color: 'var(--accent-gold)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.8rem' }}>
            📋 {selectedBookings.length} Appointment{selectedBookings.length > 1 ? 's' : ''} on {MONTHS[view.month]} {selected}
          </p>
          {selectedBookings.map((b, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', padding: '0.8rem', borderRadius: '8px', marginBottom: '0.5rem', borderLeft: '3px solid var(--accent-teal)' }}>
              <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem' }}>{b.name}</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{b.confirmedSlot || b.preferredSlot} · {b.category}</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>📞 {b.mobile}</p>
            </div>
          ))}
        </div>
      )}
      {selected && selectedBookings.length === 0 && (
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', textAlign: 'center', marginTop: '1rem' }}>No appointments on this day</p>
      )}
    </div>
  );
}

// ─── Password Change Form ─────────────────────────────────────────────
function PasswordChangeForm() {
  const { reauthenticate, changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (newPassword !== confirmPassword) return setError('Passwords do not match');
    if (newPassword.length < 6) return setError('Password must be at least 6 characters');
    
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // 1. Re-authenticate
      await reauthenticate(currentPassword);
      // 2. Change password
      await changePassword(newPassword);
      setSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      setError('Failed to update password. Ensure current password is correct.');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = { width: '100%', padding: '0.8rem 1.2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', marginBottom: '1rem', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.3s' };

  return (
    <form onSubmit={handleSubmit}>
      {error && <p style={{ color: '#EA4335', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 600 }}>❌ {error}</p>}
      {success && <p style={{ color: '#6fc96f', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 600 }}>✅ {success}</p>}
      
      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Current Password</label>
      <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required style={inputStyle} />
      
      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>New Password</label>
      <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required style={inputStyle} />
      
      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Confirm New Password</label>
      <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required style={inputStyle} />
      
      <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '1rem', marginTop: '0.5rem' }}>
        {loading ? '⏳ Updating...' : '✨ Update Password'}
      </button>
    </form>
  );
}

// ─── Main Admin Panel ───────────────────────────────────────────────────
export default function AdminPanel() {
  const { currentUser } = useAuth();
  const [bookings, setBookings]             = useState([]);
  const [loading, setLoading]               = useState(true);
  const [activeTab, setActiveTab]           = useState('bookings');
  const [filter, setFilter]                 = useState('all');
  const [search, setSearch]                 = useState('');
  const [updatingId, setUpdatingId]         = useState(null);
  const [confirmDates, setConfirmDates]     = useState({});
  const [emailStatus, setEmailStatus]       = useState({});
  const [notes, setNotes]                   = useState({});   // bookingId → string
  const [savingNote, setSavingNote]         = useState({});   // bookingId → bool
  const [userTokens, setUserTokens]         = useState({});   // userId → fcmToken
  const [sendingPush, setSendingPush]       = useState({});   // bookingId → bool
  const [reschedule, setReschedule]         = useState({});   // bookingId → {open, date, slot}
  const [dateFilter, setDateFilter]         = useState('');   // YYYY-MM-DD
  const [reviews, setReviews]               = useState([]);
  const [fetchingReviews, setFetchingReviews] = useState(false);

  if (currentUser?.email !== ADMIN_EMAIL) {
    return (
      <div style={{ paddingTop: '140px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚫</div>
        <h2 style={{ color: '#EA4335' }}>Access Denied</h2>
        <p>This panel is only accessible to the office administrator.</p>
      </div>
    );
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => { fetchBookings(); }, []);

  async function fetchBookings() {
    setLoading(true);
    try {
      const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Fetch private notes separately
      const notesSnap = await getDocs(collection(db, 'adminNotes'));
      const notesPrefill = {};
      notesSnap.forEach(doc => {
        notesPrefill[doc.id] = doc.data().content;
      });

      setBookings(data);
      const prefill = {};
      data.forEach(b => {
        if (b.confirmedDate) prefill[b.id] = { date: b.confirmedDate, slot: b.confirmedSlot || '' };
      });
      setConfirmDates(prefill);
      setNotes(notesPrefill);

      // Fetch user tokens for push notifications
      const usersSnap = await getDocs(collection(db, 'users'));
      const tokens = {};
      usersSnap.forEach(doc => {
        if (doc.data().fcmToken) tokens[doc.id] = doc.data().fcmToken;
      });
      setUserTokens(tokens);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchReviews() {
    setFetchingReviews(true);
    try {
      const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Fetch reviews error:', err);
    } finally {
      setFetchingReviews(false);
    }
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (activeTab === 'reviews') fetchReviews();
  }, [activeTab]);

  async function deleteReview(id) {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'reviews', id));
      setReviews(prev => prev.filter(r => r.id !== id));
      alert('Review deleted.');
    } catch (err) {
      console.error('Delete review error:', err);
      alert('Delete failed.');
    }
  }

  async function verifyPayment(b) {
    setUpdatingId(b.id);
    try {
      await updateDoc(doc(db, 'bookings', b.id), { paymentStatus: 'verified' });
      setBookings(prev => prev.map(x => x.id === b.id ? { ...x, paymentStatus: 'verified' } : x));
      alert('Payment verified for ' + b.name);
    } catch(err) { console.error(err); }
    finally { setUpdatingId(null); }
  }

  async function deleteBooking(id, name) {
    if (!window.confirm(`Are you sure you want to PERMANENTLY delete the booking for "${name}"? This cannot be undone.`)) return;
    setUpdatingId(id);
    try {
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'bookings', id));
      setBookings(prev => prev.filter(b => b.id !== id));
      alert('Booking deleted successfully.');
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete booking: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  async function sendPushNotification(b, title, message) {
    const token = userTokens[b.userId];
    if (!token) { alert('User has not enabled push notifications yet.'); return; }
    
    // NOTE: This usually requires a server/cloud function. 
    // This frontend implementation requires VITE_FIREBASE_FCM_SERVER_KEY in .env.local
    const serverKey = import.meta.env.VITE_FIREBASE_FCM_SERVER_KEY;
    if (!serverKey) {
      alert('FCM Server Key missing. Add VITE_FIREBASE_FCM_SERVER_KEY to .env.local');
      return;
    }

    setSendingPush(prev => ({ ...prev, [b.id]: true }));
    try {
      await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `key=${serverKey}`
        },
        body: JSON.stringify({
          to: token,
          notification: {
            title: title || 'Namo Astrology Update',
            body: message || 'Your appointment status has been updated.',
            icon: '/icon-192.png',
            click_action: window.location.origin + '/dashboard'
          }
        })
      });
      alert('Push notification sent!');
    } catch (err) {
      console.error('Push error:', err);
      alert('Failed to send push.');
    } finally {
      setSendingPush(prev => ({ ...prev, [b.id]: false }));
    }
  }

  async function confirmBooking(b) {
    const cd = confirmDates[b.id];
    if (!cd?.date) { alert('Please select a confirmed date first!'); return; }
    setUpdatingId(b.id);
    try {
      await updateDoc(doc(db, 'bookings', b.id), {
        status: 'confirmed',
        confirmedDate: cd.date,
        confirmedSlot: cd.slot || b.preferredSlot
      });
      setBookings(prev => prev.map(x => x.id === b.id ? { ...x, status: 'confirmed', confirmedDate: cd.date, confirmedSlot: cd.slot || b.preferredSlot } : x));
    } catch(err) { console.error(err); }
    finally { setUpdatingId(null); }
  }

  async function updateStatus(bookingId, newStatus) {
    setUpdatingId(bookingId);
    try {
      await updateDoc(doc(db, 'bookings', bookingId), { status: newStatus });
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
    } catch (err) { console.error(err); }
    finally { setUpdatingId(null); }
  }

  // ── Reschedule ──────────────────────────────────────────────────────
  async function applyReschedule(b) {
    const rs = reschedule[b.id];
    if (!rs?.date) { alert('Please select a new date to reschedule.'); return; }
    setUpdatingId(b.id);
    const oldDate = b.confirmedDate || '—';
    const oldSlot = b.confirmedSlot || b.preferredSlot || '—';
    try {
      await updateDoc(doc(db, 'bookings', b.id), {
        confirmedDate: rs.date,
        confirmedSlot: rs.slot || b.confirmedSlot,
        rescheduledCount: (b.rescheduledCount || 0) + 1,
        previousDate: oldDate,
      });
      setBookings(prev => prev.map(x => x.id === b.id ? { ...x, confirmedDate: rs.date, confirmedSlot: rs.slot || x.confirmedSlot, previousDate: oldDate } : x));
      setReschedule(prev => ({ ...prev, [b.id]: { ...rs, open: false } }));
      // Open WhatsApp with reschedule message
      const phone = b.mobile?.replace(/\D/g, '');
      const msg = encodeURIComponent(
        `🙏 Namaste ${b.name},\n\n` +
        `Your appointment at *Shri Namo Narayanaya Astrology Office* has been *rescheduled*.\n\n` +
        `❌ Old Date: ${oldDate} · ${oldSlot}\n` +
        `✅ New Date: ${rs.date} · ${rs.slot || b.confirmedSlot}\n\n` +
        `We apologize for the inconvenience. Please be available on the new date.\n\n` +
        `For queries: ${import.meta.env.VITE_OFFICE_PHONE || '9751442007'}\n\nOM NAMO NARAYANA 🙏`
      );
      window.open(`https://wa.me/91${phone}?text=${msg}`, '_blank');
    } catch(err) { console.error(err); }
    finally { setUpdatingId(null); }
  }

  // ── Notes auto-save ─────────────────────────────────────────────────
  async function saveNote(bookingId) {
    if (notes[bookingId] === undefined) return;
    setSavingNote(prev => ({ ...prev, [bookingId]: true }));
    try {
      await updateDoc(doc(db, 'adminNotes', bookingId), {
        content: notes[bookingId],
        updatedAt: new Date().toISOString()
      }).catch(async (err) => {
        // If doc doesn't exist, create it
        if (err.code === 'not-found') {
          await setDoc(doc(db, 'adminNotes', bookingId), {
            content: notes[bookingId],
            updatedAt: new Date().toISOString()
          });
        }
      });
    } catch(err) { console.error('Note save failed:', err); }
    finally {
      setTimeout(() => setSavingNote(prev => ({ ...prev, [bookingId]: false })), 800);
    }
  }

  function openWhatsApp(b) {
    const cd = confirmDates[b.id];
    const confirmedDate = cd?.date || b.confirmedDate || '(to be confirmed)';
    const confirmedSlot = cd?.slot || b.confirmedSlot || b.preferredSlot || '';
    const phone = b.mobile?.replace(/\D/g, '');
    const isOnline = b.category === 'Online Consultation';

    const onlineMsg =
      `🙏 Namaste ${b.name},\n\n` +
      `Your *Online Consultation* at *Shri Namo Narayanaya Astrology Office* has been *confirmed*!\n\n` +
      `📅 Date: ${confirmedDate}\n` +
      `⏰ Slot: ${confirmedSlot}\n` +
      `💻 Mode: Online (we will share the meeting link before the session)\n\n` +
      `Please keep your phone/laptop ready at the scheduled time.\n\n` +
      `For queries: ${import.meta.env.VITE_OFFICE_PHONE || '9751442007'}\n\n` +
      `OM NAMO NARAYANA 🙏`;

    const offlineMsg =
      `🙏 Namaste ${b.name},\n\n` +
      `Your *Offline Consultation* at *Shri Namo Narayanaya Astrology Office* has been *confirmed*!\n\n` +
      `📅 Date: ${confirmedDate}\n` +
      `⏰ Slot: ${confirmedSlot}\n` +
      `📍 Location: Mailpatti, Near Gudiyattam, Vellore District\n\n` +
      `Please arrive 10 minutes early.\n\n` +
      `For queries: ${import.meta.env.VITE_OFFICE_PHONE || '9751442007'}\n\n` +
      `OM NAMO NARAYANA 🙏`;

    const msg = encodeURIComponent(isOnline ? onlineMsg : offlineMsg);
    window.open(`https://wa.me/91${phone}?text=${msg}`, '_blank');
  }

  async function sendEmail(b) {
    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
      alert('EmailJS is not configured yet. Add VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, and VITE_EMAILJS_PUBLIC_KEY to your .env.local file.');
      return;
    }
    const cd = confirmDates[b.id];
    const confirmedDate = cd?.date || b.confirmedDate || 'To be confirmed';
    const confirmedSlot = cd?.slot || b.confirmedSlot || b.preferredSlot || '';
    setEmailStatus(prev => ({ ...prev, [b.id]: 'sending' }));
    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        to_name:        b.name,
        to_email:       b.email,
        category:       b.category,
        confirmed_date: confirmedDate,
        confirmed_slot: confirmedSlot,
        purpose:        b.purpose === 'Other' ? b.otherPurpose : b.purpose,
        office_contact: import.meta.env.VITE_OFFICE_PHONE || '9751442007',
      }, EMAILJS_PUBLIC_KEY);
      setEmailStatus(prev => ({ ...prev, [b.id]: 'sent' }));
      setTimeout(() => setEmailStatus(prev => ({ ...prev, [b.id]: null })), 4000);
    } catch(err) {
      console.error('Email error:', err);
      setEmailStatus(prev => ({ ...prev, [b.id]: 'error' }));
    }
  }

  const filtered = bookings.filter(b => {
    const mf = filter === 'all' 
               ? (b.status !== 'completed' && b.status !== 'cancelled') // ONLY active bookings for "all"
               : (filter === 'payment' ? b.paymentStatus === 'waiting_verification' : b.status === filter);
               
    const ms = !search || b.name?.toLowerCase().includes(search.toLowerCase()) || b.mobile?.includes(search) || b.email?.toLowerCase().includes(search.toLowerCase());
    
    // Date filter logic: check if the creation date or confirmed date matches the filter
    const createdAtDate = b.createdAt?.toDate ? b.createdAt.toDate().toISOString().split('T')[0] : '';
    const md = !dateFilter || (b.confirmedDate === dateFilter || b.preferredDate === dateFilter || createdAtDate === dateFilter);

    return mf && ms && md;
  });

  const counts = {
    all: bookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled').length,
    pending: bookings.filter(b => b.status === 'pending').length,
    payment: bookings.filter(b => b.paymentStatus === 'waiting_verification').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  };

  const inputStyle = { padding: '0.5rem 0.9rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '0.88rem', cursor: 'pointer' };
  const tabStyle = (t) => ({ padding: '0.7rem 1.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s', background: activeTab === t ? 'var(--accent-gold)' : 'rgba(255,255,255,0.07)', color: activeTab === t ? '#000' : 'var(--text-primary)' });

  return (
    <section style={{ paddingTop: '120px', minHeight: '80vh', paddingBottom: '4rem' }} className="container">
      {/* Header */}
      <div className="glass-panel" style={{ padding: '2.5rem', marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem', borderLeft: '5px solid var(--accent-gold)' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent-gold)', fontSize: '2.5rem', marginBottom: '0.3rem' }}>🛡 Office Command Center</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Shri Namo Narayanaya Astrology Management</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-secondary" onClick={fetchBookings} style={{ borderRadius: '12px', padding: '0.8rem 1.5rem' }}>🔄 Refresh</button>
          {/* We'll add security tab later or just use it from tabs */}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1.2rem', marginBottom: '3rem' }}>
        {[
          ['all','📦','Bookings',counts.all],
          ['payment','💳','Payments',counts.payment],
          ['pending','⏳','Pending',counts.pending],
          ['confirmed','✅','Confirmed',counts.confirmed],
          ['completed','✔','Completed',counts.completed],
          ['cancelled','✕','Cancelled',counts.cancelled]
        ].map(([key,icon,label,count]) => (
          <div key={key} onClick={() => { setFilter(key); setSearch(''); setActiveTab('bookings'); }} className="glass-panel" style={{ 
            padding: '1.5rem', 
            textAlign: 'center', 
            cursor: 'pointer', 
            borderRadius: '16px', 
            border: filter === key ? '2px solid var(--accent-gold)' : '1px solid var(--glass-border)', 
            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', 
            background: filter === key ? 'linear-gradient(135deg, rgba(212,175,55,0.1), transparent)' : 'rgba(255,255,255,0.02)',
            transform: filter === key ? 'scale(1.05)' : 'scale(1)',
            boxShadow: filter === key ? '0 10px 30px rgba(212,175,55,0.15)' : 'none'
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem', filter: filter === key ? 'none' : 'grayscale(1)' }}>{icon}</div>
            <div style={{ fontSize: '2.2rem', fontWeight: 700, color: filter === key ? 'var(--accent-gold)' : 'var(--text-primary)', marginBottom: '0.2rem' }}>{count}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: 600 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button style={tabStyle('bookings')} onClick={() => setActiveTab('bookings')}>📋 Bookings</button>
        <button style={tabStyle('calendar')} onClick={() => setActiveTab('calendar')}>📅 Calendar</button>
        <button style={tabStyle('reviews')} onClick={() => setActiveTab('reviews')}>⭐ Reviews ({reviews.length})</button>
        <button style={tabStyle('security')} onClick={() => setActiveTab('security')}>🛡️ Security</button>
      </div>

      {/* ── SECURITY TAB ── */}
      {activeTab === 'security' && (
        <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: '16px', maxWidth: '500px' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent-gold)' }}>🔐 Admin Password Management</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Update your admin account password. For security, you will need to re-verify your current password.
          </p>
          <PasswordChangeForm />
        </div>
      )}

      {/* ── CALENDAR TAB ── */}
      {activeTab === 'calendar' && (
        <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px', maxWidth: '600px' }}>
          <MiniCalendar bookings={bookings} />
        </div>
      )}

      {/* ── REVIEWS TAB ── */}
      {activeTab === 'reviews' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {fetchingReviews ? (
            <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>⏳ Fetching reviews...</p>
          ) : reviews.length === 0 ? (
            <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', borderRadius: '16px' }}>
              <p style={{ color: 'var(--text-secondary)' }}>No reviews found in the database.</p>
            </div>
          ) : (
            reviews.map(r => (
              <div key={r.id} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '2px', marginBottom: '0.5rem' }}>
                    {[1,2,3,4,5].map(s => (
                      <span key={s} style={{ color: s <= r.rating ? 'var(--accent-gold)' : 'rgba(255,255,255,0.1)' }}>★</span>
                    ))}
                  </div>
                  <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem', fontStyle: 'italic', marginBottom: '0.8rem' }}>"{r.comment}"</p>
                  <p style={{ color: 'var(--accent-gold)', fontWeight: 600, fontSize: '0.9rem' }}>— {r.userName}</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{r.service} · {r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString('en-IN') : ''}</p>
                </div>
                <button 
                  onClick={() => deleteReview(r.id)}
                  style={{ ...inputStyle, background: 'rgba(234,67,53,0.1)', border: '1px solid rgba(234,67,53,0.3)', color: '#EA4335', padding: '0.5rem 0.8rem' }}
                >
                  Delete Review
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── BOOKINGS TAB ── */}
      {activeTab === 'bookings' && (
        <>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '1.2rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
            <input 
              type="text" 
              placeholder="Search seeker by name, mobile or email..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              style={{ ...inputStyle, width: '100%', padding: '1rem 1rem 1rem 3rem', fontSize: '1rem', borderRadius: '15px' }} 
            />
          </div>
          <div style={{ position: 'relative', minWidth: '220px' }}>
            <span style={{ position: 'absolute', top: '-12px', left: '15px', fontSize: '0.65rem', color: 'var(--accent-gold)', fontWeight: 800, textTransform: 'uppercase', background: 'var(--bg-space)', padding: '0 5px' }}>📅 Filter by Date</span>
            <input 
              type="date" 
              value={dateFilter} 
              onChange={e => setDateFilter(e.target.value)}
              style={{ ...inputStyle, width: '100%', padding: '1rem', borderRadius: '15px' }} 
            />
            {dateFilter && (
              <button 
                onClick={() => setDateFilter('')}
                style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}
              >✕</button>
            )}
          </div>
        </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>⏳ Loading bookings...</div>
          ) : filtered.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem', borderRadius: '12px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
              <p style={{ color: 'var(--text-secondary)' }}>No bookings found.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {filtered.map((b, i) => {
                const st = STATUS_COLORS[b.status] || STATUS_COLORS.pending;
                const submittedAt = b.createdAt?.toDate ? b.createdAt.toDate().toLocaleString('en-IN') : '—';
                const cd = confirmDates[b.id] || { date: b.confirmedDate || '', slot: b.confirmedSlot || '' };
                const es = emailStatus[b.id];

                return (
                  <div key={b.id} className="glass-panel" style={{ 
                    padding: '2rem', 
                    borderRadius: '24px', 
                    borderLeft: `6px solid ${st.color}`,
                    background: 'rgba(255,255,255,0.02)',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                    position: 'relative'
                  }}>
                    {/* Index & Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(212,175,55,0.1)', color: 'var(--accent-gold)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 800, fontSize: '1.2rem' }}>{i+1}</div>
                        <div>
                          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', color: 'var(--text-primary)', fontWeight: 700 }}>{b.name}</span>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', opacity: 0.7 }}>Booking ID: #{b.id.slice(-6).toUpperCase()} · {submittedAt}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                        <span style={{ padding: '6px 16px', borderRadius: '25px', fontSize: '0.8rem', fontWeight: 700, background: st.bg, color: st.color, border: `1px solid ${st.color}33` }}>{st.label}</span>
                        <span style={{ padding: '6px 12px', borderRadius: '10px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', fontWeight: 600 }}>{b.category}</span>
                      </div>
                    </div>

                    {/* Action Quick Bar */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.8rem', borderRadius: '15px' }}>
                      {['completed','cancelled'].map(s => (
                        <button key={s} disabled={b.status === s || !!updatingId} onClick={() => updateStatus(b.id, s)}
                          style={{ ...inputStyle, padding: '0.5rem 1rem', borderRadius: '10px', opacity: b.status === s ? 0.3 : 1, textTransform: 'capitalize', fontSize: '0.75rem', fontWeight: 700, background: s === 'completed' ? 'rgba(111,201,111,0.1)' : 'rgba(234,67,53,0.1)', color: s === 'completed' ? '#6fc96f' : '#EA4335', border: 'none' }}>{s}</button>
                      ))}
                      <div style={{ flex: 1 }} />
                      <button 
                        onClick={() => deleteBooking(b.id, b.name)}
                        disabled={!!updatingId}
                        style={{ padding: '0.5rem 1rem', borderRadius: '10px', background: 'rgba(234,67,53,0.15)', color: '#EA4335', border: '1px solid rgba(234,67,53,0.2)', fontSize: '0.8rem', cursor: 'pointer' }}
                      >
                        🗑️ Delete
                      </button>
                    </div>

                    {/* Details grid */}
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                      gap: '0.8rem', 
                      marginBottom: '1.5rem'
                    }}>
                      {[
                        ["👤 Father", b.fatherName],
                        ['🎂 DOB', b.dob], ['🕐 Born', b.time], ['📍 Location', b.birthPlace],
                        ['📞 Contact', b.mobile], ['✉️ Email', b.email],
                        ['🎯 Goal', b.purpose === 'Other' ? b.otherPurpose || 'Other' : b.purpose],
                        ['🗓️ Pref. Date', b.preferredDate], ['⏰ Pref. Slot', b.preferredSlot],
                      ].map(([label, value]) => (
                        <div key={label} style={{ background: 'rgba(255,255,255,0.02)', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                          <div style={{ fontSize: '0.65rem', color: 'var(--accent-gold)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: 700 }}>{label}</div>
                          <div style={{ color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 500 }}>{value || '—'}</div>
                        </div>
                      ))}
                    </div>

                    {/* ── Assign/Confirmed Date ── */}
                    <div style={{ 
                      background: 'linear-gradient(135deg, rgba(32,178,170,0.08), rgba(32,178,170,0.02))', 
                      border: '1px solid rgba(32,178,170,0.25)', 
                      borderRadius: '18px', 
                      padding: '1.5rem', 
                      marginBottom: '1.2rem' 
                    }}>
                      <p style={{ color: 'var(--accent-teal)', fontSize: '0.85rem', fontWeight: 800, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1.2px' }}>🗓️ Appointment Scheduling</p>
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <div style={{ flex:'1', minWidth: '150px' }}>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Confirmed Date</label>
                          <input type="date" value={cd.date}
                            onChange={e => setConfirmDates(prev => ({ ...prev, [b.id]: { ...cd, date: e.target.value } }))}
                            style={{ ...inputStyle, width: '100%', padding: '0.8rem', borderRadius: '12px' }} />
                        </div>
                        <div style={{ flex:'1', minWidth: '180px' }}>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Shift Slot</label>
                          <select value={cd.slot}
                            onChange={e => setConfirmDates(prev => ({ ...prev, [b.id]: { ...cd, slot: e.target.value } }))}
                            style={{ ...inputStyle, width: '100%', padding: '0.8rem', borderRadius: '12px' }}>
                            <option value="" style={{ background: '#0A192F' }}>Select slot</option>
                            <option value="Morning (9 AM - 12 PM)" style={{ background: '#0A192F' }}>🌅 Morning (9–12 PM)</option>
                            <option value="Afternoon (12 PM - 4 PM)" style={{ background: '#0A192F' }}>☀️ Afternoon (12–4 PM)</option>
                            <option value="Evening (4 PM - 8 PM)" style={{ background: '#0A192F' }}>🌆 Evening (4–8 PM)</option>
                          </select>
                        </div>
                        <button
                          disabled={!cd.date || !!updatingId}
                          onClick={() => confirmBooking(b)}
                          className="btn-primary"
                          style={{ padding: '0.8rem 1.8rem', borderRadius: '12px', background: cd.date ? 'var(--accent-teal)' : 'rgba(255,255,255,0.05)', color: cd.date ? '#000' : 'var(--text-secondary)', fontWeight: 800, cursor: cd.date ? 'pointer' : 'default', border: 'none' }}>
                          {b.confirmedDate ? '🔄 Update' : '✅ Confirm'}
                        </button>
                      </div>
                      {b.confirmedDate && (
                        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6fc96f', fontSize: '0.9rem', fontWeight: 600 }}>
                          <span>🛡️ Booked for: {b.confirmedDate} at {b.confirmedSlot}</span>
                        </div>
                      )}
                    </div>

                    {/* ── Transaction Intelligence ── */}
                    {b.transactionId && (
                      <div style={{ 
                        background: b.paymentStatus === 'verified' ? 'rgba(111,201,111,0.05)' : 'rgba(255,165,0,0.05)', 
                        border: `1px solid ${b.paymentStatus === 'verified' ? 'rgba(111,201,111,0.2)' : 'rgba(255,165,0,0.2)'}`, 
                        borderRadius: '18px', 
                        padding: '1.5rem', 
                        marginBottom: '1.2rem', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '1rem'
                      }}>
                        <div>
                          <p style={{ color: b.paymentStatus === 'verified' ? '#6fc96f' : '#FFA500', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>💳 Transaction Status</p>
                          <p style={{ color: 'white', fontSize: '1.3rem', fontWeight: 800, marginTop: '0.3rem', fontFamily: 'monospace' }}>{b.transactionId}</p>
                          <p style={{ color: 'var(--accent-gold)', fontSize: '1rem', fontWeight: 700 }}>Amount: ₹{b.amount || '0'}</p>
                        </div>
                        {b.paymentStatus !== 'verified' ? (
                          <button onClick={() => verifyPayment(b)} style={{ background: '#6fc96f', color: '#000', border: 'none', padding: '0.8rem 1.8rem', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 15px rgba(111,201,111,0.3)' }}>Verify Payment</button>
                        ) : (
                          <div style={{ color: '#6fc96f', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                            <span style={{ fontSize: '1.5rem' }}>🛡️</span> Verified
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Communication Hub ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.8rem', marginBottom: '1rem' }}>
                      <button
                        onClick={() => openWhatsApp(b)}
                        style={{ padding: '0.9rem', borderRadius: '14px', border: 'none', background: '#25D366', color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', boxShadow: '0 4px 12px rgba(37,211,102,0.2)' }}>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M20.52 3.48A12 12 0 0 0 3.48 20.52L2 22l1.52-1.48A12 12 0 1 0 20.52 3.48zm-8.52 18a9.9 9.9 0 0 1-5.07-1.39l-.36-.22-3.74.98.99-3.64-.24-.38A9.93 9.93 0 0 1 12 2a10 10 0 0 1 0 20z"/><path d="M17.06 14.38c-.3-.15-1.77-.87-2.04-.97s-.47-.15-.67.15-.77.97-.95 1.17-.35.22-.65.07a8.17 8.17 0 0 1-2.4-1.48 9 9 0 0 1-1.66-2.07c-.17-.3 0-.46.13-.61s.3-.35.45-.52a2 2 0 0 0 .3-.5.55.55 0 0 0 0-.52c-.07-.15-.67-1.62-.92-2.22s-.49-.5-.67-.51h-.57a1.1 1.1 0 0 0-.8.37 3.36 3.36 0 0 0-1.05 2.5 5.83 5.83 0 0 0 1.22 3.1c.15.2 2.1 3.2 5.08 4.49a17.2 17.2 0 0 0 1.7.63 4.08 4.08 0 0 0 1.87.12c.57-.09 1.77-.72 2.02-1.42s.25-1.3.17-1.42-.26-.2-.56-.35z"/></svg>
                        WhatsApp
                      </button>
                      <button
                        onClick={() => sendEmail(b)}
                        disabled={es === 'sending'}
                        style={{ padding: '0.9rem', borderRadius: '14px', border: 'none', background: es === 'sent' ? '#6fc96f' : 'linear-gradient(135deg, #FF4B2B, #FF416C)', color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', boxShadow: '0 4px 12px rgba(255,75,43,0.2)' }}>
                        ✉️ {es === 'sending' ? 'Sending...' : es === 'sent' ? 'Sent' : 'Email'}
                      </button>
                      <button
                        onClick={() => {
                          const msg = b.status === 'confirmed' ? 'Your appointment on ' + b.confirmedDate + ' has been confirmed!' : 'Payment received. We are processing your request.';
                          sendPushNotification(b, 'Booking Update', msg);
                        }}
                        disabled={sendingPush[b.id] || !userTokens[b.userId]}
                        style={{ padding: '0.9rem', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg, #2193b0, #6dd5ed)', color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', opacity: !userTokens[b.userId] ? 0.4 : 1, boxShadow: '0 4px 12px rgba(33,147,176,0.2)' }}>
                        🔔 {sendingPush[b.id] ? '...' : 'Push'}
                      </button>
                      {b.status === 'confirmed' && (
                        <button
                          onClick={() => setReschedule(prev => ({ ...prev, [b.id]: { ...prev[b.id], open: !prev[b.id]?.open } }))}
                          style={{ padding: '0.9rem', borderRadius: '14px', border: '1px solid rgba(212,175,55,0.4)', background: 'rgba(212,175,55,0.05)', color: 'var(--accent-gold)', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem' }}>
                          🗓️ Reschedule
                        </button>
                      )}
                    </div>

                    {/* ── Reschedule Panel ── */}
                    {reschedule[b.id]?.open && (
                      <div style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' }}>
                        <p style={{ color: 'var(--accent-gold)', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>🗓️ Reschedule Appointment</p>
                        {b.confirmedDate && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginBottom: '0.6rem' }}>Current: {b.confirmedDate} · {b.confirmedSlot}</p>}
                        <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                          <div style={{ flex: '1', minWidth: '140px' }}>
                            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>New Date</label>
                            <input type="date" value={reschedule[b.id]?.date || ''}
                              onChange={e => setReschedule(prev => ({ ...prev, [b.id]: { ...prev[b.id], date: e.target.value } }))}
                              style={{ ...inputStyle, width: '100%' }} />
                          </div>
                          <div style={{ flex: '1', minWidth: '160px' }}>
                            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>New Slot</label>
                            <select value={reschedule[b.id]?.slot || ''}
                              onChange={e => setReschedule(prev => ({ ...prev, [b.id]: { ...prev[b.id], slot: e.target.value } }))}
                              style={{ ...inputStyle, width: '100%' }}>
                              <option value="" style={{ background: '#0A192F' }}>Select slot</option>
                              <option value="Morning (9 AM - 12 PM)" style={{ background: '#0A192F' }}>🌅 Morning (9–12 PM)</option>
                              <option value="Afternoon (12 PM - 4 PM)" style={{ background: '#0A192F' }}>☀️ Afternoon (12–4 PM)</option>
                              <option value="Evening (4 PM - 8 PM)" style={{ background: '#0A192F' }}>🌆 Evening (4–8 PM)</option>
                            </select>
                          </div>
                          <button
                            disabled={!reschedule[b.id]?.date || !!updatingId}
                            onClick={() => applyReschedule(b)}
                            style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none', background: reschedule[b.id]?.date ? '#D4AF37' : 'rgba(255,255,255,0.1)', color: reschedule[b.id]?.date ? '#000' : 'var(--text-secondary)', fontWeight: 700, cursor: reschedule[b.id]?.date ? 'pointer' : 'default', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                            ✅ Confirm & WhatsApp
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ── Consultation Notes ── */}
                    <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>📋 Private Notes <span style={{ fontSize: '0.65rem', marginLeft: '6px' }}>(Visible to admin only)</span></p>
                        {savingNote[b.id] && <span style={{ color: '#6fc96f', fontSize: '0.75rem' }}>✔ Saved</span>}
                      </div>
                      <textarea
                        placeholder="Add private notes about this client..."
                        value={notes[b.id] || ''}
                        onChange={e => setNotes(prev => ({ ...prev, [b.id]: e.target.value }))}
                        onBlur={() => saveNote(b.id)}
                        rows={2}
                        style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.2)', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', resize: 'vertical', fontFamily: 'Inter, sans-serif', outline: 'none' }}
                      />
                      {b.notesUpdatedAt && (
                        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.72rem', marginTop: '0.3rem' }}>Last saved: {new Date(b.notesUpdatedAt).toLocaleString('en-IN')}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}
