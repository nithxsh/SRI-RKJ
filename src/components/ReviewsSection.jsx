import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

function StarDisplay({ rating }) {
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1,2,3,4,5].map(s => (
        <span key={s} style={{ fontSize: '1.1rem', color: s <= rating ? '#D4AF37' : 'rgba(255,255,255,0.15)' }}>★</span>
      ))}
    </div>
  );
}

export default function ReviewsSection() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'), limit(20));
        const snap = await getDocs(q);
        setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.warn('Reviews fetch error:', err.message);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, []);

  if (loading || reviews.length === 0) return null;

  return (
    <section className="container" style={{ marginBottom: '6rem' }}>
      <h2 style={{
        fontFamily: 'var(--font-heading)', color: 'var(--accent-gold)',
        fontSize: '2rem', textAlign: 'center', marginBottom: '0.5rem', letterSpacing: '3px'
      }}>
        SEEKER TESTIMONIALS
      </h2>
      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '3rem', fontSize: '0.95rem' }}>
        Words from those who walked the cosmic path
      </p>

      {/* Scrolling reviews */}
      <div style={{ overflow: 'hidden', maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
        <div style={{
          display: 'flex', gap: '1.5rem',
          animation: 'marqueeScroll 35s linear infinite',
          width: 'max-content'
        }}>
          {[...reviews, ...reviews].map((r, i) => (
            <div key={i} className="glass-panel" style={{
              minWidth: '300px', maxWidth: '300px', padding: '1.8rem',
              borderRadius: '16px', borderTop: '3px solid var(--accent-gold)',
              flexShrink: 0
            }}>
              <StarDisplay rating={r.rating} />
              <p style={{
                color: 'var(--text-primary)', fontSize: '0.92rem',
                lineHeight: '1.6', margin: '0.8rem 0 1.2rem',
                fontStyle: 'italic'
              }}>
                "{r.comment}"
              </p>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '0.8rem' }}>
                <p style={{ color: 'var(--accent-gold)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                  — {r.userName}
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                  {r.service} · {r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marqueeScroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}
