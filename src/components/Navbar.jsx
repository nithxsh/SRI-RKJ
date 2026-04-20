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
              <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                <path d="M12.2,3c-0.9,0-1.8,0.1-2.6,0.4C8.7,3.6,8,4.1,7.5,4.7S6.6,6,6.4,6.8S6.2,8.4,6.2,9.3c0,1.8,0.6,3.4,1.8,4.7c1.3,1.3,2.9,2,4.8,2c1.8,0,3.4-0.7,4.7-2c1.3-1.3,2-2.9,2-4.7c0-0.9-0.2-1.8-0.5-2.6c-0.3-0.8-0.8-1.5-1.5-2.1c-0.6-0.6-1.4-1-2.2-1.3C14.1,3.1,13.2,3,12.2,3z M12.2,14.3c-1.3,0-2.5-0.5-3.5-1.5c-1-1-1.5-2.1-1.5-3.5c0-1.3,0.5-2.5,1.5-3.5c1-1,2.1-1.5,3.5-1.5s2.5,0.5,3.5,1.5c1,1,1.5,2.1,1.5,3.5c0,1.3-0.5,2.5-1.5,3.5C14.7,13.8,13.6,14.3,12.2,14.3z M21.8,13.5c-0.4-0.8-1-1.3-1.8-1.6l-0.3,1.4c0.5,0.2,0.9,0.5,1.2,1c0.3,0.4,0.5,1,0.5,1.6s-0.2,1.2-0.5,1.6c-0.3,0.5-0.8,0.8-1.4,1c-0.6,0.2-1.2,0.3-1.9,0.3c-0.7,0-1.3-0.1-1.9-0.3c-0.6-0.2-1.1-0.5-1.4-1c-0.3-0.5-0.5-1-0.5-1.6c0-0.6,0.2-1.1,0.5-1.6c0.3-0.4,0.7-0.7,1.2-1l-0.3-1.4c-0.8,0.3-1.4,0.8-1.8,1.6c-0.4,0.8-0.6,1.6-0.6,2.5c0,0.9,0.2,1.8,0.6,2.5s1,1.2,1.7,1.6s1.6,0.6,2.6,0.6s1.9-0.2,2.6-0.6s1.3-1,1.7-1.6C22,18.4,22.2,17.5,22.2,16.5C22.2,15.2,22.1,14.3,21.8,13.5z M8.2,13.5c-0.3,0.8-1,1.3-1.8,1.6l-0.3-1.4c0.5-0.2,0.9-0.5,1.2-1c0.3-0.4,0.5-1,0.5-1.6s-0.2-1.2-0.5-1.6C7,9,6.5,8.7,5.9,8.5c-0.6-0.2-1.2-0.3-1.9-0.3c-0.7,0-1.3,0.1-1.9,0.3c-0.6,0.2-1.1,0.5-1.4,1c-0.3,0.5-0.5,1-0.5,1.6c0,0.6,0.2,1.1,0.5,1.6c0.3,0.4,0.7,0.7,1.2,1l-0.3,1.4C0.8,14.8,0.2,14.3,0.2,13.5C0.2,12.6,0,11.8,0,10.5c0-1.8,0.6-3.4,1.8-4.7c1.2-1.3,2.8-2,4.6-2s3.4,0.7,4.6,2c1.2,1.3,1.8,2.9,1.8,4.7c0,1-0.2,1.8-0.6,2.5L8.2,13.5z" />
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
