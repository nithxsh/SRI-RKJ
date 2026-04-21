import React, { useState } from 'react';
import '../index.css';

export default function Astrologers() {
  const [showModal, setShowModal] = useState(false);
  const [success, setSuccess] = useState(false);

  const partners = [
    { name: 'Sri Sakthi Builders', desc: 'Vaasthu & Construction', loc: 'OMR, Chennai', icon: '🏗️' },
    { name: 'Sri Panjamugi Finance', desc: 'Financial Consulting', loc: '(P) Ltd., Vellore', icon: '💼' },
    { name: 'Mr. N. KUMAR', desc: 'Advocate (B.Sc., B.L., M.L.)', loc: 'Legal / Commissioner', icon: '⚖️' },
    { name: 'Sri Viswabramma Garments', desc: 'Exports & Business', loc: 'Bangalore', icon: '👔' },
  ];

  return (
    <section id="consultation" className="astrologers-section container" style={{ paddingTop: '100px', paddingBottom: '40px', scrollMarginTop: '60px' }}>
      <h2 className="section-title">Consultation & Booking Details</h2>
      
      <div className="astrologers-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '1000px', margin: '0 auto', marginTop: '2rem' }}>
        <div className="astro-card glass-panel" style={{ padding: '2.5rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', width: '100%', marginBottom: '2rem' }}>
            
            {/* Office Information */}
            <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(224,224,224,0.03)', borderRadius: '12px' }}>
              <h4 style={{ color: 'var(--accent-gold)', marginBottom: '1.5rem', fontSize: '1.3rem' }}>Office Information</h4>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <strong style={{ color: 'var(--accent-teal)' }}>📍 Location:</strong>
                <p style={{ marginTop: '0.3rem', lineHeight: '1.4' }}>Mailpatti (Pincode: 635805),<br/>Near Gudiyattam, Vellore District, Tamil Nadu</p>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <strong style={{ color: 'var(--accent-teal)' }}>📞 Contact:</strong>
                <p style={{ marginTop: '0.3rem' }}>{import.meta.env.VITE_OFFICE_PHONE || '9751442007'} | {import.meta.env.VITE_OFFICE_PHONE_ALT || '9865546763'}</p>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <strong style={{ color: 'var(--accent-teal)' }}>🕒 Hours of Operation:</strong>
                <p style={{ marginTop: '0.3rem' }}>Mon-Sat: 9:30 AM – 9:40 PM<br/><span style={{fontSize:'0.85rem', color: 'var(--text-secondary)'}}>(Closing at 8:40 PM on Mondays)</span></p>
                <p style={{ marginTop: '0.3rem' }}>Sunday: Closed</p>
              </div>
              
              <div>
                <strong style={{ color: 'var(--accent-teal)' }}>🌐 Social:</strong>
                <p style={{ marginTop: '0.3rem' }}><a href="#" style={{ textDecoration: 'underline', color: 'var(--text-primary)' }}>Facebook Page</a></p>
              </div>
            </div>

            {/* Quick Action / Booking */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '2rem', background: 'rgba(224,224,224,0.03)', borderRadius: '12px', textAlign: 'center' }}>
              <h4 style={{ color: 'var(--accent-gold)', marginBottom: '1rem', fontSize: '1.6rem', fontFamily: 'var(--font-heading)' }}>Schedule a Consultation</h4>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.6' }}>Seek truth and spiritual solutions through traditional Vedic astrology. Reach out to coordinate an appropriate time.</p>
              <button className="btn-secondary book-btn" onClick={() => setShowModal(true)} style={{ width: '100%', maxWidth: '300px', fontSize: '1.1rem', padding: '1rem' }}>
                Message Office
              </button>
            </div>
          </div>

          {/* Full Width Partners running boxes */}
          <div style={{ width: '100%', textAlign: 'center', padding: '1.5rem', background: 'rgba(224,224,224,0.03)', borderRadius: '12px', overflow: 'hidden' }}>
            <h4 style={{ color: 'var(--accent-gold)', marginBottom: '1.5rem', fontSize: '1.3rem' }}>Partners & Associates</h4>
            
            <div className="marquee-container">
              <div className="marquee-content">
                {[...partners, ...partners].map((partner, idx) => (
                  <div key={idx} className="partner-box">
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem', opacity: 0.9 }}>{partner.icon}</div>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>{partner.name}</strong>
                    <p style={{ marginTop: '0.4rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{partner.desc}</p>
                    <p style={{ marginTop: '0.2rem', fontSize: '0.85rem', color: 'var(--accent-gold)' }}>{partner.loc}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setSuccess(false); }}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
            <button className="close-btn" onClick={() => { setShowModal(false); setSuccess(false); }}>✕</button>
            
            {success ? (
              <div style={{ padding: '2rem 0' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🕉️</div>
                <h2 style={{ color: 'var(--accent-gold)', marginBottom: '1rem' }}>Message Sent</h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '2rem' }}>
                  Your request has been received by the divine office. Our administrator will reach out to you shortly.
                </p>
                <button className="btn-primary" onClick={() => { setShowModal(false); setSuccess(false); }} style={{ padding: '0.8rem 2.5rem', borderRadius: '30px' }}>
                  Done
                </button>
              </div>
            ) : (
              <>
                <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: 'var(--accent-gold)' }}>Contact Office</h2>
                <p className="text-secondary" style={{ marginBottom: '1.5rem' }}>Send a message to schedule your consultation.</p>
                <form className="booking-form" onSubmit={(e) => { e.preventDefault(); setSuccess(true); }}>
                  <input type="text" placeholder="Your Name" required />
                  <input type="tel" placeholder="Your Phone Number" required />
                  <input type="date" />
                  <textarea placeholder="How can we help you?" rows="3" required></textarea>
                  <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '1rem' }}>Send Request</button>
                  <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                    (Note: payment still not confirmed)
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
