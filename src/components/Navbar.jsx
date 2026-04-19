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
          <div className="logo" onClick={() => setView('home')} style={{ cursor: 'pointer', color: 'var(--accent-gold)', letterSpacing: '1px' }}>
            SRI NAMO NARAYANAYA
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
            <span className="icon">🏠</span>
            <span>Home</span>
          </button>
          
          <button className="mobile-nav-item cursor-pointer" onClick={() => {
               setView('home');
               setTimeout(() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' }), 100);
          }}>
            <span className="icon">✨</span>
            <span>Services</span>
          </button>

          {/* Center Book Button */}
          <button className="mobile-nav-item cursor-pointer" onClick={() => {
               setView('home');
               setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 300);
          }}>
            <div className="main-action">
              <span className="icon" style={{ fontSize: '1.6rem' }}>🕉️</span>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-gold)' }}>Book</span>
          </button>

          {currentUser ? (
            <>
              <button className={`mobile-nav-item cursor-pointer ${(currentView === 'admin' || currentView === 'dashboard') ? 'active' : ''}`} onClick={() => setView(isAdmin ? 'admin' : 'dashboard')}>
                <span className="icon">📊</span>
                <span>Portal</span>
              </button>
              <button className="mobile-nav-item cursor-pointer" onClick={handleLogout}>
                <span className="icon">🚪</span>
                <span>Exit</span>
              </button>
            </>
          ) : (
             <>
               <button className={`mobile-nav-item cursor-pointer ${currentView === 'login' ? 'active' : ''}`} onClick={() => setView('login')}>
                <span className="icon">🔐</span>
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
