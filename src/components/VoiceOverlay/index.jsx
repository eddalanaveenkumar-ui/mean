import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import './VoiceOverlay.css';

export default function VoiceOverlay({ isOpen, onClose }) {
  const { apiKey, user } = useApp();
  const [phase, setPhase] = useState('idle'); // idle, listening, thinking, speaking
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { alert('Speech recognition not supported'); return; }

    setPhase('listening');
    setTranscript('');
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';
    recognitionRef.current = recognition;

    let finalText = '';
    recognition.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t;
        else interim += t;
      }
      setTranscript(finalText || interim);
    };

    recognition.onend = () => {
      if (finalText.trim()) {
        handleVoiceQuery(finalText.trim());
      } else {
        setPhase('idle');
      }
    };

    recognition.onerror = () => setPhase('idle');
    recognition.start();
  }, [apiKey]);

  const handleVoiceQuery = async (text) => {
    setPhase('thinking');
    const userName = user?.name || 'User';
    const systemPrompt = `VOICE MODE: You are Mean AI in voice mode. Keep responses SHORT (2-15 words). Plain text only, no markdown. Speak naturally. Current user: ${userName}.`;
    const msgs = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: text }
    ];

    try {
      const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'openrouter/free', messages: msgs, stream: false, max_tokens: 100 })
      });
      const data = await resp.json();
      const answer = data.choices?.[0]?.message?.content?.trim() || 'Sorry, I could not process that.';
      setResponse(answer);
      setConversationHistory(prev => [...prev, { role: 'user', content: text }, { role: 'assistant', content: answer }]);
      speakText(answer);
    } catch (e) {
      setResponse('Connection error.');
      setPhase('idle');
    }
  };

  const speakText = (text) => {
    if (!('speechSynthesis' in window)) { setPhase('idle'); return; }
    setPhase('speaking');
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 1.0;
    utt.pitch = 1.05;
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.name.includes('Google') && v.lang.includes('en')) || voices[0];
    if (voice) utt.voice = voice;
    utt.onend = () => { setPhase('idle'); };
    utt.onerror = () => { setPhase('idle'); };
    synthRef.current = utt;
    window.speechSynthesis.speak(utt);
  };

  const stopAll = () => {
    try { recognitionRef.current?.abort(); } catch (e) {}
    window.speechSynthesis?.cancel();
    setPhase('idle');
  };

  const handleClose = () => {
    stopAll();
    setConversationHistory([]);
    setTranscript('');
    setResponse('');
    onClose();
  };

  useEffect(() => {
    if (!isOpen) stopAll();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="voice-overlay">
      <div className="voice-modal">
        <button className="voice-close" onClick={handleClose}>
          <i className="fas fa-times" />
        </button>

        <div className="voice-visual">
          <div className={`voice-rings ${phase}`}>
            <div className="voice-ring r1" />
            <div className="voice-ring r2" />
            <div className="voice-ring r3" />
            <div className="voice-center">
              {phase === 'listening' && <i className="fas fa-microphone" />}
              {phase === 'thinking' && <i className="fas fa-brain" />}
              {phase === 'speaking' && <i className="fas fa-volume-up" />}
              {phase === 'idle' && <i className="fas fa-microphone" />}
            </div>
          </div>
        </div>

        <div className="voice-status">
          {phase === 'idle' && 'Tap to speak'}
          {phase === 'listening' && 'Listening...'}
          {phase === 'thinking' && 'Thinking...'}
          {phase === 'speaking' && 'Speaking...'}
        </div>

        {transcript && (
          <div className="voice-transcript">
            <span className="voice-label">You</span>
            <p>{transcript}</p>
          </div>
        )}

        {response && (
          <div className="voice-response">
            <span className="voice-label">Mean AI</span>
            <p>{response}</p>
          </div>
        )}

        <div className="voice-actions">
          {phase === 'idle' ? (
            <button className="voice-mic-btn" onClick={startListening}>
              <i className="fas fa-microphone" />
            </button>
          ) : phase === 'listening' ? (
            <button className="voice-mic-btn active" onClick={() => recognitionRef.current?.stop()}>
              <i className="fas fa-stop" />
            </button>
          ) : (
            <button className="voice-mic-btn thinking" disabled>
              <i className="fas fa-spinner fa-spin" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
