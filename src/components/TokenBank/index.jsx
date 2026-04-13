import React, { useState, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import './TokenBank.css';

// Google's sample VAST tags for testing — replace with real VAST tags later
const VAST_TAGS = [
  'https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_preroll_skippable&sz=640x480&cust_params=sample_ct%3Dlinear&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator=',
  'https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_ad_samples&sz=640x480&cust_params=sample_ct%3Dlinear&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator=',
];

// Simple VAST parser — extracts video URL from VAST XML
async function parseVastTag(vastUrl) {
  try {
    const res = await fetch(vastUrl);
    const xmlText = await res.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    // Try to find MediaFile elements
    const mediaFiles = xmlDoc.getElementsByTagName('MediaFile');
    for (let i = 0; i < mediaFiles.length; i++) {
      const mf = mediaFiles[i];
      const type = mf.getAttribute('type') || '';
      const url = mf.textContent.trim();
      if (type.includes('mp4') || url.includes('.mp4')) {
        return url;
      }
    }
    // Fallback: take first MediaFile
    if (mediaFiles.length > 0) {
      return mediaFiles[0].textContent.trim();
    }
    return null;
  } catch (e) {
    console.error('VAST parse error:', e);
    return null;
  }
}

export default function TokenBank({ isOpen, onClose }) {
  const { adTokens, addAdToken, premiumTokens } = useApp();
  const [activeAd, setActiveAd] = useState(null);
  const [adState, setAdState] = useState('idle'); // idle | loading | playing | done | error
  const [timeLeft, setTimeLeft] = useState(0);
  const [adDuration, setAdDuration] = useState(0);
  const videoRef = useRef(null);
  const timerRef = useRef(null);
  
  if (!isOpen) return null;

  const ads = Array.from({ length: 10 }, (_, i) => i + 1);

  const handleWatchAd = async (adId) => {
    if (activeAd || adTokens + premiumTokens >= 10) return;
    
    setActiveAd(adId);
    setAdState('loading');

    // Pick a random VAST tag
    const vastUrl = VAST_TAGS[Math.floor(Math.random() * VAST_TAGS.length)] + Date.now();
    const videoUrl = await parseVastTag(vastUrl);
    
    if (!videoUrl) {
      // If VAST fails, fallback: grant token after 15-second countdown (ad-free)
      setAdState('playing');
      setTimeLeft(15);
      setAdDuration(15);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            addAdToken();
            setAdState('done');
            setTimeout(() => { setActiveAd(null); setAdState('idle'); }, 1500);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return;
    }

    // Play the video ad
    setAdState('playing');
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.src = videoUrl;
        videoRef.current.play().catch(() => {});
      }
    }, 100);
  };

  const handleVideoMeta = () => {
    if (videoRef.current) {
      const dur = Math.ceil(videoRef.current.duration || 15);
      setAdDuration(dur);
      setTimeLeft(dur);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const handleVideoEnd = () => {
    clearInterval(timerRef.current);
    setTimeLeft(0);
    addAdToken();
    setAdState('done');
    setTimeout(() => { setActiveAd(null); setAdState('idle'); }, 1500);
  };

  const handleVideoError = () => {
    clearInterval(timerRef.current);
    // Fallback: still grant token after showing error briefly
    setAdState('error');
    setTimeout(() => {
      addAdToken();
      setActiveAd(null);
      setAdState('idle');
    }, 2000);
  };

  const closeAdPlayer = () => {
    // Only allow closing if ad has completed
    if (adState === 'done' || adState === 'error') {
      clearInterval(timerRef.current);
      if (videoRef.current) { videoRef.current.pause(); videoRef.current.src = ''; }
      setActiveAd(null);
      setAdState('idle');
    }
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
          <p className="section-desc">Click any ad slot to watch a video ad and earn 1 Token. Tokens expire in 24 hours.</p>
          
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
                      <span>Loading ad...</span>
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

      {/* ── Video Ad Player Modal ── */}
      {(adState === 'playing' || adState === 'done' || adState === 'error') && (
        <div className="ad-player-overlay">
          <div className="ad-player-modal">
            <div className="ad-player-header">
              <div className="ad-label">
                <i className="fas fa-ad" />
                <span>Advertisement</span>
              </div>
              {timeLeft > 0 && (
                <div className="ad-timer">
                  <div className="ad-timer-bar">
                    <div 
                      className="ad-timer-fill" 
                      style={{ width: `${adDuration > 0 ? ((adDuration - timeLeft) / adDuration) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="ad-timer-text">Ad ends in {timeLeft}s</span>
                </div>
              )}
              {(adState === 'done' || adState === 'error') && (
                <button className="ad-close-btn" onClick={closeAdPlayer}>✕</button>
              )}
            </div>

            <div className="ad-player-body">
              {adState === 'error' ? (
                <div className="ad-fallback">
                  <i className="fas fa-exclamation-triangle" />
                  <p>Ad could not load. Token granted anyway!</p>
                </div>
              ) : adState === 'done' ? (
                <div className="ad-complete">
                  <div className="ad-complete-icon">✓</div>
                  <h3>Token Earned!</h3>
                  <p>Thank you for watching</p>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    className="ad-video"
                    playsInline
                    onLoadedMetadata={handleVideoMeta}
                    onEnded={handleVideoEnd}
                    onError={handleVideoError}
                  />
                  {/* Fallback countdown if VAST failed but we're still counting */}
                  {!videoRef.current?.src && timeLeft > 0 && (
                    <div className="ad-fallback-counter">
                      <div className="ad-fallback-spinner" />
                      <p>Loading sponsored content...</p>
                      <p className="ad-fallback-time">{timeLeft}s remaining</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
