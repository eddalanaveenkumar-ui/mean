import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const AppContext = createContext(null);

const MODEL = "arcee-ai/trinity-large-preview:free";

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [chats, setChats] = useState([]);
  const [classes, setClasses] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [deepdiveActive, setDeepdiveActive] = useState(false);
  const [webSearchActive, setWebSearchActive] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('mean_theme') || 'system');
  const streamAbortRef = useRef(null);

  // Theme application and synchronization
  useEffect(() => {
    localStorage.setItem('mean_theme', theme);
    
    const applyTheme = () => {
      let activeTheme = theme;
      if (theme === 'system') {
        activeTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
      }
      
      if (activeTheme === 'light') {
        document.body.classList.add('light-theme');
      } else {
        document.body.classList.remove('light-theme');
      }
    };

    applyTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const handleChange = () => {
      if (theme === 'system') applyTheme();
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Load user on mount
  useEffect(() => {
    const stored = localStorage.getItem('mean_user');
    if (stored) {
      try {
        const u = JSON.parse(stored);
        setUser(u);
        setApiKey(u.apiKey);
      } catch (e) { /* ignore */ }
    }
    const storedChats = localStorage.getItem('mean_chats');
    let initialChats = [];
    if (storedChats) {
      try { initialChats = JSON.parse(storedChats); } catch (e) { /* ignore */ }
    }

    initialChats = initialChats.filter(c => c.messages && c.messages.length > 0);
    const freshChat = { id: Date.now().toString(), title: 'New Chat', messages: [] };
    
    // Attempt DB sync if user is present
    const loadFromDB = async (jwt) => {
       try {
          const r = await fetch('https://mean-backend-zg5d.onrender.com/chats', { headers: { 'Authorization': `Bearer ${jwt}` } });
          const dbChats = await r.json();
          if (dbChats?.chats && dbChats.chats.length > 0) {
             const merged = [freshChat, ...dbChats.chats.map(c => ({ id: c.chat_id, title: c.title, messages: c.messages }))];
             setChats(merged);
             setCurrentChatId(freshChat.id);
             localStorage.setItem('mean_chats', JSON.stringify(merged));
          } else {
             const mergedLocal = [freshChat, ...initialChats];
             setChats(mergedLocal);
             setCurrentChatId(freshChat.id);
          }
       } catch (e) {
          const mergedLocal = [freshChat, ...initialChats];
          setChats(mergedLocal);
          setCurrentChatId(freshChat.id);
       }
       
       try {
           const cResp = await fetch('https://mean-backend-zg5d.onrender.com/classes', { headers: { 'Authorization': `Bearer ${jwt}` } });
           const dbClasses = await cResp.json();
           if (dbClasses?.classes) setClasses(dbClasses.classes);
       } catch(e) {}
    };

    if (stored) {
      try {
        const u = JSON.parse(stored);
        if (u.jwt) {
           loadFromDB(u.jwt);
           return;
        }
      } catch (e) {}
    }

    initialChats = [freshChat, ...initialChats];
    setChats(initialChats);
    setCurrentChatId(freshChat.id);
    localStorage.setItem('mean_chats', JSON.stringify(initialChats));
  }, []);

  // Persist chats
  const persistChats = useCallback((updatedChats, specificChat = null) => {
    localStorage.setItem('mean_chats', JSON.stringify(updatedChats));
    
    // Sync specifically modified chat to DB
    if (specificChat && specificChat.id && user?.jwt && specificChat.messages.length > 0) {
        fetch('https://mean-backend-zg5d.onrender.com/chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.jwt}` },
            body: JSON.stringify({ chat_id: specificChat.id, title: specificChat.title, messages: specificChat.messages })
        }).catch(() => {});
    }
  }, [user]);

  // Login
  const login = useCallback((userData) => {
    setUser(userData);
    setApiKey(userData.apiKey);
    localStorage.setItem('mean_user', JSON.stringify(userData));
  }, []);

  // Logout
  const logout = useCallback(() => {
    setUser(null);
    setApiKey('');
    localStorage.removeItem('mean_user');
    setShowProfile(false);
  }, []);

  // Current chat
  const currentChat = chats.find(c => c.id === currentChatId) || null;

  // New chat — prevents duplicates
  const newChat = useCallback(() => {
    if (isStreaming) return;
    // If already on an empty chat, just stay there
    const current = chats.find(c => c.id === currentChatId);
    if (current && current.messages.length === 0) return;
    // Check if any empty chat exists, switch to it
    const existingEmpty = chats.find(c => c.messages.length === 0);
    if (existingEmpty) {
      setCurrentChatId(existingEmpty.id);
      setSidebarOpen(false);
      return;
    }
    const chat = { id: Date.now().toString(), title: 'New Chat', messages: [] };
    const updated = [chat, ...chats];
    setChats(updated);
    setCurrentChatId(chat.id);
    persistChats(updated);
    setSidebarOpen(false);
  }, [chats, currentChatId, isStreaming, persistChats]);

  // Delete chat
  const deleteChat = useCallback((chatId) => {
    if (isStreaming) return;
    let updated = chats.filter(c => c.id !== chatId);
    if (updated.length === 0) {
      const fresh = { id: Date.now().toString(), title: 'New Chat', messages: [] };
      updated = [fresh];
      setCurrentChatId(fresh.id);
    } else if (currentChatId === chatId) {
      setCurrentChatId(updated[0].id);
    }
    setChats(updated);
    persistChats(updated);
  }, [chats, currentChatId, isStreaming, persistChats]);

  // Load chat
  const loadChat = useCallback((chatId) => {
    if (isStreaming) return;
    setCurrentChatId(chatId);
    setSidebarOpen(false);
  }, [isStreaming]);

  // Add message to current chat
  const addMessage = useCallback((role, content, displayContent = null) => {
    setChats(prev => {
      let targetChat = null;
      const updated = prev.map(c => {
        if (c.id === currentChatId) {
          targetChat = {
            ...c,
            messages: [...c.messages, {
              role, content, displayContent,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]
          };
          return targetChat;
        }
        return c;
      });
      persistChats(updated, targetChat);
      return updated;
    });
  }, [currentChatId, persistChats]);

  // Generate AI title
  const generateTitle = useCallback(async (userMessage, chatId) => {
    try {
      const cleanedKey = apiKey ? apiKey.trim() : '';
      const isGeminiKey = cleanedKey.includes('AIza');
      
      let title = '';
      if (isGeminiKey) {
          const g_url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${cleanedKey}`;
          const g_resp = await fetch(g_url, {
             method: 'POST', headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
                systemInstruction: { parts: [{ text: 'Generate a SHORT chat title (max 5 words). Return ONLY the title — no quotes, no punctuation.' }]},
                contents: [{ role: 'user', parts: [{ text: userMessage.slice(0, 300) }] }]
             })
          });
          if (!g_resp.ok) throw new Error('err');
          const data = await g_resp.json();
          title = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      } else {
          const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + cleanedKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: MODEL, messages: [{ role: 'system', content: 'Generate a SHORT chat title (max 5 words). Return ONLY the title — no quotes, no punctuation.' }, { role: 'user', content: userMessage.slice(0, 300) }], max_tokens: 15, stream: false })
          });
          if (!resp.ok) throw new Error('err');
          const data = await resp.json();
          title = data.choices?.[0]?.message?.content?.trim() || '';
      }
      title = title.replace(/^["'`#*]+|["'`#*]+$/g, '').trim();
      if (title.length > 40) title = title.substring(0, 37) + '…';
      if (!title) throw new Error('empty');

      setChats(prev => {
        let target = null;
        const updated = prev.map(c => {
           if (c.id === chatId) { target = { ...c, title }; return target; }
           return c;
        });
        persistChats(updated, target);
        return updated;
      });
    } catch (e) {
      let t = userMessage.trim().split('\n')[0];
      if (t.length > 35) t = t.substring(0, 32) + '…';
      setChats(prev => {
        let target = null;
        const updated = prev.map(c => {
           if (c.id === chatId) { target = { ...c, title: t || 'New Chat' }; return target; }
           return c;
        });
        persistChats(updated, target);
        return updated;
      });
    }
  }, [apiKey, persistChats]);

  // Stream AI response
  const sendMessage = useCallback(async (text, fileContent = null, fileName = null) => {
    if ((!text.trim() && !fileName) || isStreaming) {
      if (isStreaming && streamAbortRef.current) {
        streamAbortRef.current.abort();
      }
      return;
    }

    let userContent = text;
    let displayContent = text;

    if (fileName && fileContent) {
      displayContent = `📎 ${fileName}\n\n${text || 'Please analyze this document.'}`;
      userContent = `[ATTACHED FILE: "${fileName}"]\n\n=== FILE CONTENT ===\n${fileContent}\n=== END ===\n\nUser: ${text || 'Analyze this document.'}`;
    }

    // Add user message
    const chatId = currentChatId;
    addMessage('user', userContent, displayContent);

    // Generate title if first message
    const chat = chats.find(c => c.id === chatId);
    if (chat && chat.title === 'New Chat') {
      generateTitle(text || fileName, chatId);
    }

    // Start streaming
    setIsStreaming(true);
    streamAbortRef.current = new AbortController();

    const userName = user?.name || 'User';
    const PERSONA = `IDENTITY: Your name is Mean AI. You were created by the Mean AI team, founded by Naveen. You are NOT Claude/GPT/Gemini. Always refer to yourself as Mean AI. The current user is ${userName}.`;

    const systemPrompt = deepdiveActive
      ? `${PERSONA}\nYou are in Deepdive mode — hyper-analytical. Think step-by-step, consider edge cases. Be thorough and precise.\n\nFORMATTING RULES:\n- Use emojis to make responses engaging: 👉 for bullet points, 📌 for key points, 💡 for tips, ⚡ for important notes, ✅ for conclusions, 🔥 for highlights\n- Use ## headers for sections, ### for sub-topics\n- Use code blocks with language tags\n- Use **bold** for emphasis\n- Use tables when comparing things\n- Make content scannable and visually appealing`
      : `${PERSONA}\nYou are Mean AI, a powerful and friendly assistant.\n\nFORMATTING RULES:\n- Use emojis to make responses lively and engaging\n- Use 👉 for bullet points instead of plain dashes\n- Use 📌 for key takeaways, 💡 for tips, ⚡ for important info, ✅ for steps/conclusions, 🔥 for highlights, 📝 for notes\n- Use ## headers for major sections\n- Use **bold** for emphasis on key terms\n- Use code blocks with language tags for code\n- Keep responses well-structured with clear visual hierarchy\n- Be concise but thorough`;

    const allMsgs = chats.find(c => c.id === chatId)?.messages || [];
    let finalUserContent = userContent;
    // Enhanced Trigger Terminology: Automatically routes to DuckDuckGo for facts.
    const searchTriggerWords = /latest|news|today|current|recent|price|weather|who is|what is|how to|search|find|history of|unclear|data|statistics|when did|explain the origin|fact check|location of/i;
    let didSearch = false;
    
    if (webSearchActive || searchTriggerWords.test(text)) {
      try {
        window.dispatchEvent(new CustomEvent('stream-update', { detail: { text: "🌍 *Searching Fast Knowledge Base (Wikipedia)...*\n\n" } }));
        didSearch = true;
        const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(text)}&utf8=&format=json&origin=*`;
        const sReq = await fetch(wikiUrl);
        const sData = await sReq.json();
        
        const results = [];
        const searchItems = sData.query?.search || [];
        for (let i = 0; i < Math.min(4, searchItems.length); i++) {
          let snippet = searchItems[i].snippet.replace(/<[^>]+>/g, '').trim();
          snippet = snippet.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
          results.push(`- **${searchItems[i].title}**: ${snippet}`);
        }
        
        if (results.length > 0) {
          finalUserContent += `\n\n[REALTIME KNOWLEDGE BASE (Wikipedia)]\n${results.join('\n')}\n(Use this verified info to accurately answer.)`;
        }
      } catch (e) {
        // silently fail and proceed
      }
    }

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...allMsgs.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: finalUserContent }
    ];

    const cleanedKey = apiKey ? apiKey.trim() : '';
    const isGeminiKey = cleanedKey.includes('AIza');
    
    let url, headers, body;

    if (isGeminiKey) {
       url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?alt=sse&key=${cleanedKey}`;
       headers = { 'Content-Type': 'application/json' };
       let contents = [];
       apiMessages.forEach(m => {
          if (m.role !== 'system') contents.push({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] });
       });
       body = JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents
       });
    } else {
       url = 'https://openrouter.ai/api/v1/chat/completions';
       headers = { 'Authorization': 'Bearer ' + cleanedKey, 'Content-Type': 'application/json' };
       body = JSON.stringify({ model: MODEL, messages: apiMessages, stream: true });
    }

    let assistantText = didSearch ? "🌍 *Database Check Complete*\n\n" : "";
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers,
        body,
        signal: streamAbortRef.current.signal
      });

      if (!resp.ok) throw new Error(`API error ${resp.status}`);
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (trimmed.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(trimmed.slice(6));
              let delta = '';
              if (isGeminiKey) {
                 delta = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
              } else {
                 delta = parsed.choices?.[0]?.delta?.content || '';
              }
              if (delta) {
                assistantText += delta;
                window.dispatchEvent(new CustomEvent('stream-update', { detail: { text: assistantText } }));
              }
            } catch (e) { /* ignore */ }
          }
        }
      }

      window.dispatchEvent(new CustomEvent('stream-end'));
      if (assistantText) {
        addMessage('assistant', assistantText);
      } else {
        addMessage('assistant', '(empty response)');
      }
    } catch (err) {
      window.dispatchEvent(new CustomEvent('stream-end'));
      if (err.name === 'AbortError') {
        if (assistantText.trim()) {
           addMessage('assistant', assistantText);
        }
      } else {
        addMessage('assistant', `⚠️ Error: ${err.message}`);
      }
    } finally {
      setIsStreaming(false);
      streamAbortRef.current = null;
    }
  }, [currentChatId, chats, isStreaming, apiKey, user, deepdiveActive, webSearchActive, addMessage, generateTitle]);

  const value = {
    user, apiKey, login, logout,
    chats, currentChat, currentChatId, setCurrentChatId,
    classes, setClasses,
    newChat, deleteChat, loadChat, addMessage, sendMessage,
    isStreaming, setIsStreaming,
    sidebarOpen, setSidebarOpen,
    sidebarCollapsed, setSidebarCollapsed,
    showProfile, setShowProfile,
    deepdiveActive, setDeepdiveActive,
    webSearchActive, setWebSearchActive,
    theme, setTheme,
    persistChats, setChats, setApiKey,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
