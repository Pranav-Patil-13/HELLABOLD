import React, { useState } from 'react';
import { signInUser, signUpUser } from '../utils/supabase';
import { triggerConfettiBurst } from '../utils/confetti';

const AuthModal = ({ isOpen, onClose, onAuthSuccess }) => {
  const [mode, setMode] = useState('login'); // login, signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showConfirmationInfo, setShowConfirmationInfo] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (mode === 'login') {
        const { user, profile } = await signInUser(email, password);
        triggerConfettiBurst(e.target);
        onAuthSuccess(profile);
        onClose();
      } else {
        const { user, session, profile } = await signUpUser(email, password, fullName, phone);
        // If session is null, email confirmation is active in Supabase
        if (!session) {
          setShowConfirmationInfo(true);
        } else {
          triggerConfettiBurst(e.target);
          onAuthSuccess(profile);
          onClose();
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async (e) => {
    setLoading(true);
    setErrorMsg('');
    try {
      // Fast, pre-filled guest user
      const guestEmail = 'guest@hellabold.com';
      const guestPassword = 'password123';
      const guestName = 'Bold Guest';

      try {
        // Attempt Supabase login, if it fails because guest doesn't exist, sign up
        const { user, profile } = await signInUser(guestEmail, guestPassword);
        triggerConfettiBurst(e.target);
        onAuthSuccess(profile);
      } catch (err) {
        // Fallback: try signup if signin fails on first guest attempt
        const { user, profile } = await signUpUser(guestEmail, guestPassword, guestName);
        triggerConfettiBurst(e.target);
        onAuthSuccess(profile);
      }
      onClose();
    } catch (err) {
      console.warn('Supabase Auth failed for guest. Falling back to local mock guest session:', err);
      // Fallback to local guest profile so the user is never blocked
      const mockProfile = {
        id: 'mock-guest-uid',
        email: 'guest@hellabold.com',
        fullName: 'Bold Guest',
        role: 'customer',
        address: '',
        city: '',
        zipCode: ''
      };
      localStorage.setItem('hellabold_mock_user', JSON.stringify(mockProfile));
      triggerConfettiBurst(e.target);
      onAuthSuccess(mockProfile);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowConfirmationInfo(false);
    setMode('login');
    setEmail('');
    setPassword('');
    setFullName('');
    setPhone('');
  };

  return (
    <div className="modal-overlay auth-modal-overlay active" onClick={onClose}>
      <div 
        className="modal-container auth-modal-container" 
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '420px', padding: '2.5rem' }}
      >
        <button className="modal-close" onClick={onClose} aria-label="Close modal">×</button>
        
        {showConfirmationInfo ? (
          /* Confirmation Inbox Notification View */
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '50%', 
              backgroundColor: '#f0fff4', 
              border: '2px solid #38a169', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 1.5rem',
              color: '#38a169',
              fontSize: '2rem'
            }}>
              ✉
            </div>
            <h2 style={{ textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '900', fontSize: '1.4rem', marginBottom: '1rem' }}>
              Confirm Your Email
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '2rem' }}>
              We have sent a verification link to your email address: <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>.
              <br /><br />
              Please click the link in your inbox to confirm your account, then return here to log in.
            </p>
            <button 
              type="button" 
              className="btn btn--primary" 
              onClick={handleBackToLogin}
              style={{ width: '100%', padding: '0.9rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          /* Standard Sign In / Sign Up Forms */
          <>
            <div className="auth-modal-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h2 style={{ textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '900', fontSize: '1.5rem', marginBottom: '0.4rem' }}>
                {mode === 'login' ? 'HELLA SIGN IN' : 'HELLA SIGN UP'}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                {mode === 'login' ? 'Access your bold order vault' : 'Start your bold curation journey'}
              </p>
            </div>

            {errorMsg && (
              <div className="auth-error-alert" style={{ backgroundColor: '#fff5f5', color: '#e53e3e', padding: '0.8rem 1rem', fontSize: '0.8rem', borderLeft: '3px solid #e53e3e', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {mode === 'signup' && (
                <>
                  <div className="form-group">
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.4rem', display: 'block' }}>Full Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Virgil Abloh" 
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      required
                      style={{ width: '100%', padding: '0.8rem 1rem', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.4rem', display: 'block' }}>Phone Number</label>
                    <input 
                      type="tel" 
                      placeholder="e.g. +91 9876543210" 
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      required
                      style={{ width: '100%', padding: '0.8rem 1rem', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.4rem', display: 'block' }}>Email Address</label>
                <input 
                  type="email" 
                  placeholder="e.g. name@domain.com" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.8rem 1rem', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.4rem', display: 'block' }}>Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.8rem 1rem', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn--primary" 
                disabled={loading}
                style={{ width: '100%', padding: '1rem', marginTop: '0.5rem', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}
              >
                {loading ? 'Authenticating...' : mode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', color: 'var(--border-color)' }}>
              <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-color)' }} />
              <span style={{ padding: '0 0.8rem', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>or</span>
              <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-color)' }} />
            </div>

            {/* 1-Click Fast Guest Access */}
            <button 
              type="button" 
              className="btn btn--outline"
              onClick={handleGuestLogin}
              disabled={loading}
              style={{ width: '100%', padding: '0.9rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}
            >
              Instant Guest Sign In
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.8rem', fontSize: '0.85rem' }}>
              {mode === 'login' ? (
                <p>
                  New to HELLABOLD?{' '}
                  <button 
                    type="button" 
                    onClick={() => setMode('signup')}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontWeight: 'bold', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                  >
                    Create an account
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button 
                    type="button" 
                    onClick={() => setMode('login')}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontWeight: 'bold', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                  >
                    Sign In instead
                  </button>
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
