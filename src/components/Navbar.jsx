import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../index.css';

const ADMIN_EMAIL = 'nithishog31@gmail.com';

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
            
            {currentUser ? (
              <>
                {isAdmin ? (
                  <button
                    className={`nav-tab ${currentView === 'admin' ? 'active' : ''}`}
                    onClick={() => setView('admin')}
                    style={{ color: '#20B2AA' }}
                  >
                    🛡 Admin
                  </button>
                ) : (
                  <button
                    className={`nav-tab ${currentView === 'dashboard' ? 'active' : ''}`}
                    onClick={() => setView('dashboard')}
                  >
                    Dashboard
                  </button>
                )}
                <button
                  className="btn-secondary nav-btn"
                  onClick={handleLogout}
                  style={{ marginLeft: '1rem', padding: '0.6rem 1.5rem', background: 'transparent', border: '1px solid var(--accent-gold)', fontSize: '0.9rem' }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button className="btn-primary nav-btn" onClick={() => setView('login')} style={{ marginLeft: '1rem', padding: '0.6rem 1.5rem', fontSize: '0.9rem' }}>Login / Portal</button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation (Instagram Style) */}
      <nav className="mobile-nav">
        <div className="mobile-nav-items">
          <button 
            className={`mobile-nav-item cursor-pointer ${currentView === 'home' ? 'active' : ''}`} 
            onClick={() => setView('home')}
            aria-label="Home"
          >
            <span className="icon">
              {currentView === 'home' ? (
                <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M12 2.099l10 7.273v10.628c0 1.104-.896 2-2 2h-5V14h-6v8h-5c-1.104 0-2-.896-2-2V9.372l10-7.273z"/></svg>
              ) : (
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.099l10 7.273v10.628c0 1.104-.896 2-2 2h-5V14h-6v8h-5c-1.104 0-2-.896-2-2V9.372l10-7.273z"/></svg>
              )}
            </span>
          </button>
          
          <button 
            className="mobile-nav-item cursor-pointer" 
            onClick={() => {
                 setView('home');
                 setTimeout(() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' }), 100);
            }}
            aria-label="Services"
          >
            <span className="icon">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"/></svg>
            </span>
          </button>

          {/* Center Action (Book) */}
          <button className="main-action cursor-pointer" onClick={() => {
               setView('home');
               setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 300);
          }}>
            <div className="icon" style={{ color: '#000' }}>
              <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                <path d="M2.5,7V17A2.5,2.5,0,0,0,5,19.5H19A2.5,2.5,0,0,0,21.5,17V7A2.5,2.5,0,0,0,19,4.5H5A2.5,2.5,0,0,0,2.5,7ZM19,18H5a1,1,0,0,1-1-1v-.8a2.5,2.5,0,0,0,0-4.4V7a1,1,0,0,1,1-1H19a1,1,0,0,1,1,1v4.8a2.5,2.5,0,0,0,0,4.4V17A1,1,0,0,1,19,18Z" />
              </svg>
            </div>
          </button>

          <button 
            className={`mobile-nav-item cursor-pointer ${(currentView === 'admin' || currentView === 'dashboard') ? 'active' : ''}`} 
            onClick={() => setView(isAdmin ? 'admin' : 'dashboard')}
            aria-label="Portal"
          >
            <span className="icon">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
            </span>
          </button>
          
          <button 
            className="mobile-nav-item cursor-pointer" 
            onClick={currentUser ? handleLogout : () => setView('login')}
            aria-label={currentUser ? 'Logout' : 'Login'}
          >
            <span className="icon">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
