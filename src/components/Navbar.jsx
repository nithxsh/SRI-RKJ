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
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 10 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </span>
            <span>Home</span>
          </button>
          
          <button className="mobile-nav-item cursor-pointer" onClick={() => {
               setView('home');
               setTimeout(() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' }), 100);
          }}>
            <span className="icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
            </span>
            <span>Services</span>
          </button>

          {/* Center Book Button */}
          <button className="mobile-nav-item cursor-pointer" onClick={() => {
               setView('home');
               setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 300);
          }}>
            <div className="main-action">
              <span className="icon" style={{ fontSize: '1.8rem' }}>
                <svg viewBox="0 0 24 24" width="30" height="30" fill="var(--accent-gold)"><path d="M12,2C6.47,2,2,6.47,2,12s4.47,10,10,10,10-4.47,10-10S17.53,2,12,2Zm0,18c-4.41,0-8-3.59-8-8s3.59-8,8-8,8,3.59,8,8-3.59,8-8,8ZM8.33,7c0,.2.04,.39,.12,.56,.08,.16,.21,.33,.38,.5l.48,.46c.15,.14,.27,.29,.35,.46s.12,.36,.12,.59c0,.23-.04,.42-.12,.59-.08,.17-.2,.32-.35,.46l-.48,.46c-.17,.16-.29,.33-.38,.5s-.12,.37-.12,.58c0,.21,.04,.4,.12,.58,.08,.17,.2,.33,.38,.5l.48,.46c.15,.14,.27,.3,.35,.46s.12,.35,.12,.57c0,.21-.04,.4-.12,.57-.08,.18-.2,.33-.35,.46l-.48,.46c-.17,.16-.3,.33-.38,.5s-.12,.38-.12,.59,0,.39,.12,.56c.08,.16,.21,.32,.38,.48l.48,.46c.15,.14,.27,.29,.35,.46,.08,.17,.12,.36,.12,.59,0,.23-.04,.42-.12,.59s-.2,.32-.35,.46l-.48,.46c-.17,.16-.3,.33-.38,.5s-.12,.37-.12,.58c0,.21,.04,.4,.12,.58s.2,.33,.38,.5l.48,.46c.15,.14,.27,.3,.35,.46,.08,.17,.12,.35,.12,.57,0,.21-.04,.4-.12,.57s-.2,.33-.35,.46l-.48,.46c-.17,.16-.3,.33-.38,.5s-.12,.38-.12,.59c0,.48,.18,.88,.54,1.21s.79,.49,1.31,.49,1.1-.16,1.48-.49,.56-.73,.56-1.21-.18-.88-.54-1.21l-.48-.46c-.15-.14-.27-.29-.35-.46s-.12-.36-.12-.59c0-.23,.04-.42,.12-.59,.08-.17,.2-.32,.35-.46l.48-.46c.17-.16,.3-.33,.38-.5s.12-.37,.12-.58c0-.21-.04-.4-.12-.58s-.2-.33-.35-.46l-.48-.46c-.15-.14-.27-.3-.35-.46s-.12-.35-.12-.57c0-.21,.04-.4,.12-.57s.2-.33,.35-.46l.48-.46c.17-.16,.3-.33,.38-.5s.12-.38.12-.59c0-.48-.18-.88-.54-1.21s-.79-.49-1.31-.49c-.64,0-1.1,.16-1.4,.49s-.45,.73-.45,1.21Z" scale="1.4"/></svg>
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-gold)' }}>Book</span>
          </button>

          {currentUser ? (
            <>
              <button className={`mobile-nav-item cursor-pointer ${(currentView === 'admin' || currentView === 'dashboard') ? 'active' : ''}`} onClick={() => setView(isAdmin ? 'admin' : 'dashboard')}>
                <span className="icon">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="m3 9h18"/></svg>
                </span>
                <span>Portal</span>
              </button>
              <button className="mobile-nav-item cursor-pointer" onClick={handleLogout}>
                <span className="icon">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                </span>
                <span>Exit</span>
              </button>
            </>
          ) : (
             <>
               <button className={`mobile-nav-item cursor-pointer ${currentView === 'login' ? 'active' : ''}`} onClick={() => setView('login')}>
                <span className="icon">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <span>Login</span>
               </button>
               <button className="mobile-nav-item cursor-pointer" style={{ visibility: 'hidden', width: '30px' }}></button> 
             </>
          )}
        </div>
      </nav>
    </>
  );
}
