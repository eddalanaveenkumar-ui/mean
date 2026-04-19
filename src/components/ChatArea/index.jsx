import React, { useRef, useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import WelcomeScreen from '../WelcomeScreen';
import Message from '../Message';
import InputArea from '../InputArea';
import './ChatArea.css';

export default function ChatArea({ onVoice, onPpt, onTeacher, onMusic }) {
  const { currentChat, currentChatId, chats, isStreaming, sidebarOpen, setSidebarOpen, sidebarCollapsed, setSidebarCollapsed, newChat, theme, selectedModel, setSelectedModel, FREE_MODELS, PAID_MODELS } = useApp();
  const chatRef = useRef(null);
  const shouldAutoScroll = useRef(true);
  const [streamText, setStreamText] = useState('');
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);

  const handleModelSelect = (model) => {
    setSelectedModel(model);
    localStorage.setItem('mean_selected_model', model.id);
    setShowModelPicker(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    if (!showModelPicker) return;
    const close = (e) => {
      if (!e.target.closest('.model-picker-wrap')) setShowModelPicker(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [showModelPicker]);

  useEffect(() => {
    let queuedText = '';
    let renderedText = '';
    let isTyping = false;
    let timerId = null;

    const pumpQueue = () => {
      if (renderedText.length < queuedText.length) {
        const diff = queuedText.length - renderedText.length;
        const charsPop = diff > 60 ? 4 : diff > 30 ? 2 : 1;
        renderedText = queuedText.substring(0, renderedText.length + charsPop);
        setStreamText(renderedText);
        timerId = setTimeout(pumpQueue, 15);
      } else {
        isTyping = false;
      }
    };

    const onUpdate = (e) => { 
      queuedText = e.detail.text;
      setIsStreamActive(true); 
      if (!isTyping) {
        isTyping = true;
        pumpQueue();
      }
    };

    const onEnd = () => { 
      if (timerId) clearTimeout(timerId);
      // CRITICAL: Reset closure variables so the next stream starts fresh
      queuedText = '';
      renderedText = '';
      isTyping = false;
      timerId = null;
      setStreamText(''); 
      setIsStreamActive(false); 
    };

    window.addEventListener('stream-update', onUpdate);
    window.addEventListener('stream-end', onEnd);
    return () => { 
      window.removeEventListener('stream-update', onUpdate); 
      window.removeEventListener('stream-end', onEnd); 
      if (timerId) clearTimeout(timerId);
    };
  }, []);

  useEffect(() => {
    if (chatRef.current && shouldAutoScroll.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [currentChat?.messages, streamText]);

  // When a completely new message starts (stream text restarts or messages length changes),
  // we might want to force scroll to bottom, but the simplest robust fix is just 
  // letting shouldAutoScroll decide. If the user intentionally scrolls to bottom, they will snap.
  // To ensure they snap when sending a message, we can reset shouldAutoScroll when stream becomes active.
  useEffect(() => {
    if (isStreamActive) {
      shouldAutoScroll.current = true;
    }
  }, [isStreamActive]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    // Consider it "at the bottom" if they are within 150px
    shouldAutoScroll.current = scrollHeight - scrollTop - clientHeight < 150;
  };

  const messages = currentChat?.messages || [];
  const isEmpty = messages.length === 0 && !isStreamActive;

  const overlayProps = { onVoice, onPpt, onTeacher, onMusic };

  return (
    <div className="chat-area">
      <header className="chat-header">
        <div className="chat-header-left">
          <button className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <i className="fas fa-bars" />
          </button>
          <div className="model-picker-wrap">
            <button className="model-picker-btn" onClick={(e) => { e.stopPropagation(); setShowModelPicker(!showModelPicker); }}>
              <span className="hb-mean">Mean</span>
              <span className="hb-ai">AI</span>
              <span className="model-picker-current">{selectedModel.icon} {selectedModel.name}</span>
              <i className={`fas fa-chevron-down model-picker-arrow ${showModelPicker ? 'open' : ''}`} />
            </button>
            {showModelPicker && (
              <div className="model-picker-dropdown">
                <div className="mpd-group-label">Free Models</div>
                {FREE_MODELS.map(m => (
                  <button key={m.id} className={`mpd-item ${selectedModel.id === m.id ? 'active' : ''}`} onClick={() => handleModelSelect(m)}>
                    <span className="mpd-icon">{m.icon}</span>
                    <span className="mpd-name">{m.name}</span>
                    {selectedModel.id === m.id && <i className="fas fa-check mpd-check" />}
                  </button>
                ))}
                <div className="mpd-group-label premium">Premium Models <i className="fas fa-crown" style={{ color: '#ec4899', fontSize: 10 }} /></div>
                {PAID_MODELS.map(m => (
                  <button key={m.id} className={`mpd-item ${selectedModel.id === m.id ? 'active' : ''}`} onClick={() => handleModelSelect(m)}>
                    <span className="mpd-icon">{m.icon}</span>
                    <span className="mpd-name">{m.name}</span>
                    <span className="mpd-badge">PRO</span>
                    {selectedModel.id === m.id && <i className="fas fa-check mpd-check" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="chat-header-right">
          <button className="header-icon-btn" onClick={newChat} title="New Chat">
            <i className="fas fa-pen-to-square" />
          </button>
        </div>
      </header>

      {isEmpty ? (
        <div className="welcome-centered">
          <WelcomeScreen {...overlayProps} />
        </div>
      ) : (
        <>
          <div className="chat-messages" ref={chatRef} onScroll={handleScroll}>
            <div className="messages-container">
              {messages.map((msg, i) => (
                <Message key={i} message={msg} />
              ))}
              {isStreamActive && (
                <Message message={{ role: 'assistant', content: streamText, isStreaming: true }} streaming />
              )}
            </div>
          </div>
          <InputArea {...overlayProps} />
        </>
      )}
    </div>
  );
}
