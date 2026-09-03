import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './context/AppContext';
import Login from './components/Login';
import ApiKeyPromptModal from './components/ApiKeyPromptModal';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import ProfilePage from './components/ProfilePage';
import VoiceOverlay from './components/VoiceOverlay';
import TeacherClassroom from './components/TeacherClassroom';
import PptModal from './components/PptModal';
import MusicPlayer from './components/MusicPlayer';
import CodeCanvas from './components/CodeCanvas';
import MeanClassroom from './components/MeanClassroom';
import LandingPage from './components/LandingPage';
import TokenBank from './components/TokenBank';
import PremiumPlans from './components/PremiumPlans';
import FreebuffAgent from './components/FreebuffAgent';
import ProtectedRoute from './components/ProtectedRoute';
import VideoEditor from './components/VideoEditor';
import DesktopAppModal from './components/DesktopAppModal';

// Public static pages
import AboutPage from './components/pages/AboutPage';
import PrivacyPage from './components/pages/PrivacyPage';
import TermsPage from './components/pages/TermsPage';
import BlogPage from './components/pages/BlogPage';
import BlogPostPage from './components/pages/BlogPostPage';

import './App.css';

/* ── Dashboard Shell (the authenticated layout) ── */
function DashboardLayout() {
  const { sidebarOpen, setSidebarOpen, showProfile, canvasOpen } = useApp();

  const [showVoice, setShowVoice] = useState(false);
  const [showTeacher, setShowTeacher] = useState(false);
  const [showPpt, setShowPpt] = useState(false);
  const [showMusic, setShowMusic] = useState(false);
  const [showTokenBank, setShowTokenBank] = useState(false);
  const [showPremiumPlans, setShowPremiumPlans] = useState(false);
  const [showMeanClassroom, setShowMeanClassroom] = useState(false);
  const [showFreebuffAgent, setShowFreebuffAgent] = useState(false);
  const [showOptics, setShowOptics] = useState(false);
  const [showDesktopApp, setShowDesktopApp] = useState(false);
  // Holds topic+slides when expanding an InlineClassroom into the full canvas
  const [expandedClassroom, setExpandedClassroom] = useState(null);

  React.useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const sharedClass = searchParams.get('shared_class');
    const chatId = searchParams.get('chat_id');
    const userId = searchParams.get('user_id');

    if (chatId && userId) {
      (async () => {
        try {
          const baseUrl = import.meta.env.VITE_SERVER_URL || 'https://mean-backend-nine.vercel.app';
          const resp = await fetch(`${baseUrl}/shares?chat_id=${chatId}&user_id=${userId}`);
          if (resp.ok) {
            const parsed = await resp.json();
            if (parsed && parsed.slides) {
              setExpandedClassroom({ topic: parsed.topic || '', slides: parsed.slides });
              setShowTeacher(true);
            }
          }
        } catch (e) {
          console.error('Failed to fetch shared classroom:', e);
        }
        searchParams.delete('chat_id');
        searchParams.delete('user_id');
        const newQuery = searchParams.toString();
        const newPath = window.location.pathname + (newQuery ? '?' + newQuery : '');
        window.history.replaceState(null, '', newPath);
      })();
    } else if (sharedClass) {
      (async () => {
        try {
          let parsed = null;
          try {
            const binaryString = atob(sharedClass);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            const stream = new Blob([bytes]).stream();
            const decompressedStream = stream.pipeThrough(new DecompressionStream("deflate"));
            const response = new Response(decompressedStream);
            const text = await response.text();
            parsed = JSON.parse(text);
          } catch (decompressErr) {
            // Fallback to old base64 decoding
            const decodedStr = decodeURIComponent(atob(sharedClass).split('').map(function(c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            parsed = JSON.parse(decodedStr);
          }
          if (parsed) {
            // Handle new minified format (short keys: tp, s) or legacy full format (topic, slides)
            let finalTopic = '';
            let finalSlides = [];
            
            if (parsed.s && Array.isArray(parsed.s)) {
              // New minified format — expand short keys back to full slide objects
              finalTopic = parsed.tp || '';
              finalSlides = parsed.s.map(m => {
                const slide = { address: m.a, type: m.t || 'block' };
                if (m.ti) slide.title = m.ti;
                if (m.ic) slide.inContent = m.ic;
                if (m.sh) slide.shape = m.sh;
                if (m.c) slide.connect = m.c;
                if (m.fc) slide.firstConnection = m.fc;
                if (m.nc) slide.nextConnection = m.nc;
                if (m.ct) slide.content = m.ct;
                if (m.d && Array.isArray(m.d)) {
                  slide.dialogs = m.d.map(d => ({
                    topic: d.t || '', input: '', output: '',
                    explanation: d.e || ''
                  }));
                }
                return slide;
              });
            } else if (parsed.slides) {
              // Legacy full format
              finalTopic = parsed.topic || '';
              finalSlides = parsed.slides;
            }
            
            if (finalSlides.length > 0) {
              setExpandedClassroom({ topic: finalTopic, slides: finalSlides });
              setShowTeacher(true);
            }
          }
        } catch (e) {
          console.error('Failed to parse shared classroom:', e);
        }
        searchParams.delete('shared_class');
        const newQuery = searchParams.toString();
        const newPath = window.location.pathname + (newQuery ? '?' + newQuery : '');
        window.history.replaceState(null, '', newPath);
      })();
    }
  }, []);

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
    onMeanClassroom: () => setShowMeanClassroom(true),
    onFreebuffAgent: () => setShowFreebuffAgent(true),
    onOptics: () => setShowOptics(true),
    onDesktopApp: () => setShowDesktopApp(true),
  };

  return (
    <div className={`app-container ${canvasOpen ? 'canvas-open' : ''}`}>
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />
      <Sidebar {...overlayProps} />
      <main className="main-area">
        {showProfile ? <ProfilePage /> : <ChatArea {...overlayProps} />}
      </main>
      {canvasOpen && <CodeCanvas />}

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
      {showMeanClassroom && <MeanClassroom onClose={() => setShowMeanClassroom(false)} />}
      <FreebuffAgent isOpen={showFreebuffAgent} onClose={() => setShowFreebuffAgent(false)} />
      <VideoEditor isOpen={showOptics} onClose={() => setShowOptics(false)} />
      <DesktopAppModal isOpen={showDesktopApp} onClose={() => setShowDesktopApp(false)} />
      <ApiKeyPromptModal />
    </div>
  );
}

/* ── Home Route — decides landing vs login vs dashboard ── */
function HomePage() {
  const { user } = useApp();
  const [showLanding, setShowLanding] = useState(true);

  if (user) return <DashboardLayout />;
  if (showLanding) return <LandingPage onGetStarted={() => setShowLanding(false)} />;
  return <Login onBack={() => setShowLanding(true)} />;
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
