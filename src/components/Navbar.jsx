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

      {/* Mobile Bottom Navbar */}
      <nav className="mobile-nav glass-panel">
        <div className="mobile-nav-items">
          <button className={`mobile-nav-item cursor-pointer ${currentView === 'home' ? 'active' : ''}`} onClick={() => setView('home')}>
            <span className="icon">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </span>
            <span style={{ fontSize: '0.7rem', marginTop: '2px' }}>Home</span>
          </button>
          
          <button className="mobile-nav-item cursor-pointer" onClick={() => {
               setView('home');
               setTimeout(() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' }), 100);
          }}>
            <span className="icon">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z"/></svg>
            </span>
            <span style={{ fontSize: '0.7rem', marginTop: '2px' }}>Services</span>
          </button>

          {/* Center Book Button with Pulse */}
          <button className="main-action pulse-gold cursor-pointer" onClick={() => {
               setView('home');
               setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 300);
          }}>
            <span className="icon">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="white"><path d="M12,2C6.47,2,2,6.47,2,12s4.47,10,10,10,10-4.47,10-10S17.53,2,12,2Zm0,18c-4.41,0-8-3.59-8-8s3.59-8,8-8,8,3.59,8,8-3.59,8-8,8ZM8.33,7c0,.2.04,.39,.12,.56s.21,.33,.38,.5l.48,.46c.15,.14,.27,.29,.35,.46s.12,.36,.12,.59-.04,.42-.12,.59-.2,.32-.35,.46l-.48,.46c-.17,.16-.29,.33-.38,.5s-.12,.37-.12,.58,.04,.39,.12,.58,.2,.33,.38,.5l.48,.46c.15,.14,.27,.3,.35,.46s.12,.35,.12,.57-.04,.4-.12,.57-.2,.33-.35,.46l-.48,.46c-.17,.16-.3,.33-.38,.5s-.12,.38-.12,.59,0,.39,.12,.56.21,.32,.38,.48l.48,.46c.15,.14,.27,.29,.35,.46s.12,.36,.12,.59-.04,.42-.12,.59-.2,.32-.35,.46l-.48,.46c-.17,.16-.3,.33-.38,.5s-.12,.37-.12,.58,.04,.4,.12,.58,.2,.33,.38,.5l.48,.46c.15,.14,.27,.3,.35,.46,.08,.17,.12,.35,.12,.57,0,.21-.04,.4-.12,.57s-.2,.33-.35,.46l-.48,.46c-.17,.16-.3,.33-.38,.5s-.12,.38-.12,.59c0,.48,.18,.88,.54,1.21s.79,.49,1.31,.49,1.1-.16,1.48-.49,.56-.73,.56-1.21-.18-.88-.54-1.21l-.48-.46c-0.15-0.14-0.27-0.29-0.35-0.46s-0.12-0.36-0.12-0.59,0.04-0.42,0.12-0.59,0.2-0.32,0.35-0.46l.48-0.46c0.17-0.16,0.3-0.33,0.38-0.5s0.12-0.37,0.12-0.58c0-0.21-0.04-0.4-0.12-0.58s-0.2-0.33-0.35-0.46l-0.48-0.46c-0.15-0.14-0.27-0.3-0.35-0.46s-0.12-0.35-0.12-0.57c0-0.21,0.04-0.4,0.12-0.57s0.2-0.33,0.35-0.46l.48-0.46c0.17-0.16,0.3-0.33,0.38-0.5s0.12-0.38,0.12-0.59c0-0.48-0.18-0.88-0.54-1.21s-0.79-0.49-1.31-0.49c-0.64,0-1.1,0.16-1.4,0.49s-0.45,0.73-0.45,1.21Z" /></svg>
            </span>
          </button>

          <button className={`mobile-nav-item cursor-pointer ${(currentView === 'admin' || currentView === 'dashboard') ? 'active' : ''}`} onClick={() => setView(isAdmin ? 'admin' : 'dashboard')}>
            <span className="icon">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
            </span>
            <span style={{ fontSize: '0.7rem', marginTop: '2px' }}>Portal</span>
          </button>
          
          <button className="mobile-nav-item cursor-pointer" onClick={currentUser ? handleLogout : () => setView('login')}>
            <span className="icon">
              {currentUser ? (
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
              ) : (
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>
              )}
            </span>
            <span style={{ fontSize: '0.7rem', marginTop: '2px' }}>{currentUser ? 'Exit' : 'Login'}</span>
          </button>
        </div>
      </nav>
    </>
  );
}
