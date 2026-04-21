import React from 'react';

const OFFICE_PHONE = import.meta.env.VITE_OFFICE_PHONE || "9751442007";
const OFFICE_ADDR = "Mailpatti, Vellore, Tamil Nadu - 635805";

export default function Footer({ setView }) {
  return (
    <footer style={{
      marginTop: '100px',
      padding: '60px 20px 120px',
      background: 'rgba(10, 25, 47, 0.6)',
      borderTop: '1px solid rgba(212, 175, 55, 0.2)',
      backdropFilter: 'blur(15px)',
      color: 'var(--text-primary)',
      position: 'relative',
      zIndex: 10
    }}>
      <div className="container" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '50px'
      }}>
        {/* About Section */}
        <div>
          <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1.5rem', fontFamily: 'var(--font-heading)', fontSize: '1.8rem' }}>Shri Namo Narayanaya</h3>
          <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
            Led by Sri RKJ Thulasera Acharya, we provide authentic Vedic guidance, Vaasthu planning, and divine remedies. 
            Rooted in tradition, serving seekers with spiritual truth.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 style={{ color: 'var(--accent-gold)', marginBottom: '1.5rem', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Navigation</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <span onClick={() => { setView('home'); window.scrollTo(0,0); }} style={linkStyle}>Namaste (Home)</span>
            <span onClick={() => { setView('home'); document.getElementById('services')?.scrollIntoView(); }} style={linkStyle}>Sacred Services</span>
            <span onClick={() => { setView('home'); document.getElementById('book')?.scrollIntoView(); }} style={linkStyle}>Book Consultation</span>
          </div>
        </div>

        {/* Contact Info */}
        <div>
          <h4 style={{ color: 'var(--accent-gold)', marginBottom: '1.5rem', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Contact Details</h4>
          <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.8rem' }}>📍 {OFFICE_ADDR}</p>
          <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.7)', marginBottom: '2rem' }}>📞 +91 {OFFICE_PHONE}</p>
          
          <div style={{ display: 'flex', gap: '1.2rem' }}>
            {/* REAL SOCIAL ICONS */}
            <a href="#" style={iconStyle} aria-label="Facebook">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a href={`https://wa.me/91${OFFICE_PHONE}`} style={iconStyle} aria-label="WhatsApp">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7 8.38 8.38 0 0 1 3.8.9L21 3z"/></svg>
            </a>
            <a href="#" style={iconStyle} aria-label="Instagram">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </a>
          </div>
        </div>
      </div>

      {/* Branding */}
      <div style={{
        marginTop: '80px',
        paddingTop: '40px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        textAlign: 'center'
      }}>
        <p style={{ 
          fontSize: '0.85rem', 
          color: 'var(--accent-gold)', 
          fontWeight: 700, 
          letterSpacing: '3px',
          opacity: 0.9
        }}>
          BUILT BY INCOGNITO BUILDERS
        </p>
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: '12px' }}>
          © 2026 Shri Namo Narayanaya Astrology. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}

const linkStyle = {
  fontSize: '0.95rem',
  color: 'rgba(255,255,255,0.6)',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  display: 'block'
};

const iconStyle = {
  width: '42px',
  height: '42px',
  borderRadius: '50%',
  border: '1.5px solid rgba(212, 175, 55, 0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--accent-gold)',
  transition: 'all 0.3s ease',
  cursor: 'pointer'
};
