import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Brain, 
  Zap, 
  Code, 
  Shield, 
  Music, 
  Presentation, 
  Star, 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  Terminal, 
  ArrowRight, 
  CheckCircle2, 
  Activity, 
  Database, 
  Lock, 
  Laptop, 
  Sparkles,
  GitBranch,
  Volume2
} from 'lucide-react';
import './LandingPage.css';

export default function LandingPage({ onGetStarted }) {
  const [scrolled, setScrolled] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: -1000, y: -1000 });
  const [particles, setParticles] = useState([]);
  
  // ── Scroll Listener for Navbar ──
  useEffect(() => {
    const container = document.querySelector('.landing-scroll-container');
    const handleScroll = () => setScrolled(container?.scrollTop > 40);
    container?.addEventListener('scroll', handleScroll);
    return () => container?.removeEventListener('scroll', handleScroll);
  }, []);

  // ── Global Cursor Mouse Tracking ──
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, []);

  // ── Generate Background Particles ──
  useEffect(() => {
    const generated = Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 8}s`,
      duration: `${6 + Math.random() * 6}s`,
      size: `${2 + Math.random() * 4}px`
    }));
    setParticles(generated);
  }, []);

  // ── Spotlight Hover coordinates handler ──
  const handleCardMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  // ── Live Demo Simulator States ──
  const [demoStepIndex, setDemoStepIndex] = useState(0);
  const [isPlayingDemo, setIsPlayingDemo] = useState(true);
  const [selectedDemoTab, setSelectedDemoTab] = useState('recursion');

  const recursionSteps = [
    {
      line: 6,
      variables: { n: '4', result: 'calculating...', activeCall: 'fib(4)' },
      stack: ['fib(4)'],
      explanation: "Start: The main program calls our recursive function fibonacci with an argument of n = 4.",
      highlight: [6]
    },
    {
      line: 1,
      variables: { n: '4', result: 'calculating...', activeCall: 'fib(4)' },
      stack: ['fib(4)'],
      explanation: "Checking base case: is n <= 1? n = 4, which is greater than 1. Base case is not met.",
      highlight: [1, 2]
    },
    {
      line: 4,
      variables: { n: '4', result: 'calculating...', activeCall: 'fib(4)' },
      stack: ['fib(4)'],
      explanation: "Recursing: We split fib(4) into two branches: fib(3) + fib(2). Evaluating the left branch first...",
      highlight: [4]
    },
    {
      line: 1,
      variables: { n: '3', result: 'calculating...', activeCall: 'fib(3)' },
      stack: ['fib(4)', 'fib(3)'],
      explanation: "Evaluating fib(3). Checking base case: n <= 1? No. We recurse deeper calling fib(2).",
      highlight: [1, 2]
    },
    {
      line: 1,
      variables: { n: '2', result: 'calculating...', activeCall: 'fib(2)' },
      stack: ['fib(4)', 'fib(3)', 'fib(2)'],
      explanation: "Evaluating fib(2). Base case is not met. We recurse down to fib(1).",
      highlight: [1, 2]
    },
    {
      line: 3,
      variables: { n: '1', result: '1', activeCall: 'fib(1)' },
      stack: ['fib(4)', 'fib(3)', 'fib(2)', 'fib(1)'],
      explanation: "Base case reached! n = 1, so we return 1 directly. The call stack pops fib(1).",
      highlight: [2, 3]
    },
    {
      line: 4,
      variables: { n: '2', result: '1 + fib(0)', activeCall: 'fib(2)' },
      stack: ['fib(4)', 'fib(3)', 'fib(2)'],
      explanation: "Back to fib(2). The left call resolved to 1. Now we evaluate the right call: fib(0).",
      highlight: [4]
    },
    {
      line: 3,
      variables: { n: '0', result: '0', activeCall: 'fib(0)' },
      stack: ['fib(4)', 'fib(3)', 'fib(2)', 'fib(0)'],
      explanation: "Base case met for fib(0). It returns 0. Stack pops.",
      highlight: [2, 3]
    },
    {
      line: 4,
      variables: { n: '2', result: '1', activeCall: 'fib(2)' },
      stack: ['fib(4)', 'fib(3)'],
      explanation: "fib(2) completed! Sum of branches: 1 (from fib(1)) + 0 (from fib(0)) = 1. Return 1.",
      highlight: [4]
    },
    {
      line: 4,
      variables: { n: '3', result: '1 + fib(1)', activeCall: 'fib(3)' },
      stack: ['fib(4)', 'fib(3)'],
      explanation: "Back to fib(3). The left call returned 1. Evaluating right call: fib(1).",
      highlight: [4]
    },
    {
      line: 3,
      variables: { n: '1', result: '1', activeCall: 'fib(1)' },
      stack: ['fib(4)', 'fib(3)', 'fib(1)'],
      explanation: "Base case met for fib(1). Returns 1. Stack pops.",
      highlight: [2, 3]
    },
    {
      line: 4,
      variables: { n: '3', result: '2', activeCall: 'fib(3)' },
      stack: ['fib(4)'],
      explanation: "fib(3) completed! 1 (from fib(2)) + 1 (from fib(1)) = 2. Returning 2.",
      highlight: [4]
    },
    {
      line: 6,
      variables: { n: '4', result: '3', activeCall: 'Done' },
      stack: [],
      explanation: "Success! fib(4) resolved to 3. Visual recursion tracing makes algorithms completely clear.",
      highlight: [6, 7]
    }
  ];

  // ── Auto Step Simulation Timer ──
  useEffect(() => {
    if (!isPlayingDemo) return;
    const interval = setInterval(() => {
      setDemoStepIndex((prev) => (prev + 1) % recursionSteps.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [isPlayingDemo, demoStepIndex]);

  // ── Real-time global activity state logs ──
  const [activityIndex, setActivityIndex] = useState(0);
  const liveActivities = [
    { user: "Emma W. (Stanford)", action: "generated dry-run trace visualizer for", target: "QuickSort Partition", time: "just now" },
    { user: "Devon R. (Berlin)", action: "completed the interactive module", target: "Binary Tree DFS", time: "12s ago" },
    { user: "Siddharth M. (IIT Delhi)", action: "used AI Classroom to study", target: "Dynamic Programming Knapsack", time: "30s ago" },
    { user: "Karly P. (Toronto)", action: "asked classroom assistant about", target: "Hash Collisions & Buckets", time: "1m ago" }
  ];

  useEffect(() => {
    const activityInterval = setInterval(() => {
      setActivityIndex((prev) => (prev + 1) % liveActivities.length);
    }, 3500);
    return () => clearInterval(activityInterval);
  }, []);

  // ── AI Classroom node graph interactive states ──
  const classroomNodes = [
    { id: 1, label: '01. Fundamentals', cx: 70, cy: 160, status: 'completed', desc: 'Master variables, primitive data types, basic operations, and standard memory layout configurations.', advice: "Tip: Focus on memory allocation difference between Stack vs Heap variables." },
    { id: 2, label: '02. Control Flow', cx: 220, cy: 90, status: 'completed', desc: 'Dive deep into conditionals, complex logical gates, loops, and nested branching controls.', advice: "Focus on early returns in nested loops to maintain clean time complexity." },
    { id: 3, label: '03. Functions', cx: 350, cy: 230, status: 'active', desc: 'Create reusable blocks. Understand parameters, arguments, return mechanisms, and stack frames.', advice: "Tutor hint: Functions are pushed onto the call stack. Observe how they hold isolated local environments." },
    { id: 4, label: '04. Recursion', cx: 480, cy: 110, status: 'locked', desc: 'Master the art of self-referential functions, base cases, recursion trees, and stack overflows.', advice: "Tutor hint: Every recursion requires a solid base case. Without it, you trigger stack overflow." },
    { id: 5, label: '05. Data Structures', cx: 620, cy: 220, status: 'locked', desc: 'Explore linear and non-linear memory arrangements: Arrays, Lists, Stacks, Queues, Trees, and Graphs.', advice: "Tutor hint: Storing nodes with references creates a dynamic map of connected elements." }
  ];
  const [activeGraphNode, setActiveGraphNode] = useState(classroomNodes[2]); // Default node 3

  // ── Scroll timeline linking observer ──
  const [activeTimelineStep, setActiveTimelineStep] = useState(1);
  const timelineRef = useRef(null);
  const [timelineProgressHeight, setTimelineProgressHeight] = useState(0);

  // ── Intersection Observer for Scroll-Reveal Animations ──
  const revealRefs = useRef([]);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    
    revealRefs.current.forEach(ref => {
      if (ref) observer.observe(ref);
    });
    
    return () => observer.disconnect();
  }, []);

  const addRevealRef = (el) => {
    if (el && !revealRefs.current.includes(el)) {
      revealRefs.current.push(el);
    }
  };

  useEffect(() => {
    const container = document.querySelector('.landing-scroll-container');
    const handleTimelineScroll = () => {
      if (!timelineRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const elementHeight = rect.height;
      const triggerTop = window.innerHeight * 0.5;
      
      // Calculate how far down the timeline section we have scrolled
      const scrolledIntoTimeline = triggerTop - rect.top;
      let progress = scrolledIntoTimeline / elementHeight;
      progress = Math.max(0, Math.min(1, progress));
      setTimelineProgressHeight(progress * 100);

      // Determine active steps based on progress
      if (progress < 0.3) {
        setActiveTimelineStep(1);
      } else if (progress < 0.7) {
        setActiveTimelineStep(2);
      } else {
        setActiveTimelineStep(3);
      }
    };

    container?.addEventListener('scroll', handleTimelineScroll);
    return () => container?.removeEventListener('scroll', handleTimelineScroll);
  }, []);

  return (
    <div className="landing-page">
      {/* Global Cursor Glow */}
      <div 
        className="cursor-glow"
        style={{
          left: `${cursorPos.x}px`,
          top: `${cursorPos.y}px`
        }}
      />

      {/* Futuristic Background System */}
      <div className="landing-bg">
        <div className="bg-noise" />
        <div className="bg-grid" />
        <div className="bg-glow-orb bg-orb-indigo" />
        <div className="bg-glow-orb bg-orb-purple" />
        <div className="bg-glow-orb bg-orb-cyan" />
        
        {/* Floating particles */}
        <div className="bg-particles">
          {particles.map((p) => (
            <div
              key={p.id}
              className="bg-particle"
              style={{
                left: p.left,
                width: p.size,
                height: p.size,
                animationDelay: p.delay,
                animationDuration: p.duration
              }}
            />
          ))}
        </div>
      </div>

      {/* Floating Glass Navbar */}
      <nav className={`landing-nav ${scrolled ? 'nav-scrolled' : ''}`}>
        <div className="nav-container">
          <div className="nav-inner">
            <div 
              className="nav-brand" 
              onClick={() => document.querySelector('.landing-scroll-container').scrollTo({ top: 0, behavior: 'smooth' })}
              style={{ cursor: 'pointer' }}
            >
              <div className="logo-glow-effect" />
              <img src="/logo-space.jpeg" alt="Mean AI" className="nav-logo-img" />
              <span className="nav-logo-text">
                Mean <span className="accent-text-glow">AI</span>
              </span>
            </div>
            
            <div className="nav-links">
              <a href="#demo" className="nav-link" onClick={(e) => {
                e.preventDefault();
                document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
              }}>
                Demo <span className="nav-link-indicator" />
              </a>
              <a href="#features" className="nav-link" onClick={(e) => {
                e.preventDefault();
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}>
                Features <span className="nav-link-indicator" />
              </a>
              <a href="#roadmap" className="nav-link" onClick={(e) => {
                e.preventDefault();
                document.getElementById('roadmap')?.scrollIntoView({ behavior: 'smooth' });
              }}>
                Classroom Graph <span className="nav-link-indicator" />
              </a>
              <a href="#how-it-works" className="nav-link" onClick={(e) => {
                e.preventDefault();
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }}>
                Timeline <span className="nav-link-indicator" />
              </a>
              <Link to="/blog" className="nav-link">
                Blog <span className="nav-link-indicator" />
              </Link>
            </div>
            
            <div className="nav-actions">
              <button className="nav-btn-premium" onClick={onGetStarted}>
                Get Started <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Scrollable Content Shell */}
      <div className="landing-scroll-container">

        {/* ── HERO SECTION ── */}
        <section className="hero-container">
          
          {/* Left Column */}
          <div className="hero-left">
            <div className="trust-badge-row">
              <span className="badge-pulse" />
              <span className="trust-badge-text">Next-Gen AI Classroom Platform</span>
            </div>
            
            <h1 className="hero-main-title">
              Learn Code Faster With AI That <br />
              <span className="text-gradient-purple-cyan">Actually Teaches</span>
            </h1>
            
            <p className="hero-description">
              Mean AI explains complex programming logic, generates step-by-step visual execution stack paths, tracks variables in real-time, and guides you with classroom roadmaps.
            </p>
            
            <div className="hero-cta-buttons">
              <button className="btn-glowing" onClick={onGetStarted}>
                Start Learning Free <Sparkles size={16} />
              </button>
              <button 
                className="btn-glass" 
                onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Watch Simulation <Play size={15} />
              </button>
            </div>
            
            <div className="dev-proof-row">
              <div className="proof-avatars">
                <span className="proof-avatar" style={{ background: '#312e81' }}>R</span>
                <span className="proof-avatar" style={{ background: '#1e1b4b' }}>M</span>
                <span className="proof-avatar" style={{ background: '#0f172a' }}>K</span>
                <span className="proof-avatar" style={{ background: '#022c22' }}>+</span>
              </div>
              <div className="proof-info">
                <div className="proof-stars">
                  {[...Array(5)].map((_, i) => <Star key={i} size={13} fill="currentColor" />)}
                </div>
                <span className="proof-text">
                  Loved by <span className="proof-highlight">12,000+ engineers</span> & CS students worldwide
                </span>
              </div>
            </div>

            {/* Sleek Stats Bar */}
            <div className="hero-stats-bar">
              <div className="hero-stat-item">
                <span className="hero-stat-number">12.5K+</span>
                <span className="hero-stat-label">Active Students</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat-item">
                <span className="hero-stat-number">1.2M+</span>
                <span className="hero-stat-label">Explanations</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat-item">
                <span className="hero-stat-number">4.9/5</span>
                <span className="hero-stat-label">Satisfaction</span>
              </div>
            </div>
          </div>

          {/* Right Column - Live AI Code Demo */}
          <div className="hero-right" id="demo">
            <div className="ide-workspace">
              <div className="ide-header">
                <div className="ide-window-dots">
                  <span className="ide-dot ide-dot-close" />
                  <span className="ide-dot ide-dot-min" />
                  <span className="ide-dot ide-dot-max" />
                  
                  <div className="ide-tabs">
                    <button 
                      className={`ide-tab ${selectedDemoTab === 'recursion' ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedDemoTab('recursion');
                        setDemoStepIndex(0);
                      }}
                    >
                      <GitBranch size={12} /> fibonacci.py
                    </button>
                  </div>
                </div>

                <div className="ide-status">
                  <span className="ide-status-pulse" />
                  <span>AI Trace Engine: Running</span>
                </div>
              </div>

              <div className="ide-body">
                {/* IDE Icon strip */}
                <div className="ide-sidebar">
                  <Code size={18} className="ide-sidebar-icon active" />
                  <Terminal size={18} className="ide-sidebar-icon" />
                  <Database size={18} className="ide-sidebar-icon" />
                  <Shield size={18} className="ide-sidebar-icon" />
                </div>

                {/* IDE Code viewer */}
                <div className="ide-code-panel">
                  <div className="ide-code-container">
                    {[
                      { num: 1, text: <span className="code-line-text"><span className="keyword">def</span> <span className="func-name">fibonacci</span>(<span className="param">n</span>):</span> },
                      { num: 2, text: <span className="code-line-text">    <span className="keyword">if</span> n &lt;= <span className="number">1</span>:</span> },
                      { num: 3, text: <span className="code-line-text">        <span className="keyword">return</span> n</span> },
                      { num: 4, text: <span className="code-line-text">    <span className="keyword">return</span> <span className="func-name">fibonacci</span>(n-<span className="number">1</span>) + <span className="func-name">fibonacci</span>(n-<span className="number">2</span>)</span> },
                      { num: 5, text: <span className="code-line-text"></span> },
                      { num: 6, text: <span className="code-line-text">result = <span className="func-name">fibonacci</span>(<span className="number">4</span>)</span> },
                      { num: 7, text: <span className="code-line-text"><span className="func-name">print</span>(result)  <span className="comment"># Output: 3</span></span> },
                    ].map((lineObj) => {
                      const isHighlighted = recursionSteps[demoStepIndex].highlight.includes(lineObj.num);
                      return (
                        <div 
                          key={lineObj.num} 
                          className={`code-line ${isHighlighted ? 'code-line-highlighted' : ''}`}
                        >
                          <span className="code-line-num">{lineObj.num}</span>
                          {lineObj.text}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Live Variables & Memory Call Stack visualizer */}
                <div className="ide-visual-panel">
                  <div>
                    <h4 className="visual-section-title">Variables Scope</h4>
                    <div className="variables-box">
                      <div className="var-row">
                        <span className="var-name">n</span>
                        <span className="var-val">{recursionSteps[demoStepIndex].variables.n}</span>
                      </div>
                      <div className="var-row">
                        <span className="var-name">result</span>
                        <span className="var-val">{recursionSteps[demoStepIndex].variables.result}</span>
                      </div>
                      <div className="var-row">
                        <span className="var-name">active_call</span>
                        <span className="var-val" style={{ color: 'var(--color-cyan)' }}>
                          {recursionSteps[demoStepIndex].variables.activeCall}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h4 className="visual-section-title">Execution Call Stack</h4>
                    <div className="stack-box">
                      {recursionSteps[demoStepIndex].stack.length === 0 ? (
                        <div className="stack-empty">Stack empty (Execution idle)</div>
                      ) : (
                        recursionSteps[demoStepIndex].stack.map((frame, index) => {
                          const isTop = index === recursionSteps[demoStepIndex].stack.length - 1;
                          return (
                            <div 
                              key={index} 
                              className={`stack-frame ${isTop ? 'active-frame' : ''}`}
                            >
                              <span>{frame}</span>
                              <span style={{ fontSize: '0.65rem', color: isTop ? 'var(--color-cyan)' : '#475569' }}>
                                {isTop ? 'ACTIVE' : `DEPTH: ${index}`}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* IDE console with execution actions */}
              <div className="ide-console">
                <div className="console-output">
                  <Terminal size={14} />
                  <span>&gt; Step {demoStepIndex + 1}/{recursionSteps.length}</span>
                </div>

                <div className="console-controls">
                  <button 
                    className="console-btn"
                    onClick={() => {
                      setDemoStepIndex(0);
                      setIsPlayingDemo(false);
                    }}
                  >
                    <RotateCcw size={12} /> Reset
                  </button>
                  <button 
                    className="console-btn"
                    onClick={() => setIsPlayingDemo(!isPlayingDemo)}
                    style={{ background: isPlayingDemo ? 'rgba(239, 68, 68, 0.08)' : '', borderColor: isPlayingDemo ? 'rgba(239, 68, 68, 0.2)' : '' }}
                  >
                    {isPlayingDemo ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Play</>}
                  </button>
                  <button 
                    className="console-btn"
                    onClick={() => {
                      setIsPlayingDemo(false);
                      setDemoStepIndex((prev) => (prev + 1) % recursionSteps.length);
                    }}
                  >
                    <SkipForward size={12} /> Step
                  </button>
                </div>
              </div>
            </div>

            {/* AI Explanation snippet integrated below IDE */}
            <div className="hero-explanation-bar">
              <div className="explanation-icon">
                <Brain size={16} />
              </div>
              <p className="explanation-text">{recursionSteps[demoStepIndex].explanation}</p>
              <span className="explanation-step-badge">Step {demoStepIndex + 1}/{recursionSteps.length}</span>
            </div>
          </div>
        </section>

        {/* ── TRUSTED BY SECTION (Logos marquee) ── */}
        <section ref={addRevealRef} className="marquee-section reveal">
          <h3 className="marquee-title">Trusted by developers at leading organizations</h3>
          <div className="marquee-container">
            <div className="marquee-track">
              {[
                { name: 'Vercel', icon: <polygon points="12 2 2 22 22 22" /> },
                { name: 'Stripe', icon: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.62 13.91c0 .76-.62 1.38-1.38 1.38H11.5c-1.38 0-2.5-1.12-2.5-2.5V13h1.5v1.79c0 .55.45 1 1 1h.74c.48 0 .88-.4.88-.88 0-.48-.4-.88-.88-.88h-.74c-1.38 0-2.5-1.12-2.5-2.5v-.53c0-1.38 1.12-2.5 2.5-2.5h.74c1.38 0 2.5 1.12 2.5 2.5V10h-1.5V9.21c0-.55-.45-1-1-1h-.74c-.48 0-.88.4-.88.88 0 .48.4.88.88.88h.74c1.38 0 2.5 1.12 2.5 2.5v1.44z" /> },
                { name: 'OpenAI', icon: <circle cx="12" cy="12" r="10" /> },
                { name: 'GitHub', icon: <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" /> },
                { name: 'Linear', icon: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /> },
                { name: 'Supabase', icon: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10" /> },
                { name: 'Framer', icon: <path d="M12 2L2 12h20L12 2zm0 20l10-10H2l10 10z" /> }
              ].concat([
                { name: 'Vercel', icon: <polygon points="12 2 2 22 22 22" /> },
                { name: 'Stripe', icon: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.62 13.91c0 .76-.62 1.38-1.38 1.38H11.5c-1.38 0-2.5-1.12-2.5-2.5V13h1.5v1.79c0 .55.45 1 1 1h.74c.48 0 .88-.4.88-.88 0-.48-.4-.88-.88-.88h-.74c-1.38 0-2.5-1.12-2.5-2.5v-.53c0-1.38 1.12-2.5 2.5-2.5h.74c1.38 0 2.5 1.12 2.5 2.5V10h-1.5V9.21c0-.55-.45-1-1-1h-.74c-.48 0-.88.4-.88.88 0 .48.4.88.88.88h.74c1.38 0 2.5 1.12 2.5 2.5v1.44z" /> },
                { name: 'OpenAI', icon: <circle cx="12" cy="12" r="10" /> },
                { name: 'GitHub', icon: <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" /> },
                { name: 'Linear', icon: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /> },
                { name: 'Supabase', icon: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10" /> },
                { name: 'Framer', icon: <path d="M12 2L2 12h20L12 2zm0 20l10-10H2l10 10z" /> }
              ]).map((logo, idx) => (
                <div key={idx} className="logo-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {logo.icon}
                  </svg>
                  <span>{logo.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── REAL-TIME AI ACTIVITY SECTION ── */}
        <section ref={addRevealRef} className="activity-feed-section reveal">
          <div className="activity-feed-card">
            <div className="activity-left">
              <div className="activity-pulse-circle">
                <Activity size={18} className="pulse-svg" />
              </div>
              <div className="activity-details">
                <span className="activity-user">{liveActivities[activityIndex].user}</span>
                <span className="activity-action">
                  {liveActivities[activityIndex].action}{' '}
                  <span className="activity-highlight">
                    {liveActivities[activityIndex].target}
                  </span>
                </span>
              </div>
            </div>
            
            <div className="activity-timestamp">
              {liveActivities[activityIndex].time}
            </div>
          </div>
        </section>

        {/* ── FEATURES SECTION (Bento Grid) ── */}
        <section ref={addRevealRef} id="features" className="features-section reveal">
          <div className="section-header">
            <span className="section-badge">Features Bento</span>
            <h2 className="section-title">Everything You Need To Master Code</h2>
            <p className="section-subtitle">
              We ditched standard text lists. Explore our highly detailed YC bento stack features.
            </p>
          </div>

          <div className="bento-grid">
            
            {/* Card 1: AI Classroom (Large) */}
            <div ref={addRevealRef} className="bento-card bento-large reveal reveal-delay-1" onMouseMove={handleCardMouseMove}>
              <div className="card-spotlight" />
              <div className="bento-content">
                <div className="bento-card-top">
                  <div className="bento-icon-wrap indigo">
                    <Brain size={24} />
                  </div>
                  <h3 className="bento-title">Visual AI Classroom</h3>
                  <p className="bento-desc">
                    Generates fully animated roadmap nodes from any programming syllabus or user query. It visualizes structural relationships, concepts hierarchy, and guides you with automated checkpoints.
                  </p>
                </div>
                
                {/* Visual node path mini mockup */}
                <div className="bento-preview-container" style={{ background: 'rgba(0,0,0,0.4)', padding: '16px', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '8px', height: '8px', background: 'var(--color-indigo)', borderRadius: '50%', boxShadow: '0 0 8px var(--color-indigo)' }} />
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Python Roadmaps: Stack Frames</span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-indigo)', fontWeight: 700 }}>ACTIVE</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.5, background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '8px', height: '8px', background: '#334155', borderRadius: '50%' }} />
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Binary Search Trees (BST)</span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 700 }}>LOCKED</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Instant Code Breakdowns (Medium) */}
            <div ref={addRevealRef} className="bento-card bento-medium reveal reveal-delay-2" onMouseMove={handleCardMouseMove}>
              <div className="card-spotlight" />
              <div className="bento-content">
                <div className="bento-card-top">
                  <div className="bento-icon-wrap cyan">
                    <Zap size={24} />
                  </div>
                  <h3 className="bento-title">Line-by-Line Tracing</h3>
                  <p className="bento-desc">
                    Paste any complex logic. Mean AI outputs dry runs, trace values, memory stack variations, and answers your follow-up questions.
                  </p>
                </div>
                
                <div className="bento-preview-container" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', fontSize: '0.7rem', fontFamily: 'monospace', color: '#475569' }}>
                    <span>Line 4</span>
                    <span style={{ color: 'var(--color-cyan)' }}>return n * factorial(n-1)</span>
                  </div>
                  <div style={{ padding: '6px 10px', background: 'rgba(34, 211, 238, 0.05)', border: '1px solid rgba(34, 211, 238, 0.15)', borderRadius: '8px', fontSize: '0.72rem', color: '#e2e8f0' }}>
                    AI: Recursion factor active. Stack grows.
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Ambient Music Player (Normal) */}
            <div ref={addRevealRef} className="bento-card bento-normal reveal reveal-delay-3" onMouseMove={handleCardMouseMove}>
              <div className="card-spotlight" />
              <div className="bento-content">
                <div className="bento-card-top">
                  <div className="bento-icon-wrap purple">
                    <Music size={20} />
                  </div>
                  <h3 className="bento-title">Lo-Fi Study Beats</h3>
                  <p className="bento-desc">
                    Activate ambient lo-fi tracks directly in our header player to block noise and trigger focus.
                  </p>
                </div>

                <div className="bento-preview-container">
                  <div className="music-mini-player">
                    <div className="music-track-info">
                      <div className="music-track-disc">
                        <Volume2 size={14} />
                      </div>
                      <div className="music-bars">
                        <span className="music-bar music-bar-1" />
                        <span className="music-bar music-bar-2" />
                        <span className="music-bar music-bar-3" />
                        <span className="music-bar music-bar-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Slide Decks Presentation (Normal) */}
            <div ref={addRevealRef} className="bento-card bento-normal reveal reveal-delay-4" onMouseMove={handleCardMouseMove}>
              <div className="card-spotlight" />
              <div className="bento-content">
                <div className="bento-card-top">
                  <div className="bento-icon-wrap green">
                    <Presentation size={20} />
                  </div>
                  <h3 className="bento-title">Auto Slide Decks</h3>
                  <p className="bento-desc">
                    Auto-generate beautiful presentation slides of code solutions to explain your project to teams.
                  </p>
                </div>
                
                <div className="bento-preview-container" style={{ padding: '16px', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '80%', height: '50px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-green)' }}>
                    [ Slide 1 of 5: Bubbles ]
                  </div>
                </div>
              </div>
            </div>

            {/* Card 5: Local keys security (Normal) */}
            <div ref={addRevealRef} className="bento-card bento-normal reveal reveal-delay-3" onMouseMove={handleCardMouseMove}>
              <div className="card-spotlight" />
              <div className="bento-content">
                <div className="bento-card-top">
                  <div className="bento-icon-wrap blue">
                    <Shield size={20} />
                  </div>
                  <h3 className="bento-title">Local API Keys</h3>
                  <p className="bento-desc">
                    Your OpenAI keys stay local in your browser cache. Secure auth tokens keep workspace safe.
                  </p>
                </div>
                
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px', fontSize: '0.75rem', color: '#64748b', alignItems: 'center' }}>
                  <Lock size={12} /> <span>100% Client Encryption</span>
                </div>
              </div>
            </div>

            {/* Card 6: Dashboard preview (Medium) */}
            <div ref={addRevealRef} className="bento-card bento-medium reveal reveal-delay-5" onMouseMove={handleCardMouseMove}>
              <div className="card-spotlight" />
              <div className="bento-content">
                <div className="bento-card-top">
                  <div className="bento-icon-wrap indigo">
                    <Laptop size={24} />
                  </div>
                  <h3 className="bento-title">Progress Heatmap</h3>
                  <p className="bento-desc">
                    Visualize study consistency. Tracks active sessions, correct visual traces, and hours coded.
                  </p>
                </div>
                
                <div className="bento-preview-container" style={{ padding: '12px', display: 'flex', flexWrap: 'wrap', gap: '3px', alignContent: 'center', justifyContent: 'center' }}>
                  {Array.from({ length: 28 }).map((_, i) => (
                    <span 
                      key={i} 
                      style={{ 
                        width: '10px', 
                        height: '10px', 
                        borderRadius: '2px', 
                        background: i % 7 === 0 ? 'var(--color-indigo)' : i % 5 === 0 ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255,255,255,0.02)' 
                      }} 
                    />
                  ))}
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ── AI CLASSROOM GRAPH VISUALIZATION ── */}
        <section ref={addRevealRef} id="roadmap" className="roadmap-visualization-section reveal">
          <div className="node-graph-box reveal reveal-delay-2">
            
            {/* Left Graph Node canvas */}
            <div className="node-graph-canvas-wrap">
              <svg className="nodes-svg-layer">
                {/* Glowing neon paths between nodes */}
                <line x1="70" y1="160" x2="220" y2="90" stroke="rgba(99, 102, 241, 0.15)" strokeWidth="3" />
                <line x1="220" y1="90" x2="350" y2="230" stroke="rgba(99, 102, 241, 0.15)" strokeWidth="3" />
                <line x1="350" y1="230" x2="480" y2="110" stroke="rgba(99, 102, 241, 0.15)" strokeWidth="3" />
                <line x1="480" y1="110" x2="620" y2="220" stroke="rgba(99, 102, 241, 0.15)" strokeWidth="3" />
                
                {/* Active dash path showing progress stream */}
                <line 
                  x1="70" y1="160" x2="220" y2="90" 
                  stroke="var(--color-cyan)" 
                  strokeWidth="3" 
                  className="neon-svg-line" 
                />
                <line 
                  x1="220" y1="90" x2="350" y2="230" 
                  stroke="var(--color-cyan)" 
                  strokeWidth="3" 
                  className="neon-svg-line" 
                />
              </svg>
              
              {/* HTML Nodes overlay */}
              {classroomNodes.map((node) => {
                const isActive = activeGraphNode.id === node.id;
                return (
                  <div
                    key={node.id}
                    className={`graph-node ${isActive ? 'active' : ''}`}
                    style={{ left: `${node.cx}px`, top: `${node.cy}px` }}
                    onClick={() => setActiveGraphNode(node)}
                  >
                    <div className={`node-dot-wrap ${node.status === 'completed' ? 'completed' : ''}`}>
                      {node.status === 'completed' ? (
                        <CheckCircle2 size={18} />
                      ) : node.status === 'active' ? (
                        <Sparkles size={18} />
                      ) : (
                        <Lock size={16} />
                      )}
                    </div>
                    <span className="node-label">{node.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Right details pane */}
            <div className="node-detail-panel">
              <div className="node-detail-card">
                <span className={`node-detail-badge ${activeGraphNode.status === 'completed' ? 'completed-badge' : 'active-badge'}`}>
                  Unit Status: {activeGraphNode.status}
                </span>
                
                <h3 className="node-detail-title">{activeGraphNode.label}</h3>
                
                <p className="node-detail-desc">
                  {activeGraphNode.desc}
                </p>

                <div className="node-class-tutor">
                  <div className="node-class-tutor-avatar">M</div>
                  <div className="tutor-bubble-content">
                    <span className="tutor-bubble-title" style={{ fontSize: '0.68rem' }}>AI Tutor Insight</span>
                    <p className="node-class-tutor-text">{activeGraphNode.advice}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ── HOW IT WORKS SCROLL TIMELINE ── */}
        <section id="how-it-works" className="how-it-works-section reveal" ref={timelineRef}>
          <div className="section-header">
            <span className="section-badge">Simple Pipeline</span>
            <h2 className="section-title">How Mean AI Teaches</h2>
            <p className="section-subtitle">
              Scroll down to watch our neon timeline highlight the pipeline steps sequentially.
            </p>
          </div>

          <div className="timeline-box">
            {/* Center neon path line */}
            <div className="timeline-track-line">
              <div 
                className="timeline-glow-line" 
                style={{ height: `${timelineProgressHeight}%` }}
              />
            </div>

            {/* Step 1 */}
            <div className={`timeline-step-row reveal reveal-delay-1 ${activeTimelineStep >= 1 ? 'active-step' : ''}`}>
              <div className="timeline-card-wrap">
                <div className="timeline-step-card">
                  <div className="timeline-step-header">
                    <span className="timeline-step-num">01</span>
                    <h3 className="timeline-step-title">Paste Code or Topic</h3>
                  </div>
                  <p className="timeline-step-desc">
                    Input any algorithm segment or search topic. Mean AI maps out structural nodes automatically.
                  </p>
                </div>
              </div>
              
              <div className="timeline-center-node">
                <div style={{ width: '8px', height: '8px', background: '#fff', borderRadius: '50%' }} />
              </div>
              
              <div className="timeline-spacer" />
            </div>

            {/* Step 2 */}
            <div className={`timeline-step-row reveal reveal-delay-2 ${activeTimelineStep >= 2 ? 'active-step' : ''}`}>
              <div className="timeline-card-wrap">
                <div className="timeline-step-card">
                  <div className="timeline-step-header">
                    <span className="timeline-step-num">02</span>
                    <h3 className="timeline-step-title">AI Traces Stack Frames</h3>
                  </div>
                  <p className="timeline-step-desc">
                    The engine executes the lines of code in isolated frames, logging variable mutations and recursive stack changes.
                  </p>
                </div>
              </div>
              
              <div className="timeline-center-node">
                <div style={{ width: '8px', height: '8px', background: '#fff', borderRadius: '50%' }} />
              </div>
              
              <div className="timeline-spacer" />
            </div>

            {/* Step 3 */}
            <div className={`timeline-step-row reveal reveal-delay-3 ${activeTimelineStep >= 3 ? 'active-step' : ''}`}>
              <div className="timeline-card-wrap">
                <div className="timeline-step-card">
                  <div className="timeline-step-header">
                    <span className="timeline-step-num">03</span>
                    <h3 className="timeline-step-title">Interactive Master Visuals</h3>
                  </div>
                  <p className="timeline-step-desc">
                    Click through execution flows, ask follow-up questions, save files, and master concepts without guesswork.
                  </p>
                </div>
              </div>
              
              <div className="timeline-center-node">
                <div style={{ width: '8px', height: '8px', background: '#fff', borderRadius: '50%' }} />
              </div>
              
              <div className="timeline-spacer" />
            </div>

          </div>
        </section>

        {/* ── TESTIMONIALS SECTION (Marquees loop) ── */}
        <section ref={addRevealRef} id="testimonials" className="testimonials-section reveal">
          <div className="section-header">
            <span className="section-badge">Student Reviews</span>
            <h2 className="section-title">Loved by engineers global</h2>
            <p className="section-subtitle">
              Read how Mean AI makes algorithms click easily without standard templates.
            </p>
          </div>

          <div className="testimonials-marquee-wrap">
            
            {/* First scroll row */}
            <div className="testimonials-track">
              {[
                { author: "Arjun K.", role: "CS Student (Stanford)", text: "Mean AI made recursion finally click for me. The execution call stack flow is absolute genius." },
                { author: "Priya S.", role: "Self-taught Developer", text: "Way better than spending hours on YouTube. I actually understand the local variables changing now." },
                { author: "Ravi M.", role: "Engineering Student", text: "The classroom roadmap graph is incredible — it feels like having a private YC engineer tutor." },
                { author: "Arjun K.", role: "CS Student (Stanford)", text: "Mean AI made recursion finally click for me. The execution call stack flow is absolute genius." },
                { author: "Priya S.", role: "Self-taught Developer", text: "Way better than spending hours on YouTube. I actually understand the local variables changing now." },
                { author: "Ravi M.", role: "Engineering Student", text: "The classroom roadmap graph is incredible — it feels like having a private YC engineer tutor." }
              ].map((t, idx) => (
                <div key={idx} className="testimonial-glass-card">
                  <div className="testimonial-stars-row">
                    {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                  </div>
                  <p className="testimonial-body-text">"{t.text}"</p>
                  
                  <div className="testimonial-user-row">
                    <div className="user-avatar-circle">{t.author.charAt(0)}</div>
                    <div className="user-meta">
                      <div className="user-name-wrap">
                        <span>{t.author}</span>
                        <CheckCircle2 size={13} className="verified-icon" />
                      </div>
                      <span className="user-description">{t.role}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Second reverse scroll row */}
            <div className="testimonials-track testimonials-track-reverse">
              {[
                { author: "Taro H.", role: "Frontend Dev (Tokyo)", text: "Vercel + OpenAI integration here is sleek. The UI/UX matches premium billion-dollar platforms." },
                { author: "Jessica L.", role: "Bootcamp grad", text: "I generated a slide deck for QuickSort partition logic and explained it to my team easily. Insane!" },
                { author: "Lucas G.", role: "Junior Software Engineer", text: "Built-in lo-fi music combined with dynamic code execution creates an outstanding learning focus." },
                { author: "Taro H.", role: "Frontend Dev (Tokyo)", text: "Vercel + OpenAI integration here is sleek. The UI/UX matches premium billion-dollar platforms." },
                { author: "Jessica L.", role: "Bootcamp grad", text: "I generated a slide deck for QuickSort partition logic and explained it to my team easily. Insane!" },
                { author: "Lucas G.", role: "Junior Software Engineer", text: "Built-in lo-fi music combined with dynamic code execution creates an outstanding learning focus." }
              ].map((t, idx) => (
                <div key={idx} className="testimonial-glass-card">
                  <div className="testimonial-stars-row">
                    {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                  </div>
                  <p className="testimonial-body-text">"{t.text}"</p>
                  
                  <div className="testimonial-user-row">
                    <div className="user-avatar-circle">{t.author.charAt(0)}</div>
                    <div className="user-meta">
                      <div className="user-name-wrap">
                        <span>{t.author}</span>
                        <CheckCircle2 size={13} className="verified-icon" />
                      </div>
                      <span className="user-description">{t.role}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ── FINAL PREMIUM CTA SECTION ── */}
        <section ref={addRevealRef} className="premium-cta-section reveal">
          <div className="cta-glass-box">
            <div className="cta-glowing-backdrop" />
            
            <div className="cta-content-inner">
              <span className="section-badge" style={{ marginBottom: '18px' }}>Start Coding Today</span>
              <h2 className="cta-headline">Stop Guessing. <br />Start Understanding.</h2>
              <p className="cta-description">
                Join thousands of engineers and students who are building solid algorithm foundations. Try it free today.
              </p>
              
              <button className="cta-btn-premium" onClick={onGetStarted}>
                Get Started Free <Sparkles size={18} />
              </button>

              <div className="cta-trust-proof">
                <div className="cta-trust-metric">
                  <span className="cta-trust-value">12.5K+</span>
                  <span className="cta-trust-label">Active Students</span>
                </div>
                <div className="cta-trust-metric" style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', borderRight: '1px solid rgba(255,255,255,0.06)', padding: '0 40px' }}>
                  <span className="cta-trust-value">1.2M+</span>
                  <span className="cta-trust-label">AI Explanations</span>
                </div>
                <div className="cta-trust-metric">
                  <span className="cta-trust-value">4.9/5</span>
                  <span className="cta-trust-label">Satisfaction Rate</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="landing-footer">
          <div className="footer-top">
            <div className="footer-brand-side">
              <Link to="/" className="footer-logo">
                <img src="/logo-space.jpeg" alt="Mean AI" className="footer-logo-img" />
                <span>Mean <span className="accent-text-glow">AI</span></span>
              </Link>
              <p className="footer-tagline">
                The ultimate YC-style AI assistant and interactive classroom visualizer for brainstorming, algorithms, and deep software learning.
              </p>
            </div>
            
            <div className="footer-links-side">
              <div className="footer-links-col">
                <span className="footer-col-title">Product</span>
                <a href="#demo" className="footer-col-link">Live Demo</a>
                <a href="#features" className="footer-col-link">Bento Features</a>
                <a href="#roadmap" className="footer-col-link">Roadmaps Graph</a>
              </div>
              
              <div className="footer-links-col">
                <span className="footer-col-title">Resources</span>
                <Link to="/blog" className="footer-col-link">Blog & News</Link>
                <Link to="/about" className="footer-col-link">About Us</Link>
              </div>

              <div className="footer-links-col">
                <span className="footer-col-title">Legal</span>
                <Link to="/privacy" className="footer-col-link">Privacy Policy</Link>
                <Link to="/terms" className="footer-col-link">Terms of Service</Link>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} Mean AI Inc. All rights reserved. Built for YC.</span>
            <div className="footer-legal-links">
              <span style={{ display: 'flex', gap: '4px', alignItems: 'center' }}><Lock size={12} /> Local API Encryption</span>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
