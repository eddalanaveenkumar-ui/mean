import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth, googleProvider } from '../../firebase';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import './Login.css';

// Google icon SVG
const GoogleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

// Helper: fetch with timeout
const fetchWithTimeout = (url, options = {}, timeoutMs = 45000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
};

export default function Login() {
  const { login } = useApp();
  const [step, setStep] = useState(1);
  const [tempUser, setTempUser] = useState(null); 
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Authenticating securely...');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [checks, setChecks] = useState({ terms: false, privacy: false, data: false });
  const allChecked = checks.terms && checks.privacy && checks.data;

  // Show skip button after 8 seconds of loading
  useEffect(() => {
    let skipTimer, msgTimer;
    if (isLoading) {
      msgTimer = setTimeout(() => {
        setLoadingMsg('Waking up secure server... this may take a moment.');
      }, 10000);
    } else {
      setLoadingMsg('Authenticating securely...');
    }
    return () => { clearTimeout(msgTimer); };
  }, [isLoading]);


  // Intercept openrouter and firebase auth redirect
  useEffect(() => {
    // 1. Firebase redirect handler
    getRedirectResult(auth).then(async (result) => {
      if (result && result.user) {
        setIsLoading(true);
        setFirebaseUser(result.user);
        try {
          const idToken = await result.user.getIdToken();
          await processBackendAuth(result.user, idToken);
        } catch(e) {
          console.error('Redirect auth error:', e);
          // Fall through to Step 2 gracefully
          setTempUser({
            email: result.user.email,
            name: result.user.displayName || 'User',
            jwt: null,
            photoURL: result.user.photoURL
          });
          setStep(2);
        } finally {
          setIsLoading(false);
        }
      }
    }).catch(err => {
      console.error("Redirect login error:", err);
      setIsLoading(false);
    });

    // 2. OpenRouter OAuth redirect
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      window.history.replaceState({}, document.title, window.location.pathname);
      setIsLoading(true);
      
      const savedTemp = sessionStorage.getItem('mean_temp_user');
      if (savedTemp && savedTemp !== 'null') {
         try {
            setTempUser(JSON.parse(savedTemp));
         } catch(e){}
      }

      fetch('https://openrouter.ai/api/v1/auth/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      })
      .then(r => r.json())
      .then(data => {
         if (data.key) {
            setApiKeyInput(data.key);
            const theKey = data.key;
            if (savedTemp && savedTemp !== 'null') {
                const u = JSON.parse(savedTemp);
                if (u.jwt) {
                  fetchWithTimeout('https://mean-backend-nine.vercel.app/update-api-key', {
                      method: 'POST',
                      headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${u.jwt}` 
                      },
                      body: JSON.stringify({ api_key: theKey })
                  }).then(() => {
                      login({ id: u.email, name: u.name, apiKey: theKey, jwt: u.jwt, photoURL: u.photoURL });
                  }).catch(() => {
                      // Backend save failed, but still log in locally
                      login({ id: u.email, name: u.name, apiKey: theKey, jwt: u.jwt, photoURL: u.photoURL });
                  });
                } else {
                  login({ id: u.email, name: u.name, apiKey: theKey, photoURL: u.photoURL });
                }
            } else {
                login({ id: 'user', name: 'User', apiKey: theKey });
            }
         } else {
            alert('Failed to obtain OpenRouter Key.');
            setStep(2);
         }
      })
      .catch(err => {
         console.error(err);
         alert('Failed to connect to OpenRouter.');
      })
      .finally(() => {
         setIsLoading(false);
      });
    }
  }, []);

  // Reusable backend linkage
  const processBackendAuth = async (user, idToken, overrideName = null) => {
      setLoadingMsg('Connecting to secure server...');

      // Step 1: Retry loop — Render free tier spins down, first attempt wakes it up
      let response = null;
      let lastError = null;
      const maxAttempts = 3;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
              if (attempt > 1) {
                  setLoadingMsg(`Waking up server... (attempt ${attempt}/${maxAttempts})`);
              }

              const res = await fetchWithTimeout('https://mean-backend-nine.vercel.app/google-login', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ token: idToken })
              }, attempt === 1 ? 10000 : 45000); // short timeout first time (503 comes fast)

              if (!res.ok) throw new Error(`Server returned ${res.status}`);
              response = res;
              break; // Success!

          } catch (err) {
              lastError = err;
              console.warn(`Backend attempt ${attempt}/${maxAttempts} failed:`, err.message);

              if (attempt < maxAttempts) {
                  // Render free tier needs 5-15s (sometimes 30s) to wake up
                  await new Promise(r => setTimeout(r, 12000));
              }
          }
      }

      if (!response) {
          throw lastError || new Error('Unable to reach backend server.');
      }

      const data = await response.json();
      const backendJwt = data.access_token;
      
      setLoadingMsg('Checking your account...');

      // Step 2: Check if OpenRouter API is linked
      const meResponse = await fetchWithTimeout('https://mean-backend-nine.vercel.app/me', {
         method: 'GET',
         headers: { 'Authorization': `Bearer ${backendJwt}` }
      });
      const meData = await meResponse.json();

      let finalName = overrideName || user.displayName || user.email.split('@')[0];

      if (meData.has_api_key) {
         // Log them in entirely.
         const keyResp = await fetchWithTimeout('https://mean-backend-nine.vercel.app/me/api_key', {
            headers: { 'Authorization': `Bearer ${backendJwt}` }
         });
         const keyData = await keyResp.json();
         login({ id: user.email, name: finalName, apiKey: keyData.openrouter_api_key, jwt: backendJwt, photoURL: user.photoURL });
      } else {
         // Ask for API key
         setTempUser({ email: user.email, name: finalName, jwt: backendJwt, photoURL: user.photoURL });
         setStep(2);
      }
  };

  const handleGoogleLogin = async (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setLoadingMsg('Authenticating with Google...');

    // Detect Capacitor environment
    const isCapacitor = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();

    if (isCapacitor) {
      // Use native Google Sign-In (shows native account picker popup)
      try {
        const nativeResult = await FirebaseAuthentication.signInWithGoogle();
        // Get the ID token from the native sign-in
        const idToken = nativeResult.credential?.idToken;
        if (idToken) {
          // Create a Firebase credential from the native token
          const credential = GoogleAuthProvider.credential(idToken);
          const userCredential = await signInWithCredential(auth, credential);
          setFirebaseUser(userCredential.user);
          setLoadingMsg('Connecting to secure server...');
          const firebaseIdToken = await userCredential.user.getIdToken();
          await processBackendAuth(userCredential.user, firebaseIdToken);
        } else {
          throw new Error('No ID token received from native sign-in');
        }
      } catch (err) {
        console.error('Native Google sign-in error:', err);
        if (err.message && !err.message.includes('canceled')) {
          alert('Login error: ' + (err.code || '') + ' ' + (err.message || JSON.stringify(err)));
        }
        setIsLoading(false);
      }
      return;
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      setFirebaseUser(result.user);
      setLoadingMsg('Connecting to secure server...');
      const idToken = await result.user.getIdToken();
      try {
        await processBackendAuth(result.user, idToken);
      } catch (backendErr) {
        // Backend is unreachable (CORS, network, or server down) — fall through to Step 2
        console.warn('Backend unreachable, continuing with local login:', backendErr);
        setTempUser({
          email: result.user.email,
          name: result.user.displayName || result.user.email?.split('@')[0] || 'User',
          jwt: null,
          photoURL: result.user.photoURL
        });
        setStep(2);
      }
    } catch (err) {
      console.error('Google login error:', err);
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/operation-not-supported-in-this-environment') {
          // COOP policy may block popup — try redirect instead
          signInWithRedirect(auth, googleProvider);
          return;
      } else if (err.name === 'AbortError') {
          setTempUser({
            email: firebaseUser?.email || 'user',
            name: firebaseUser?.displayName || 'User',
            jwt: null,
            photoURL: firebaseUser?.photoURL
          });
          setStep(2);
      } else if (err.code === 'auth/internal-error') {
          // Attempt redirect as fallback for COOP/network issues
          console.warn('Sign-in popup failed (internal-error), trying redirect...');
          try {
            await signInWithRedirect(auth, googleProvider);
          } catch (redirectErr) {
            console.error('Redirect also failed:', redirectErr);
            alert(`Login failed. This could be due to:

1. Your browser blocking the sign-in popup — allow popups for this site
2. A network issue reaching Firebase servers — check your internet connection
3. An ad-blocker or VPN interfering — try disabling it temporarily

Error: ${err.message}`);
          }
      } else if (err.code !== 'auth/popup-closed-by-user') {
          alert(`Login failed: ${err.message || 'Please try again.'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!apiKeyInput.trim()) {
      alert('Please enter your OpenRouter API key to continue.');
      return;
    }

    setIsLoading(true);
    try {
        // Try to connect to backend if we have a JWT
        if (tempUser?.jwt) {
          try {
            const response = await fetchWithTimeout('https://mean-backend-nine.vercel.app/update-api-key', {
              method: 'POST',
              headers: { 
                 'Content-Type': 'application/json',
                 'Authorization': `Bearer ${tempUser.jwt}` 
              },
              body: JSON.stringify({ api_key: apiKeyInput.trim() })
            }, 15000);
            if (!response.ok) {
              console.warn('Backend API key save failed, proceeding locally.');
            }
          } catch(e) {
            console.warn('Backend unavailable, proceeding locally.');
          }
        }
        
        // Login locally regardless
        login({ id: tempUser?.email || 'user', name: tempUser?.name || 'User', apiKey: apiKeyInput.trim(), jwt: tempUser?.jwt, photoURL: tempUser?.photoURL });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card-ds">
        {isLoading ? (
          <div className="login-spinner-overlay">
            <div className="atom-loader">
              <div className="atom-nucleus"></div>
              <div className="atom-orbit atom-orbit-1"><div className="atom-electron"></div></div>
              <div className="atom-orbit atom-orbit-2"><div className="atom-electron"></div></div>
              <div className="atom-orbit atom-orbit-3"><div className="atom-electron"></div></div>
            </div>
            <div className="loading-text" style={{ textAlign: 'center', lineHeight: '1.6' }}>
              {loadingMsg}
            </div>
          </div>
        ) : step === 1 ? (
          <>
            <div className="login-brand-ds">
              <span className="login-logo-text-ds">Continue to MeanAI</span>
            </div>

            <p className="login-subtitle-ds" style={{ textAlign: 'center', marginBottom: '24px', marginTop: '10px' }}>
               Login to access your personalized AI learning and chat experience.
            </p>

            <div className="ds-checklist">
              <label className="ds-check-item">
                <input type="checkbox" checked={checks.terms} onChange={() => setChecks(p => ({...p, terms: !p.terms}))} className="ds-checkbox" />
                <span>I agree to the <Link to="/terms" target="_blank" rel="noopener noreferrer">Terms & Conditions</Link></span>
              </label>
              <label className="ds-check-item">
                <input type="checkbox" checked={checks.privacy} onChange={() => setChecks(p => ({...p, privacy: !p.privacy}))} className="ds-checkbox" />
                <span>I accept the <Link to="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</Link></span>
              </label>
              <label className="ds-check-item">
                <input type="checkbox" checked={checks.data} onChange={() => setChecks(p => ({...p, data: !p.data}))} className="ds-checkbox" />
                <span>I consent to data usage for AI services</span>
              </label>
            </div>

            <button type="button" className={`premium-google-btn ${!allChecked ? 'btn-disabled' : ''}`} onClick={handleGoogleLogin} disabled={!allChecked}>
              <GoogleIcon /> Continue with Google
            </button>
          </>
        ) : (
          <>
            <div className="login-brand-ds">
              <span className="login-logo-text-ds">Link OpenRouter</span>
            </div>
            
            <p className="login-subtitle-ds">
              Mean AI uses OpenRouter for models. Connect your account to automatically provision an API key.
            </p>

            <button 
              className="ds-login-btn" 
              onClick={(e) => {
                  e.preventDefault();
                  if (tempUser) {
                      sessionStorage.setItem('mean_temp_user', JSON.stringify(tempUser));
                  }
                  window.location.href = `https://openrouter.ai/auth?callback_url=${window.location.origin}`;
              }} 
              style={{ backgroundColor: '#171717', color: 'white', border: '1px solid #333', marginTop: '20px', borderRadius: '50px' }}
            >
              Connect with OpenRouter
            </button>
            
            <div className="ds-divider" style={{ margin: '15px 0' }}>
              <span className="ds-divider-line"></span>
              <span className="ds-divider-text" style={{ fontSize: '12px', color: '#888', padding: '0 10px' }}>OR</span>
              <span className="ds-divider-line"></span>
            </div>

            <div className="login-fields-ds">
              <input
                type="password"
                className="login-input-ds"
                placeholder="Manual API Key (sk-or-v1-...)"
                value={apiKeyInput}
                onChange={e => setApiKeyInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                autoFocus
              />
            </div>

            <button className="ds-login-btn orange-btn" onClick={handleSubmit} style={{ marginTop: '15px' }}>
              Link & Continue
            </button>
          </>
        )}
      </div>
    </div>
  );
}
