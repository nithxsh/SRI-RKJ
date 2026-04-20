import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import '../index.css';

const STATUS_COLORS = {
  pending:   { bg: 'rgba(212,175,55,0.15)',  color: '#D4AF37', label: '⏳ Pending' },
  confirmed: { bg: 'rgba(32,178,170,0.15)',  color: '#20B2AA', label: '✅ Confirmed' },
  completed: { bg: 'rgba(100,220,100,0.15)', color: '#6fc96f', label: '✔ Completed' },
  cancelled: { bg: 'rgba(234,67,53,0.12)',   color: '#EA4335', label: '✕ Cancelled' },
};

// ─── Star Rating Picker ───────────────────────────────────────────────
function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: 'flex', gap: '4px', cursor: 'pointer' }}>
      {[1,2,3,4,5].map(s => (
        <span
          key={s}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
          style={{ fontSize: '2rem', color: s <= (hovered || value) ? '#D4AF37' : 'rgba(255,255,255,0.2)', transition: 'color 0.15s, transform 0.15s', transform: s <= (hovered || value) ? 'scale(1.15)' : 'scale(1)', display: 'inline-block' }}
        >★</span>
      ))}
    </div>
  );
}

// ─── Review Form for a single booking ────────────────────────────────
function ReviewForm({ booking, onDone }) {
  const { currentUser } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (rating === 0) { setError('Please select a star rating.'); return; }
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        bookingId:  booking.id,
        userId:     currentUser.uid,
        userName:   currentUser.displayName || currentUser.email?.split('@')[0] || 'Anonymous',
        userEmail:  currentUser.email,
        rating,
        comment:    comment.trim(),
        service:    booking.purpose === 'Other' ? booking.otherPurpose || 'Other' : booking.purpose,
        category:   booking.category,
        createdAt:  serverTimestamp(),
      });
      onDone(booking.id);
    } catch (err) {
      setError('Failed to submit review. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem', background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '15px', padding: '1.5rem' }}>
      <p style={{ color: 'var(--accent-gold)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>⭐ Your divine feedback</p>
      <StarPicker value={rating} onChange={setRating} />
      {error && <p style={{ color: '#EA4335', fontSize: '0.82rem', marginTop: '0.4rem' }}>{error}</p>}
      <textarea
        placeholder="How was your consultation experience?"
        value={comment}
        onChange={e => setComment(e.target.value)}
        rows={3}
        style={{ width: '100%', marginTop: '1rem', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white', resize: 'vertical', fontSize: '0.95rem', fontFamily: 'Inter, sans-serif', outline: 'none' }}
      />
      <button
        type="submit"
        disabled={submitting}
        className="btn-primary"
        style={{ marginTop: '1rem', padding: '0.8rem 2rem', fontSize: '1rem', borderRadius: '12px', width: '100%' }}
      >
        {submitting ? '⏳ Submitting...' : '✨ Post Review'}
      </button>
    </form>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────
export default function Dashboard() {
  const { currentUser } = useAuth();
  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Seeker';
  const [myBookings, setMyBookings]   = useState([]);
  const [myReviews, setMyReviews]     = useState(new Set()); // bookingIds already reviewed
  const [loading, setLoading]         = useState(true);
  const [reviewedNow, setReviewedNow] = useState(new Set()); // just submitted this session

  useEffect(() => {
    if (!currentUser) return;
    async function fetchAll() {
      setLoading(true);
      try {
        const bq = query(collection(db, 'bookings'), where('userId', '==', currentUser.uid));
        const bSnap = await getDocs(bq);
        const fetchedBookings = bSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        fetchedBookings.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return timeB - timeA;
        });
        
        setMyBookings(fetchedBookings);

        const rq = query(collection(db, 'reviews'), where('userId', '==', currentUser.uid));
        const rSnap = await getDocs(rq);
        setMyReviews(new Set(rSnap.docs.map(d => d.data().bookingId)));
      } catch (err) {
        console.warn('Dashboard fetch error:', err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [currentUser]);

  function handleReviewDone(bookingId) {
    setReviewedNow(prev => new Set([...prev, bookingId]));
    setMyReviews(prev => new Set([...prev, bookingId]));
  }

  const printReceipt = (b) => {
    const receiptWindow = window.open('', '_blank');
    const submittedAt = b.createdAt?.toDate ? b.createdAt.toDate().toLocaleDateString('en-IN') : '—';
    
    receiptWindow.document.write(`
      <html>
        <head>
          <title>Receipt - Shri Namo Narayanaya</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            .header { text-align: center; border-bottom: 2px solid #D4AF37; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #0A192F; letter-spacing: 2px; }
            .receipt-title { font-size: 18px; margin-top: 10px; color: #D4AF37; }
            .details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .item { margin-bottom: 10px; }
            .label { font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 2px; }
            .value { font-weight: 600; font-size: 16px; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 20px; }
            .stamp { border: 3px solid #6fc96f; color: #6fc96f; display: inline-block; padding: 5px 15px; border-radius: 5px; transform: rotate(-5deg); font-weight: bold; margin-top: 20px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">SRI NAMO NARAYANAYA</div>
            <div class="receipt-title">Official Consultation Receipt</div>
          </div>
          
          <div class="details">
            <div class="item"><div class="label">Booking ID</div><div class="value">#${b.id.slice(-8).toUpperCase()}</div></div>
            <div class="item"><div class="label">Date Issued</div><div class="value">${new Date().toLocaleDateString('en-IN')}</div></div>
            <div class="item"><div class="label">Seeker Name</div><div class="value">${b.name}</div></div>
            <div class="item"><div class="label">Mobile</div><div class="value">${b.mobile}</div></div>
            <div class="item"><div class="label">Service Category</div><div class="value">${b.category}</div></div>
            <div class="item"><div class="label">Purpose</div><div class="value">${b.purpose === 'Other' ? b.otherPurpose : b.purpose}</div></div>
            <div class="item"><div class="label">Booking Date</div><div class="value">${submittedAt}</div></div>
            <div class="item"><div class="label">Paid Amount</div><div class="value">₹${b.amount || '0'}</div></div>
          </div>

          <div style="text-align: center;">
            <div class="stamp">VERIFIED & PAID</div>
          </div>

          <div class="footer">
            <p>Shri Namo Narayanaya Astrology Office, Mailpatti, Tamil Nadu</p>
            <p>Contact: {import.meta.env.VITE_OFFICE_PHONE || '9751442007'}</p>
            <p>Thank you for seeking divine guidance.</p>
            <button onclick="window.print()" class="no-print" style="margin-top: 20px; padding: 10px 20px; background: #0A192F; color: white; border: none; border-radius: 5px; cursor: pointer;">Print Receipt</button>
          </div>
        </body>
      </html>
    `);
    receiptWindow.document.close();
  }

  return (
    <section id="dashboard" className="dashboard-section container" style={{ paddingTop: '120px', minHeight: '80vh', paddingBottom: '6rem' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '2.5rem', marginBottom: '3rem', borderLeft: '5px solid var(--accent-gold)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', fontSize: '8rem', opacity: 0.05, transform: 'rotate(-15deg)', pointerEvents: 'none' }}>🕉️</div>
        <h2 className="section-title" style={{ textAlign: 'left', marginBottom: '0.8rem', fontSize: '2.5rem' }}>Seeker Dashboard</h2>
        <p className="text-secondary" style={{ fontSize: '1.1rem' }}>Welcome back, <strong style={{ color: 'var(--accent-gold)', borderBottom: '2px solid' }}>{displayName}</strong>.</p>
        {currentUser?.email && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem', opacity: 0.8 }}>
            🔐 Secure Session: {currentUser.email}
          </p>
        )}
      </div>

      <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent-teal)', fontSize: '1.8rem' }}>📋 My Consultations</h3>

      {loading ? (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', borderRadius: '20px' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Gathering your celestial records...</p>
        </div>
      ) : myBookings.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', borderRadius: '20px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem', filter: 'drop-shadow(0 0 10px var(--accent-gold))' }}>🔮</div>
          <p style={{ color: 'var(--text-primary)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>No consultations found.</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Ready to seek guidance? Use the Book button to start.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {myBookings.map((b) => {
            const st = STATUS_COLORS[b.status] || STATUS_COLORS.pending;
            const submittedAt = b.createdAt?.toDate ? b.createdAt.toDate().toLocaleDateString('en-IN') : '—';
            const isCompleted = b.status === 'completed';
            const alreadyReviewed = myReviews.has(b.id);
            const justReviewed = reviewedNow.has(b.id);

            return (
              <div key={b.id} className="glass-panel" style={{ 
                padding: '2rem', 
                borderRadius: '24px', 
                borderLeft: `6px solid ${isCompleted ? '#6fc96f' : 'var(--accent-teal)'}`,
                boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
                background: 'rgba(255, 255, 255, 0.02)',
                position: 'relative'
              }}>
                {/* Status Badge */}
                <span style={{ 
                  position: 'absolute',
                  top: '2rem',
                  right: '2rem',
                  padding: '8px 18px', 
                  borderRadius: '30px', 
                  fontSize: '0.8rem', 
                  fontWeight: 700, 
                  background: st.bg, 
                  color: st.color, 
                  border: `1px solid ${st.color}33`,
                  whiteSpace: 'nowrap' 
                }}>
                  {st.label}
                </span>

                <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ color: 'var(--accent-gold)', fontSize: '1.5rem', marginBottom: '0.3rem', fontFamily: 'var(--font-heading)' }}>
                      {b.category}
                    </h4>
                    <p style={{ color: 'var(--accent-teal)', fontSize: '1rem', fontWeight: 600 }}>
                      {b.purpose === 'Other' ? b.otherPurpose || 'Other' : b.purpose}
                    </p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.4rem' }}>ID: #{b.id.slice(-6).toUpperCase()} · {submittedAt}</p>
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
                  gap: '1.2rem', 
                  marginBottom: '1.5rem',
                  background: 'rgba(255,255,255,0.03)',
                  padding: '1.5rem',
                  borderRadius: '16px'
                }}>
                  {[
                    ['📅 Date', b.preferredDate], 
                    ['⏰ Slot', b.preferredSlot],
                    ['🎂 DOB', b.dob], 
                    ['🕐 Born', b.time], 
                    ['📍 Place', b.birthPlace]
                  ].map(([label, val]) => (
                    <div key={label}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--accent-gold)', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>{label}</div>
                      <div style={{ color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 500 }}>{val || '—'}</div>
                    </div>
                  ))}
                </div>

                {b.confirmedDate && (
                  <div style={{ 
                    background: 'linear-gradient(135deg, rgba(32,178,170,0.1), transparent)', 
                    border: '1px solid rgba(32,178,170,0.3)', 
                    borderRadius: '20px', 
                    padding: '1.5rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1.5rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                      <div style={{ fontSize: '2.5rem' }}>🗓️</div>
                      <div>
                        <p style={{ color: 'var(--accent-teal)', fontWeight: 800, fontSize: '1.2rem' }}>Confirmed Session</p>
                        <p style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>{b.confirmedDate} · {b.confirmedSlot}</p>
                      </div>
                    </div>
                    {b.paymentStatus === 'verified' && (
                      <button onClick={() => printReceipt(b)} className="btn-primary" style={{ padding: '0.8rem 2rem', borderRadius: '14px', background: 'var(--accent-gold)', color: '#000', fontWeight: 700 }}>
                        🧾 Receipt
                      </button>
                    )}
                  </div>
                )}

                {isCompleted && (
                  <div style={{ marginTop: '1.5rem' }}>
                    {justReviewed ? (
                      <div style={{ background: 'rgba(111,201,111,0.1)', border: '1px solid rgba(111,201,111,0.3)', borderRadius: '15px', padding: '1.2rem', textAlign: 'center' }}>
                        <p style={{ color: '#6fc96f', fontWeight: 700, fontSize: '1.1rem' }}>🙏 Review received. Blessings!</p>
                      </div>
                    ) : !alreadyReviewed ? (
                      <ReviewForm booking={b} onDone={handleReviewDone} />
                    ) : (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', opacity: 0.6, fontStyle: 'italic' }}>✨ You've shared your light on this session.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
