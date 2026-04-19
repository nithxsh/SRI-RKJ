import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
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
    <form onSubmit={handleSubmit} style={{ marginTop: '1rem', background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '10px', padding: '1.2rem' }}>
      <p style={{ color: 'var(--accent-gold)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>⭐ Leave Your Review</p>
      <StarPicker value={rating} onChange={setRating} />
      {error && <p style={{ color: '#EA4335', fontSize: '0.82rem', marginTop: '0.4rem' }}>{error}</p>}
      <textarea
        placeholder="Share your experience... (optional)"
        value={comment}
        onChange={e => setComment(e.target.value)}
        rows={3}
        style={{ width: '100%', marginTop: '0.8rem', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', resize: 'vertical', fontSize: '0.9rem', fontFamily: 'Inter, sans-serif' }}
      />
      <button
        type="submit"
        disabled={submitting}
        className="btn-primary"
        style={{ marginTop: '0.8rem', padding: '0.7rem 1.5rem', fontSize: '0.9rem', borderRadius: '8px' }}
      >
        {submitting ? '⏳ Submitting...' : '✨ Submit Review'}
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
        // Fetch my bookings (removed orderBy to avoid manual index requirement)
        const bq = query(collection(db, 'bookings'), where('userId', '==', currentUser.uid));
        const bSnap = await getDocs(bq);
        const fetchedBookings = bSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Sort client-side by createdAt descending
        fetchedBookings.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return timeB - timeA;
        });
        
        setMyBookings(fetchedBookings);

        // Fetch reviews I've already submitted (to disable duplicate)
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
            <p>Contact: {import.meta.env.VITE_OFFICE_PHONE || '9751442007'} | {import.meta.env.VITE_OFFICE_PHONE_ALT || '9865546763'}</p>
            <p>Thank you for seeking divine guidance.</p>
            <button onclick="window.print()" class="no-print" style="margin-top: 20px; padding: 10px 20px; background: #0A192F; color: white; border: none; border-radius: 5px; cursor: pointer;">Print Receipt</button>
          </div>
        </body>
      </html>
    `);
    receiptWindow.document.close();
  }

  return (
    <section id="dashboard" className="dashboard-section container" style={{ paddingTop: '120px', minHeight: '80vh', paddingBottom: '4rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '3rem' }}>
        <h2 className="section-title" style={{ textAlign: 'left', marginBottom: '0.5rem' }}>Seeker Dashboard</h2>
        <p className="text-secondary">Welcome back, <strong style={{ color: 'var(--accent-gold)' }}>{displayName}</strong>.</p>
        {currentUser?.email && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
            🔐 Logged in as {currentUser.email}
          </p>
        )}
      </div>

      <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent-teal)' }}>📋 My Consultation Requests</h3>

      {loading ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', borderRadius: '12px' }}>
          <p style={{ color: 'var(--text-secondary)' }}>⏳ Loading your bookings...</p>
        </div>
      ) : myBookings.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', borderRadius: '12px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔮</div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>You haven't made any consultation requests yet.</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.88rem' }}>Use the "Book Now" button on the home page to schedule your session.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {myBookings.map((b) => {
            const st = STATUS_COLORS[b.status] || STATUS_COLORS.pending;
            const submittedAt = b.createdAt?.toDate ? b.createdAt.toDate().toLocaleDateString('en-IN') : '—';
            const isCompleted = b.status === 'completed';
            const alreadyReviewed = myReviews.has(b.id);
            const justReviewed = reviewedNow.has(b.id);

            return (
              <div key={b.id} className="glass-panel" style={{ padding: '1.8rem', borderRadius: '14px', borderLeft: `4px solid ${isCompleted ? '#6fc96f' : 'var(--accent-teal)'}` }}>
                {/* Top row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <h4 style={{ color: 'var(--accent-gold)', fontSize: '1.1rem', marginBottom: '0.2rem' }}>
                      {b.category} — {b.purpose === 'Other' ? b.otherPurpose || 'Other' : b.purpose}
                    </h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Submitted on {submittedAt}</p>
                  </div>
                  <span style={{ padding: '5px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, background: st.bg, color: st.color, whiteSpace: 'nowrap' }}>
                    {st.label}
                  </span>
                </div>

                {/* Details */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
                  {[['🎂 DOB', b.dob], ['🕐 Time', b.time], ['📍 Birth Place', b.birthPlace], ['📞 Mobile', b.mobile],
                    ['📅 Preferred Date', b.preferredDate], ['⏰ Preferred Slot', b.preferredSlot]].map(([label, val]) => (
                    <div key={label} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem 0.8rem', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.1rem' }}>{label}</div>
                      <div style={{ color: 'var(--text-primary)', fontSize: '0.88rem' }}>{val || '—'}</div>
                    </div>
                  ))}
                </div>

                {/* Confirmed date if exists */}
                {b.confirmedDate && (
                  <div style={{ background: 'rgba(32,178,170,0.08)', border: '1px solid rgba(32,178,170,0.25)', borderRadius: '8px', padding: '0.7rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>📅</span>
                      <div>
                        <p style={{ color: '#20B2AA', fontWeight: 600, fontSize: '0.9rem' }}>Confirmed Appointment</p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{b.confirmedDate} · {b.confirmedSlot}</p>
                      </div>
                    </div>
                    {b.paymentStatus === 'verified' && (
                      <button 
                        onClick={() => printReceipt(b)}
                        style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: 'rgba(212,175,55,0.15)', border: '1px solid var(--accent-gold)', color: 'var(--accent-gold)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        🧾 Receipt
                      </button>
                    )}
                  </div>
                )}

                {/* Review section — only for completed bookings */}
                {isCompleted && (
                  <div>
                    {justReviewed && (
                      <div style={{ background: 'rgba(111,201,111,0.1)', border: '1px solid rgba(111,201,111,0.3)', borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
                        <p style={{ color: '#6fc96f', fontWeight: 600 }}>🙏 Thank you for your review!</p>
                      </div>
                    )}
                    {!alreadyReviewed && !justReviewed && (
                      <ReviewForm booking={b} onDone={handleReviewDone} />
                    )}
                    {alreadyReviewed && !justReviewed && (
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.82rem', marginTop: '0.5rem' }}>✔ You have already reviewed this session.</p>
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
