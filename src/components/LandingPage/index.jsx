import React, { useState, useEffect } from 'react';
import './LandingPage.css';

export default function LandingPage({ onGetStarted }) {
  const [navHidden, setNavHidden] = useState(false);

  useEffect(() => {
    // 1. Setup Tailwind Config on window BEFORE injecting the script
    window.tailwind = {
      config: {
        darkMode: "class",
        theme: {
          extend: {
            colors: {
              secondary: "#00686e",
              "on-secondary": "#ffffff",
              "on-primary-container": "#001a41",
              "on-secondary-fixed-variant": "#004f54",
              "on-surface-variant": "#424753",
              "tertiary-fixed-dim": "#d1bcff",
              "on-primary-fixed": "#001a41",
              "on-tertiary-fixed": "#24005b",
              "on-secondary-fixed": "#002022",
              "surface-tint": "#005ac1",
              "primary-container": "#d8e2ff",
              error: "#ba1a1a",
              tertiary: "#6750a4",
              "error-container": "#ffdad6",
              "on-tertiary-container": "#21005d",
              "on-primary-fixed-variant": "#004494",
              outline: "#737782",
              "on-background": "#1a1c1e",
              "outline-variant": "#c2c7cf",
              primary: "#005ac1",
              "inverse-primary": "#adc6ff",
              "secondary-fixed-dim": "#00686e",
              "surface-container-lowest": "#ffffff",
              "surface-container-highest": "#e2e2e8",
              "surface-container-low": "#f7f9ff",
              "on-tertiary": "#ffffff",
              "primary-fixed-dim": "#adc6ff",
              "tertiary-container": "#e9ddff",
              "on-error-container": "#410002",
              "on-tertiary-fixed-variant": "#4f378b",
              "on-error": "#ffffff",
              "primary-fixed": "#d8e2ff",
              surface: "#fdfcff",
              "surface-container-high": "#e1e2e8",
              "on-surface": "#1a1c1e",
              "secondary-fixed": "#97f0ff",
              "secondary-container": "#00eefc",
              "surface-variant": "#dee3eb",
              "surface-dim": "#d8dae0",
              "inverse-surface": "#2f3033",
              "inverse-on-surface": "#f1f0f4",
              "tertiary-fixed": "#e9ddff",
              background: "#fdfcff",
              "surface-bright": "#fdfcff",
              "on-secondary-container": "#002022",
              "surface-container": "#eceef4",
              "on-primary": "#ffffff"
            },
            borderRadius: {
              DEFAULT: "0.25rem",
              lg: "0.5rem",
              xl: "1rem",
              "2xl": "1.5rem",
              full: "9999px"
            },
            spacing: {
              "margin-mobile": "16px",
              "stack-md": "24px",
              base: "8px",
              "stack-sm": "12px",
              gutter: "24px",
              "container-max": "1440px",
              "margin-desktop": "40px",
              "stack-lg": "48px"
            },
            fontFamily: {
              "label-mono": ["JetBrains Mono"],
              "display-lg": ["Geist", "Inter", "sans-serif"],
              "headline-md": ["Geist", "Inter", "sans-serif"],
              "display-lg-mobile": ["Geist", "Inter", "sans-serif"],
              "body-md": ["Inter"],
              "body-lg": ["Inter"],
              caption: ["Inter"]
            }
          }
        }
      }
    };

    // 2. Inject Tailwind CDN Script
    const tailwindScript = document.createElement('script');
    tailwindScript.src = "https://cdn.tailwindcss.com?plugins=forms,container-queries";
    tailwindScript.id = "tailwind-cdn";
    document.head.appendChild(tailwindScript);

    // 3. Inject Google Fonts & Material Symbols Link Tags
    const symbolsLink = document.createElement('link');
    symbolsLink.rel = 'stylesheet';
    symbolsLink.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap';
    symbolsLink.id = 'material-symbols-fonts';
    document.head.appendChild(symbolsLink);

    const interLink = document.createElement('link');
    interLink.rel = 'stylesheet';
    interLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap';
    interLink.id = 'inter-fonts';
    document.head.appendChild(interLink);

    // Force Light theme classes
    document.documentElement.classList.add('light');
    document.body.classList.add('light-theme-landing');

    // 4. Scroll Reveal IntersectionObserver
    const observerOptions = { threshold: 0.1 };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    const reveals = document.querySelectorAll('.glass-panel, .octane-render');
    reveals.forEach((el, index) => {
      el.classList.add('scroll-reveal');
      el.style.transitionDelay = `${index * 100}ms`;
      observer.observe(el);
    });

    // 5. Sticky Navigation effect
    let lastScroll = 0;
    const handleScroll = () => {
      const currentScroll = window.pageYOffset;
      if (currentScroll > lastScroll && currentScroll > 150) {
        setNavHidden(true);
      } else {
        setNavHidden(false);
      }
      lastScroll = currentScroll;
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      // Cleanup script tags & style tags injected by Tailwind CDN
      document.getElementById('tailwind-cdn')?.remove();
      document.getElementById('material-symbols-fonts')?.remove();
      document.getElementById('inter-fonts')?.remove();
      document.documentElement.classList.remove('light');
      document.body.classList.remove('light-theme-landing');

      const styleTags = Array.from(document.querySelectorAll('style'));
      styleTags.forEach(style => {
        if (style.id && style.id.includes('tailwind')) {
          style.remove();
        } else if (style.textContent && style.textContent.includes('--tw-')) {
          style.remove();
        }
      });

      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="landing-page-root selection:bg-primary/20">
      {/* Navigation */}
      <nav 
        className="fixed left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-5xl transition-all duration-300"
        style={{
          top: navHidden ? '-100px' : '24px',
          opacity: navHidden ? 0 : 1
        }}
      >
        <div className="glass-nav rounded-full px-4 sm:px-8 py-4 flex justify-between items-center border border-black/5 shadow-xl">
          <div className="flex items-center gap-3">
            <img 
              alt="Mean AI Logo" 
              className="w-8 h-8 object-contain" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDFcdvNuaIUEbUIjCqsTLenwQp-c5cGHUphV3W96G20BPFW3rnP7xAZ77RhYa7RJ3RPML2MC5HtnZ9JZmMo-YdxotKhZ6b8n-juVtvUBokwFcKNe3HbGpFqVo9I6u6Xpb2GmCzoOTQ_jF9to4Fg3zHFwW-Qjr8vnEpr2e9JBgcUD5Nwj4Zs1gPRSeVpywaQyAWpTdrSsYYP4yPi6KgLUTq93-guBu9mJW4AorDWhhp1csMH8Dwi4HkhcGH3vYi5FxEj7NMi6YQTozHS"
            />
            <span className="font-display-lg text-xl tracking-tighter text-on-background">Mean AI</span>
          </div>
          <div className="hidden md:flex items-center gap-10">
            <a className="text-on-surface font-medium text-sm hover:text-primary transition-colors" href="#">Curriculum</a>
            <a className="text-on-surface-variant font-medium text-sm hover:text-primary transition-colors" href="#">Lab Space</a>
            <a className="text-on-surface-variant font-medium text-sm hover:text-primary transition-colors" href="#">Interactive Docs</a>
            <a className="text-on-surface-variant font-medium text-sm hover:text-primary transition-colors" href="#">Pricing</a>
          </div>
          <div className="flex items-center">
            <button 
              className="bg-primary/10 hover:bg-primary/20 text-primary text-sm font-semibold px-6 py-2 rounded-full border border-primary/10 transition-all"
              onClick={onGetStarted}
            >
              Enter Classroom
            </button>
          </div>
        </div>
      </nav>

      <main className="relative">
        <div className="hero-glow-cyan"></div>
        <div className="hero-glow-violet"></div>

        {/* Hero Section */}
        <section className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-20 px-4 overflow-hidden">
          <div className="relative z-10 max-w-5xl text-center space-y-6 mb-20">
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-primary/20 bg-primary/5 mb-4 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span className="font-label-mono text-xs text-primary uppercase tracking-[0.2em]">Next-Gen Learning Environment</span>
            </div>
            <h1 className="font-display-lg text-5xl md:text-7xl text-on-background leading-[1.1] tracking-tight">
              AI-Driven <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-tertiary">Interactive Classroom</span>
            </h1>
            <p className="font-body-lg text-lg md:text-xl text-on-surface-variant max-w-3xl mx-auto leading-relaxed">
              Step into a 3D-inspired workspace where complex coding and mathematics come to life. Real-time reasoning, visual execution stacks, and autonomous AI tutors at your side.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6">
              <button 
                className="btn-premium text-on-primary font-bold px-10 py-5 rounded-2xl text-lg w-full sm:w-auto flex items-center justify-center gap-3"
                onClick={onGetStarted}
              >
                Start Learning
                <span className="material-symbols-outlined text-xl">school</span>
              </button>
              <button className="px-10 py-5 rounded-2xl text-lg w-full sm:w-auto border border-outline-variant hover:bg-primary/5 transition-all text-on-background backdrop-blur-sm">
                Watch Demo
              </button>
            </div>
          </div>

          {/* 3D Visualization Area */}
          <div className="relative w-full max-w-6xl mx-auto px-4 perspective-1000">
            <div className="octane-render relative group">
              <img 
                alt="3D Learning Interface" 
                className="w-full h-auto rounded-2xl border border-black/5" 
                src="https://lh3.googleusercontent.com/aida/AP1WRLtZYrqXStpudyEceCvP0jjzwOfH-TPNm8H8Jvlhe6uFzYUNdlGhdK8O6fVShD9Mw__YpTqHkhupW6V17gtwb13WRJEEn7gnmTBJ20h0AHQiGadBPR31K3KyGkciH8iJxw-p47ftDvjGT3MpHgtlOFEVvivcUJw-dw7sapbOrqalPvrclrIHqAnA7aSSPsFobE3Sg-ZfbQr3Bmu7tzIeurwrgfmbOCc9vuH7Tlpw-nwM9P79_rOVo-WvP3M"
              />
              
              {/* Glassmorphic UI Overlays */}
              {/* Variables Scope */}
              <div className="absolute -left-4 md:-left-12 top-1/4 glass-panel p-6 rounded-2xl w-56 md:w-72 animate-float hidden sm:block">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary text-sm">data_object</span>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60">Variables Scope</h4>
                </div>
                <div className="code-syntax space-y-2">
                  <div className="flex justify-between border-b border-black/5 pb-1">
                    <span className="text-primary/70">root_node</span>
                    <span className="text-on-background">0x7F22A</span>
                  </div>
                  <div className="flex justify-between border-b border-black/5 pb-1">
                    <span className="text-primary/70">depth</span>
                    <span className="text-on-background">4</span>
                  </div>
                  <div className="flex justify-between border-b border-black/5 pb-1">
                    <span className="text-primary/70">visited</span>
                    <span className="text-on-background">[...]</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-primary/70">status</span>
                    <span className="text-green-600 font-semibold">solving</span>
                  </div>
                </div>
              </div>

              {/* Execution Stack */}
              <div className="absolute -right-4 md:-right-12 bottom-1/4 glass-panel p-6 rounded-2xl w-64 md:w-80 animate-float [animation-delay:1s] hidden sm:block">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-tertiary text-sm">layers</span>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60">Execution Stack</h4>
                </div>
                <div className="code-syntax space-y-3">
                  <div className="bg-primary/10 border-l-2 border-primary p-2 rounded">
                    <p className="text-on-background text-xs font-medium">calculate_recursion(n-1)</p>
                  </div>
                  <div className="bg-black/5 border-l-2 border-black/10 p-2 rounded opacity-80">
                    <p className="text-on-background/70 text-xs">optimize_subproblem(id: 42)</p>
                  </div>
                  <div className="bg-black/5 border-l-2 border-black/10 p-2 rounded opacity-50">
                    <p className="text-on-background/40 text-xs">main_executor()</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="py-20 border-y border-black/5 bg-surface-container-low/30">
          <div className="max-w-5xl mx-auto px-4 md:px-10 text-center">
            <p className="font-label-mono text-xs text-on-surface-variant mb-12 uppercase tracking-[0.3em]">Utilized by Elite Institutions</p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-32 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
              <div className="text-2xl font-bold tracking-tighter text-on-background">NEXUS LABS</div>
              <div className="text-2xl font-bold tracking-tighter text-on-background">SYNTHOS ACADEMY</div>
              <div className="text-2xl font-bold tracking-tighter text-on-background">QUANTUM EDU</div>
              <div className="text-2xl font-bold tracking-tighter text-on-background">VECTOR MATH</div>
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section className="py-32 max-w-5xl mx-auto px-4 md:px-10">
          <div className="text-center mb-20 px-4">
            <h2 className="font-display-lg text-4xl md:text-5xl text-on-background mb-6">Master Complexity in 3D</h2>
            <p className="font-body-md text-on-surface-variant max-w-xl mx-auto">Our classroom isn't just a video player. It's a living, breathing computational engine.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl group hover:border-primary/50 transition-all duration-500 overflow-hidden relative">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors"></div>
              <div className="space-y-6">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>terminal</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-2xl text-on-background mb-3">Live Trace Reasoning</h3>
                  <p className="font-body-md text-on-surface-variant leading-relaxed">Watch the AI explain its logic through real-time code execution and visual data structures.</p>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl group hover:border-secondary/50 transition-all duration-500 overflow-hidden relative">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-secondary/5 rounded-full blur-3xl group-hover:bg-secondary/10 transition-colors"></div>
              <div className="space-y-6">
                <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>functions</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-2xl text-on-background mb-3">Interactive Algebra</h3>
                  <p className="font-body-md text-on-surface-variant leading-relaxed">Manipulate 3D mathematical models. Change parameters and watch the world rebuild instantly.</p>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl group hover:border-tertiary/50 transition-all duration-500 overflow-hidden relative">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-tertiary/5 rounded-full blur-3xl group-hover:bg-tertiary/10 transition-colors"></div>
              <div className="space-y-6">
                <div className="w-14 h-14 rounded-2xl bg-tertiary/10 flex items-center justify-center text-tertiary">
                  <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-2xl text-on-background mb-3">Autonomous Tutors</h3>
                  <p className="font-body-md text-on-surface-variant leading-relaxed">Dedicated AI agents that learn your pace and adapt the curriculum to your cognitive style.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-40 relative px-4">
          <div className="max-w-5xl mx-auto text-center">
            <div className="glass-panel p-6 sm:p-16 rounded-3xl sm:rounded-[2.5rem] relative overflow-hidden bg-white/40">
              <div className="absolute -right-20 -bottom-20 opacity-[0.03]">
                <span className="material-symbols-outlined text-[300px]">auto_fix_high</span>
              </div>
              <h2 className="font-display-lg text-4xl md:text-6xl text-on-background mb-8">Ready to evolve your intelligence?</h2>
              <p className="font-body-lg text-xl text-on-surface-variant mb-12 max-w-2xl mx-auto">
                Join the waitlist for the most immersive learning environment ever created. Limited spots for the Early Access cohort.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button 
                  className="btn-premium text-on-primary font-bold px-14 py-6 rounded-2xl text-xl w-full sm:w-auto shadow-2xl"
                  onClick={onGetStarted}
                >
                  Request Invite
                </button>
                <button className="px-14 py-6 rounded-2xl text-xl w-full sm:w-auto text-on-background border border-black/10 hover:bg-black/5 transition-all font-semibold backdrop-blur-sm">
                  View Curriculum
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-surface-container-low w-full py-20 border-t border-black/5 px-4 sm:px-0">
        <div className="flex flex-col md:flex-row justify-between items-start max-w-5xl mx-auto px-4 md:px-10 gap-16 w-full">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <img 
                alt="Mean AI Logo" 
                className="w-10 h-10 object-contain" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDFcdvNuaIUEbUIjCqsTLenwQp-c5cGHUphV3W96G20BPFW3rnP7xAZ77RhYa7RJ3RPML2MC5HtnZ9JZmMo-YdxotKhZ6b8n-juVtvUBokwFcKNe3HbGpFqVo9I6u6Xpb2GmCzoOTQ_jF9to4Fg3zHFwW-Qjr8vnEpr2e9JBgcUD5Nwj4Zs1gPRSeVpywaQyAWpTdrSsYYP4yPi6KgLUTq93-guBu9mJW4AorDWhhp1csMH8Dwi4HkhcGH3vYi5FxEj7NMi6YQTozHS"
              />
              <span className="font-display-lg text-2xl text-on-background">Mean AI</span>
            </div>
            <p className="font-caption text-sm text-on-surface-variant max-w-xs leading-relaxed">
              Empowering the next generation of polymaths through high-fidelity AI-driven education.
            </p>
            <p className="text-xs text-on-surface-variant/50">© 2024 Mean AI Lab. All rights reserved.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-20 gap-y-10">
            <div className="space-y-4">
              <h4 className="text-on-background font-bold text-sm uppercase tracking-widest">Platform</h4>
              <nav className="flex flex-col gap-2">
                <a className="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#">Interactive Lab</a>
                <a className="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#">Live Reasoning</a>
                <a className="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#">Benchmarks</a>
              </nav>
            </div>
            <div className="space-y-4">
              <h4 className="text-on-background font-bold text-sm uppercase tracking-widest">Resources</h4>
              <nav className="flex flex-col gap-2">
                <a className="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#">Documentation</a>
                <a className="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#">API Access</a>
                <a className="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#">Research</a>
              </nav>
            </div>
            <div className="space-y-4">
              <h4 className="text-on-background font-bold text-sm uppercase tracking-widest">Social</h4>
              <div className="flex gap-4">
                <a className="w-10 h-10 rounded-xl border border-black/10 flex items-center justify-center hover:bg-primary/5 transition-colors" href="#">
                  <span className="material-symbols-outlined text-[20px] text-on-surface-variant">public</span>
                </a>
                <a className="w-10 h-10 rounded-xl border border-black/10 flex items-center justify-center hover:bg-primary/5 transition-colors" href="#">
                  <span className="material-symbols-outlined text-[20px] text-on-surface-variant">terminal</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
