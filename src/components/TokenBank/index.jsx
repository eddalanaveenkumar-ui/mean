import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import './TokenBank.css';

// AdsTerra Social Bar script URL
const ADSTERRA_SCRIPT = 'https://pl29146535.profitablecpmratenetwork.com/35/75/0c/35750c52da61a276b26186d44fbfcc39.js';

export default function TokenBank({ isOpen, onClose }) {
  const { adTokens, addAdToken, premiumTokens } = useApp();
  const [activeAd, setActiveAd] = useState(null);
  const [adState, setAdState] = useState('idle'); // idle | playing | done
  const [timeLeft, setTimeLeft] = useState(0);
  const iframeRef = useRef(null);
  const timerRef = useRef(null);
  const AD_DURATION = 15; // seconds to watch
  
  if (!isOpen) return null;

  const ads = Array.from({ length: 10 }, (_, i) => i + 1);

  const handleWatchAd = (adId) => {
    if (activeAd || adTokens + premiumTokens >= 10) return;
    
    setActiveAd(adId);
    setAdState('playing');
    setTimeLeft(AD_DURATION);

    // Start countdown
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          addAdToken();
          setAdState('done');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Load AdsTerra script inside iframe after a brief delay
    setTimeout(() => {
      if (iframeRef.current) {
        const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { margin: 0; background: #000; display: flex; align-items: center; justify-content: center; min-height: 100vh; color: #fff; font-family: Inter, sans-serif; }
              .ad-container { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 16px; }
              .ad-loading { color: #888; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="ad-container">
              <div class="ad-loading">Loading sponsored content...</div>
            </div>
            <script src="${ADSTERRA_SCRIPT}"><\/script>
          </body>
          </html>
        `);
        doc.close();
      }
    }, 200);
  };

  const closeAdPlayer = () => {
    clearInterval(timerRef.current);
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
      if (doc) { doc.open(); doc.write(''); doc.close(); }
    }
    setActiveAd(null);
    setAdState('idle');
    setTimeLeft(0);
  };

  return (
    <div className="token-bank-overlay">
      <div className="token-bank-modal">
        <header className="token-bank-header">
          <div className="header-title">
            <i className="fas fa-coins" style={{ color: '#F59E0B' }}/>
            <h2>Token Bank</h2>
          </div>
          <button className="tb-close-btn" onClick={onClose}>&times;</button>
        </header>

        <div className="token-stats">
          <div className="stat-card">
            <h3>Total Tokens</h3>
            <div className="stat-value">{adTokens + premiumTokens} <span className="stat-max">/ 10</span></div>
            <p className="stat-desc">Tokens remaining for AI tasks</p>
          </div>
          <div className="stat-card ad-stat">
            <h3>Ad Tokens</h3>
            <div className="stat-value" style={{ color: '#3b82f6' }}>{adTokens}</div>
            <p className="stat-desc">Resets 24h after earning</p>
          </div>
        </div>

        <div className="ads-section">
          <h3>Earn Tokens (Watch Ads)</h3>
          <p className="section-desc">Click any ad slot to watch an ad and earn 1 Token. Tokens expire in 24 hours.</p>
          
          <div className="ads-grid">
            {ads.map((adId) => {
              const isLocked = adTokens + premiumTokens >= 10;
              const isWatching = activeAd === adId;

              return (
                <button 
                  key={adId} 
                  className={`ad-button ${isLocked ? 'locked' : ''} ${isWatching ? 'watching' : ''}`}
                  onClick={() => !isLocked && !isWatching && !activeAd && handleWatchAd(adId)}
                  disabled={isLocked || !!activeAd}
                >
                  {isWatching && adState === 'done' ? (
                    <div className="ad-done">
                      <i className="fas fa-check-circle" />
                      <span>Token Earned!</span>
                    </div>
                  ) : isWatching ? (
                    <div className="ad-countdown">
                      <div className="countdown-circle"><span>▶</span></div>
                      <span>Watching...</span>
                    </div>
                  ) : (
                    <>
                      <i className="fas fa-play-circle" />
                      <span>{isLocked ? 'Max Tokens' : `Watch Ad ${adId}`}</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>

          {adTokens + premiumTokens >= 10 && (
             <div className="max-tokens-warning">
               You have reached the maximum limit of 10 tokens. Please spend tokens before earning more.
             </div>
          )}
        </div>
      </div>

      {/* ── Ad Player Modal ── */}
      {(adState === 'playing' || adState === 'done') && (
        <div className="ad-player-overlay">
          <div className="ad-player-modal">
            <div className="ad-player-header">
              <div className="ad-label">
                <i className="fas fa-ad" />
                <span>Sponsored Content</span>
              </div>
              {timeLeft > 0 && (
                <div className="ad-timer">
                  <div className="ad-timer-bar">
                    <div 
                      className="ad-timer-fill" 
                      style={{ width: `${((AD_DURATION - timeLeft) / AD_DURATION) * 100}%` }}
                    />
                  </div>
                  <span className="ad-timer-text">{timeLeft}s</span>
                </div>
              )}
              {adState === 'done' && (
                <button className="ad-close-btn" onClick={closeAdPlayer}>✕ Close</button>
              )}
            </div>

            <div className="ad-player-body">
              {adState === 'done' ? (
                <div className="ad-complete">
                  <div className="ad-complete-icon">✓</div>
                  <h3>+1 Token Earned!</h3>
                  <p>Thank you for supporting Mean AI</p>
                </div>
              ) : (
                <iframe
                  ref={iframeRef}
                  className="ad-iframe"
                  title="Advertisement"
                  sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
