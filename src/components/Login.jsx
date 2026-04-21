import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../index.css';

export default function Login({ setView }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup, loginWithGoogle } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      if (isRegistering) {
        await signup(email, password);
      } else {
        await login(email, password);
      }
      setView('home');
    } catch (err) {
      setError(err.message || 'Failed to authenticate');
    }
    setLoading(false);
  }

  async function handleGoogleLogin() {
    try {
      setLoading(true);
      await loginWithGoogle();
      setView('home');
    } catch (err) {
      setError('Failed to sign in with Google');
    }
    setLoading(false);
  }

  return (
    <div className="container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '120px', paddingBottom: '60px' }}>
      <div className="glass-panel" style={{ maxWidth: '450px', width: '100%', padding: '3rem', textAlign: 'center', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
        <h2 style={{ fontSize: '2rem', color: 'var(--accent-gold)', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>
          {isRegistering ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          {isRegistering ? 'Sign up to manage your consultations.' : 'Sign in to access your secure dashboard.'}
        </p>

        {error && <div style={{ background: 'rgba(234, 67, 53, 0.1)', color: '#EA4335', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'left', fontSize: '0.95rem', borderLeft: '3px solid #EA4335' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginBottom: '2rem' }}>
          <div style={{ textAlign: 'left' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)', fontSize: '0.95rem' }}>Email Address</label>
            <input 
              type="email" 
              placeholder="you@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '1rem', transition: 'border-color 0.3s' }}
            />
          </div>
          <div style={{ textAlign: 'left' }}>
             <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)', fontSize: '0.95rem' }}>Password</label>
             <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '1rem', transition: 'border-color 0.3s' }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={() => setView('home')} className="btn-secondary" style={{ flex: 1, padding: '1rem', fontSize: '1.1rem', borderRadius: '8px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', transition: 'background 0.3s' }} onMouseEnter={(e) => e.target.style.background='rgba(255,255,255,0.05)'} onMouseLeave={(e) => e.target.style.background='transparent'}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1, padding: '1rem', fontSize: '1.1rem', borderRadius: '8px' }}>
              {isRegistering ? 'Sign Up' : 'Log In'}
            </button>
          </div>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', opacity: 0.6 }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.2)' }}></div>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.2)' }}></div>
        </div>

        <button 
          onClick={handleGoogleLogin} 
          disabled={loading}
          style={{ width: '100%', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', background: '#ffffff', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'transform 0.3s, box-shadow 0.3s' }}
          className="google-btn"
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 5px 15px rgba(255,255,255,0.2)' }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
        >
          <svg viewBox="0 0 24 24" width="22" height="22">
            <path fill="#4285F4" d="M23.7449 12.27c0-.825-.075-1.62-.215-2.385H12v4.515h6.585c-.285 1.455-1.08 2.685-2.28 3.51v2.91h3.69c2.16-1.995 3.405-4.935 3.405-8.55z" />
            <path fill="#34A853" d="M12 24c3.3 0 6.075-1.095 8.1-2.97l-3.69-2.91c-1.095.735-2.505 1.17-4.41 1.17-3.405 0-6.285-2.31-7.32-5.415H.885v3.015C2.925 20.94 7.14 24 12 24z" />
            <path fill="#FBBC05" d="M4.68 14.865c-.27-.81-.42-1.68-.42-2.565 0-.885.15-1.755.42-2.565V6.72H.885C.315 7.845 0 9.045 0 10.3c0 1.255.315 2.455.885 3.58l3.795-2.935z" />
            <path fill="#EA4335" d="M12 4.71c1.8 0 3.42.615 4.695 1.83l3.525-3.525C18.075 1.095 15.3 0 12 0 7.14 0 2.925 3.06.885 6.72l3.795 2.935C5.715 6.555 8.595 4.71 12 4.71z" />
          </svg>
          <span style={{ fontWeight: 600, fontSize: '1.05rem' }}>Continue with Google</span>
        </button>

        <p style={{ marginTop: '2.5rem', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
          <button onClick={() => setIsRegistering(!isRegistering)} style={{ background: 'none', border: 'none', color: 'var(--accent-gold)', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer', fontSize: '0.95rem', padding: 0 }}>
            {isRegistering ? 'Log In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}
