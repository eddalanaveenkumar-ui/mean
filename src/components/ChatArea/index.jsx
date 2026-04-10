import React, { useRef, useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import WelcomeScreen from '../WelcomeScreen';
import Message from '../Message';
import InputArea from '../InputArea';
import './ChatArea.css';

export default function ChatArea({ onVoice, onPpt, onTeacher, onMusic }) {
  const { currentChat, currentChatId, chats, isStreaming, sidebarOpen, setSidebarOpen, sidebarCollapsed, setSidebarCollapsed, newChat } = useApp();
  const chatRef = useRef(null);
  const [streamText, setStreamText] = useState('');
  const [isStreamActive, setIsStreamActive] = useState(false);

  useEffect(() => {
    let timeoutId;
    let currentBuffer = '';

    const onUpdate = (e) => { 
      currentBuffer = e.detail.text;
      setIsStreamActive(true); 
      
      if (!timeoutId) {
        timeoutId = setTimeout(() => {
          setStreamText(currentBuffer);
          timeoutId = null;
        }, 30); // ~30fps throttle: guarantees smooth UI without lagging the text parser.
      }
    };
    const onEnd = () => { 
      if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; }
      setStreamText(''); 
      setIsStreamActive(false); 
    };
    window.addEventListener('stream-update', onUpdate);
    window.addEventListener('stream-end', onEnd);
    return () => { 
      window.removeEventListener('stream-update', onUpdate); 
      window.removeEventListener('stream-end', onEnd); 
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [currentChat?.messages, streamText]);

  const messages = currentChat?.messages || [];
  const isEmpty = messages.length === 0 && !isStreamActive;

  const overlayProps = { onVoice, onPpt, onTeacher, onMusic };

  return (
    <div className="chat-area">
      <header className="chat-header">
        <div className="chat-header-left">
          {/* Mobile menu button */}
          <button className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <i className="fas fa-bars" />
          </button>
          <span className="header-brand">
            <img src="/logo.svg" alt="" className="header-brand-icon" />
            <span className="hb-mean">Mean</span>
            <span className="hb-ai">AI</span>
          </span>
        </div>
        <div className="chat-header-right">
          <button className="header-new-btn" onClick={newChat} title="New Chat">
            <i className="fas fa-plus" />
            <span>New chat</span>
          </button>
        </div>
      </header>

      {isEmpty ? (
        <div className="welcome-centered">
          <WelcomeScreen {...overlayProps} />
        </div>
      ) : (
        <>
          <div className="chat-messages" ref={chatRef}>
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
