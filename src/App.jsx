import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import ProfilePage from './components/ProfilePage';
import VoiceOverlay from './components/VoiceOverlay';
import TeacherClassroom from './components/TeacherClassroom';
import PptModal from './components/PptModal';
import MusicPlayer from './components/MusicPlayer';
import LandingPage from './components/LandingPage';
import './App.css';

export default function App() {
  const { user, sidebarOpen, setSidebarOpen, showProfile } = useApp();
  const [showLanding, setShowLanding] = useState(true);

  // Shared overlay states
  const [showVoice, setShowVoice] = useState(false);
  const [showTeacher, setShowTeacher] = useState(false);
  const [showPpt, setShowPpt] = useState(false);
  const [showMusic, setShowMusic] = useState(false);

  const overlayProps = {
    onVoice: () => setShowVoice(true),
    onPpt: () => setShowPpt(true),
    onTeacher: () => setShowTeacher(true),
    onMusic: () => setShowMusic(true),
  };

  if (!user) {
    if (showLanding) {
      return <LandingPage onGetStarted={() => setShowLanding(false)} />;
    }
    return <Login />;
  }

  return (
    <div className="app-container">
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />
      <Sidebar {...overlayProps} />
      <main className="main-area">
        {showProfile ? <ProfilePage /> : <ChatArea {...overlayProps} />}
      </main>

      {/* Global overlays */}
      <VoiceOverlay isOpen={showVoice} onClose={() => setShowVoice(false)} />
      <TeacherClassroom isOpen={showTeacher} onClose={() => setShowTeacher(false)} />
      <PptModal isOpen={showPpt} onClose={() => setShowPpt(false)} />
      <MusicPlayer isOpen={showMusic} onClose={() => setShowMusic(false)} />
    </div>
  );
}
