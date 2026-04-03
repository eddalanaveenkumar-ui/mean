import React, { useState, useRef } from 'react';
import './MusicPlayer.css';

export default function MusicPlayer({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [videoId, setVideoId] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const iframeRef = useRef(null);

  const searchAndPlay = async () => {
    if (!query.trim()) return;
    setIsLoading(true);

    try {
      // Use YouTube iframe embed with search
      const searchQuery = encodeURIComponent(query.trim());
      // Using invidious API or YouTube embed
      setVideoId(searchQuery);
      setIsPlaying(true);
    } catch (e) {
      alert('Failed to search');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="music-overlay" onClick={onClose}>
      <div className="music-modal" onClick={e => e.stopPropagation()}>
        <button className="music-close" onClick={onClose}><i className="fas fa-times" /></button>

        <div className="music-header">
          <i className="fas fa-music music-icon" />
          <h2>Music Player</h2>
        </div>

        <div className="music-search">
          <input
            placeholder="Search for music..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && searchAndPlay()}
            autoFocus
          />
          <button onClick={searchAndPlay} disabled={isLoading}>
            {isLoading ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-search" />}
          </button>
        </div>

        {isPlaying && videoId && (
          <div className="music-player-area">
            <iframe
              ref={iframeRef}
              width="100%"
              height="200"
              src={`https://www.youtube.com/embed?listType=search&list=${videoId}&autoplay=1`}
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
              title="Music Player"
              style={{ borderRadius: '12px' }}
            />
          </div>
        )}

        <div className="music-quick-list">
          <span className="music-quick-label">Quick Play</span>
          {['Lo-fi Beats', 'Study Music', 'Jazz Piano', 'Nature Sounds'].map(q => (
            <button key={q} className="music-quick-btn" onClick={() => { setQuery(q); setVideoId(encodeURIComponent(q)); setIsPlaying(true); }}>
              <i className="fas fa-play" /> {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
