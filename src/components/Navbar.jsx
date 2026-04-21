import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../index.css';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

export default function Navbar({ setView, currentView }) {
  const { currentUser, logout } = useAuth();
  const isAdmin = currentUser?.email === ADMIN_EMAIL;

  const handleLogout = async () => {
    try {
      await logout();
      setView('home');
    } catch {
      console.error("Failed to log out");
    }
  };

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="navbar desktop-nav glass-panel" style={{ display: 'flex', justifyContent: 'center' }}>
        <div className="navbar-content" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="logo" onClick={() => setView('home')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <img src="/favicon.png" alt="Logo" style={{ width: '30px', height: '30px', borderRadius: '4px' }} />
            <span style={{ color: 'var(--accent-gold)', letterSpacing: '1px', fontWeight: 700, fontSize: '1.1rem' }}>
              SRI NAMO NARAYANAYA
            </span>
          </div>
          
          <div className="nav-links">
            <button className={`nav-tab ${currentView === 'home' ? 'active' : ''}`} onClick={() => setView('home')}>Home</button>
            <button className="nav-tab" onClick={() => {
               setView('home');
               setTimeout(() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' }), 100);
            }}>Services</button>
            
            {isAdmin && (
              <button className={`nav-tab ${currentView === 'admin' ? 'active' : ''}`} onClick={() => setView('admin')} style={{ color: 'var(--accent-teal)', fontWeight: 700 }}>🛡 Admin</button>
            )}
            
            {currentUser && (
              <button className={`nav-tab ${currentView === 'profile' ? 'active' : ''}`} onClick={() => setView('profile')}>Profile</button>
            )}
            
            {!currentUser ? (
              <button className="btn-primary nav-btn" onClick={() => setView('login')} style={{ marginLeft: '1rem', padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}>Login</button>
            ) : (
              <button className="nav-tab" onClick={handleLogout} style={{ opacity: 0.6 }}>Logout</button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation (CLEAN 4-ICON STYLE) */}
      <nav className="mobile-nav" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="mobile-nav-items" style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', height: '65px' }}>
          
          {/* 1. Main Page */}
          <button 
            className={`mobile-nav-item ${currentView === 'home' ? 'active' : ''}`} 
            onClick={() => setView('home')}
            style={navItemStyle}
          >
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span style={labelStyle}>Main Page</span>
          </button>
          
          {/* 2. Service Offered */}
          <button 
            className="mobile-nav-item" 
            onClick={() => {
                 setView('home');
                 setTimeout(() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' }), 100);
            }}
            style={navItemStyle}
          >
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
            </svg>
            <span style={labelStyle}>Services</span>
          </button>

          {/* 3. Book Now */}
          <button 
            className="mobile-nav-item" 
            onClick={() => {
              if (window._openBookingModal) window._openBookingModal();
              else {
                setView('home');
                setTimeout(() => window._openBookingModal?.(), 300);
              }
            }}
            style={navItemStyle}
          >
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M12 14v4M10 16h4"/>
            </svg>
            <span style={labelStyle}>Book Now</span>
          </button>

          {/* 4. Profile / Login */}
          <button 
            className={`mobile-nav-item ${currentView === 'profile' || currentView === 'login' ? 'active' : ''}`} 
            onClick={() => currentUser ? setView('profile') : setView('login')}
            style={navItemStyle}
          >
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            <span style={labelStyle}>{currentUser ? 'Profile' : 'Login'}</span>
          </button>
          
        </div>
      </nav>
    </>
  );
}

const navItemStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4px',
  background: 'none',
  border: 'none',
  color: 'rgba(255,255,255,0.6)',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  flex: 1
};

const labelStyle = {
  fontSize: '10px',
  fontWeight: 500,
  letterSpacing: '0.3px'
};
