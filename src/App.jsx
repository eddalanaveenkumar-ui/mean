import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
import TokenBank from './components/TokenBank';
import PremiumPlans from './components/PremiumPlans';
import ProtectedRoute from './components/ProtectedRoute';

// Public static pages
import AboutPage from './components/pages/AboutPage';
import PrivacyPage from './components/pages/PrivacyPage';
import TermsPage from './components/pages/TermsPage';
import BlogPage from './components/pages/BlogPage';
import BlogPostPage from './components/pages/BlogPostPage';

import './App.css';

/* ── Dashboard Shell (the authenticated layout) ── */
function DashboardLayout() {
  const { sidebarOpen, setSidebarOpen, showProfile } = useApp();

  const [showVoice, setShowVoice] = useState(false);
  const [showTeacher, setShowTeacher] = useState(false);
  const [showPpt, setShowPpt] = useState(false);
  const [showMusic, setShowMusic] = useState(false);
  const [showTokenBank, setShowTokenBank] = useState(false);
  const [showPremiumPlans, setShowPremiumPlans] = useState(false);
  // Holds topic+slides when expanding an InlineClassroom into the full canvas
  const [expandedClassroom, setExpandedClassroom] = useState(null);

  const overlayProps = {
    onVoice: () => setShowVoice(true),
    onPpt: () => setShowPpt(true),
    onTeacher: (topic, slides) => {
      // If called from InlineClassroom expand, store the pre-generated content
      if (topic && slides && slides.length > 0) {
        setExpandedClassroom({ topic, slides });
      } else {
        setExpandedClassroom(null);
      }
      setShowTeacher(true);
    },
    onMusic: () => setShowMusic(true),
    onTokenBank: () => setShowTokenBank(true),
    onPremiumPlans: () => setShowPremiumPlans(true),
  };

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
      <TeacherClassroom
        isOpen={showTeacher}
        onClose={() => { setShowTeacher(false); setExpandedClassroom(null); }}
        initialTopic={expandedClassroom?.topic}
        initialSlides={expandedClassroom?.slides}
      />
      <PptModal isOpen={showPpt} onClose={() => setShowPpt(false)} />
      <MusicPlayer isOpen={showMusic} onClose={() => setShowMusic(false)} />
      <TokenBank isOpen={showTokenBank} onClose={() => setShowTokenBank(false)} />
      <PremiumPlans isOpen={showPremiumPlans} onClose={() => setShowPremiumPlans(false)} />
    </div>
  );
}

/* ── Home Route — decides landing vs login vs dashboard ── */
function HomePage() {
  const { user } = useApp();
  const [showLanding, setShowLanding] = useState(true);

  if (user) return <DashboardLayout />;
  if (showLanding) return <LandingPage onGetStarted={() => setShowLanding(false)} />;
  return <Login />;
}


export default function App() {
  return (
    <Routes>
      {/* Public pages — accessible without login */}
      <Route path="/about" element={<AboutPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/blog" element={<BlogPage />} />
      <Route path="/blog/:slug" element={<BlogPostPage />} />

      {/* Protected profile route */}
      <Route path="/profile" element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      } />

      {/* Main app */}
      <Route path="/" element={<HomePage />} />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
