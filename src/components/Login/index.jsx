import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../firebase';
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

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

export default function Login() {
  const { login } = useApp();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [tempUser, setTempUser] = useState(null); // Stores Google profile until linked
  
  const [apiKeyInput, setApiKeyInput] = useState('');

  const handleNext = () => {
    if (!email.trim() || !password.trim()) {
      alert('Please enter your email and password.');
      return;
    }
    // Set temp user for demo purposes as we transition to full backend auth
    setTempUser({ email, name: email.split('@')[0] });
    setStep(2);
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const idToken = await user.getIdToken();
      
      // Step 1: Send Firebase token to Backend
      const response = await fetch('https://mean-backend-zg5d.onrender.com/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: idToken })
      });

      if (!response.ok) {
         throw new Error('Backend failed to authenticate token.');
      }

      const data = await response.json();
      const backendJwt = data.access_token;
      
      // Step 2: Now that we have our internal JWT, check if OpenRouter API is linked
      const meResponse = await fetch('https://mean-backend-zg5d.onrender.com/me', {
         method: 'GET',
         headers: { 'Authorization': `Bearer ${backendJwt}` }
      });
      const meData = await meResponse.json();

      if (meData.has_api_key) {
         // The user already linked OpenRouter in the past! Log them in entirely.
         // Note: Fetch the cleartext key via the secure endpoint to seed the UI
         const keyResp = await fetch('https://mean-backend-zg5d.onrender.com/me/api_key', {
            headers: { 'Authorization': `Bearer ${backendJwt}` }
         });
         const keyData = await keyResp.json();
         login({ id: user.email, name: user.displayName, apiKey: keyData.openrouter_api_key, jwt: backendJwt });
      } else {
         // They are authenticated, but need to link OpenRouter! Let's save standard details to state and go to Step 2
         setTempUser({ email: user.email, name: user.displayName, jwt: backendJwt });
         setStep(2);
      }
    } catch (err) {
      console.error(err);
      alert('Google Login Failed. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (!apiKeyInput.trim()) {
      alert('Please enter your OpenRouter API key to continue.');
      return;
    }

    // Connect OpenRouter API to new backend
    if (tempUser?.jwt) {
      const response = await fetch('https://mean-backend-zg5d.onrender.com/update-api-key', {
        method: 'POST',
        headers: { 
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${tempUser.jwt}` 
        },
        body: JSON.stringify({ api_key: apiKeyInput.trim() })
      });
      if (!response.ok) {
         alert("Failed to link API key!");
         return;
      }
    }
    
    // Fallback: local session login directly
    login({ id: tempUser?.email || email, name: tempUser?.name || email.split('@')[0], apiKey: apiKeyInput.trim() });
  };

  return (
    <div className="login-wrapper">
      <div className="login-card-ds">
        {step === 1 ? (
          <>
            <div className="login-brand-ds">
              <span className="login-logo-text-ds">Mean <span className="logo-ai-accent">AI</span></span>
            </div>

            <div className="login-fields-ds">
              <div className="login-input-group">
                <input
                  type="text"
                  className="login-input-ds"
                  placeholder="Phone number / email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="login-input-group">
                <input
                  type={showPassword ? "text" : "password"}
                  className="login-input-ds"
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleNext()}
                />
                <button className="ds-eye-btn" onClick={() => setShowPassword(!showPassword)}>
                  <EyeIcon />
                </button>
              </div>
            </div>

            <div className="ds-legal-text">
              By signing up or logging in, you consent to Mean AI's <br/>
              <a href="#">Terms of Use</a> and <a href="#">Privacy Policy</a>.
            </div>

            <div className="ds-links-row">
              <a href="#" className="ds-link">Forgot password?</a>
              <a href="#" className="ds-link">Sign up</a>
            </div>

            <button className="ds-login-btn orange-btn" onClick={handleNext}>
              Log in
            </button>

            <div className="ds-divider">
              <span className="ds-divider-line"></span>
              <span className="ds-divider-icon">
                <button className="ds-social-circle" onClick={handleGoogleLogin}>
                  <GoogleIcon />
                </button>
              </span>
              <span className="ds-divider-line"></span>
            </div>
          </>
        ) : (
          <>
            <div className="login-brand-ds">
              <span className="login-logo-text-ds">Link OpenRouter</span>
            </div>
            
            <p className="login-subtitle-ds">
              Mean AI uses OpenRouter for models. Link your account or provide an API key.
            </p>

            <div className="login-fields-ds">
              <input
                type="password"
                className="login-input-ds"
                placeholder="OpenRouter API Key (sk-or-v1-...)"
                value={apiKeyInput}
                onChange={e => setApiKeyInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                autoFocus
              />
            </div>

            <button className="ds-login-btn orange-btn" onClick={handleSubmit} style={{ marginTop: '20px' }}>
              Connect & Start
            </button>
            <button className="ds-back-btn" onClick={() => setStep(1)}>
              Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}
