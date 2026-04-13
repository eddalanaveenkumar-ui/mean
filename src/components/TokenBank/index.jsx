import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import './TokenBank.css';

export default function TokenBank({ isOpen, onClose }) {
  const { adTokens, addAdToken, premiumTokens } = useApp();
  const [activeAd, setActiveAd] = useState(null);
  const [countdown, setCountdown] = useState(0);
  
  if (!isOpen) return null;

  const ads = Array.from({ length: 10 }, (_, i) => i + 1);

  const handleWatchAd = (adId) => {
    if (activeAd || adTokens + premiumTokens >= 10) return;
    
    setActiveAd(adId);
    setCountdown(10);

    // The AdsTerra Social Bar is already loaded globally via index.html
    // It will show ads automatically. We grant the token after a 10-second wait
    // to ensure the user has engaged with the ad content.
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          addAdToken();
          setActiveAd(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
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
                  disabled={isLocked || isWatching || !!activeAd}
                >
                  {isWatching ? (
                    <div className="ad-countdown">
                      <div className="countdown-circle">
                        <span>{countdown}</span>
                      </div>
                      <span>Earning token...</span>
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
    </div>
  );
}
