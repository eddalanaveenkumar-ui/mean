import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import './FreebuffAgent.css';

export default function FreebuffAgent({ isOpen, onClose }) {
  const { apiKey, selectedModel } = useApp();
  const [logs, setLogs] = useState([{ type: 'system', text: 'Mean AI Freebuff Agent initialized. Ready for task...' }]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userText = input.trim();
    setInput('');
    setLogs(prev => [...prev, { type: 'user', text: `> ${userText}` }]);
    setIsProcessing(true);

    const cleanedKey = apiKey ? apiKey.trim() : '';
    if (!cleanedKey) {
      setLogs(prev => [...prev, { type: 'error', text: 'Error: API Key not found. Please set it in Settings.' }]);
      setIsProcessing(false);
      return;
    }

    const systemPrompt = `You are Mean AI's Agent, an autonomous programming agent similar to Freebuff.
You operate in a command-line interface and act as a super-developer.
Think step by step and present your output in a terminal-friendly way.
Use the following format markers at the beginning of relevant lines when appropriate:
[THOUGHT] Your reasoning here
[COMMAND] any terminal command you would run
[FILE_EDIT] what file you would edit and what changes
[OUTPUT] the final result or code

Example:
[THOUGHT] I need to create a new React component for the header.
[COMMAND] mkdir src/components/Header
[FILE_EDIT] src/components/Header/index.jsx
...code...
[OUTPUT] Header component created successfully.`;

    try {
      const isGeminiKey = cleanedKey.includes('AIza');
      let url, headers, body;

      if (selectedModel.id === 'gemini' && isGeminiKey) {
         url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${cleanedKey}`;
         headers = { 'Content-Type': 'application/json' };
         body = JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: userText }] }]
         });
      } else {
         url = 'https://openrouter.ai/api/v1/chat/completions';
         headers = { 'Authorization': 'Bearer ' + cleanedKey, 'Content-Type': 'application/json' };
         let modelId = selectedModel.provider === 'openrouter' ? selectedModel.id : 'openrouter/free';
         body = JSON.stringify({
            model: modelId,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userText }
            ],
            stream: true
         });
      }

      setLogs(prev => [...prev, { type: 'agent', text: '' }]);

      const resp = await fetch(url, { method: 'POST', headers, body });
      if (!resp.ok) throw new Error(`API error ${resp.status}`);

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let agentText = '';

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
               if (selectedModel.id === 'gemini' && isGeminiKey) {
                  delta = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
               } else {
                  delta = parsed.choices?.[0]?.delta?.content || '';
               }
               if (delta) {
                 agentText += delta;
                 setLogs(prev => {
                   const newLogs = [...prev];
                   newLogs[newLogs.length - 1] = { type: 'agent', text: agentText };
                   return newLogs;
                 });
               }
             } catch (e) {}
          }
        }
      }
    } catch (err) {
      setLogs(prev => [...prev, { type: 'error', text: `Error: ${err.message}` }]);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  const escapeHtml = (unsafe) => {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
  };

  const renderAgentText = (text) => {
    let formatted = escapeHtml(text)
      .replace(/\[THOUGHT\]/g, '<span style="color: #61afef; font-weight: bold;">[THOUGHT]</span>')
      .replace(/\[COMMAND\]/g, '<span style="color: #98c379; font-weight: bold;">[COMMAND]</span>')
      .replace(/\[FILE_EDIT\]/g, '<span style="color: #e5c07b; font-weight: bold;">[FILE_EDIT]</span>')
      .replace(/\[OUTPUT\]/g, '<span style="color: #c678dd; font-weight: bold;">[OUTPUT]</span>');
    return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  const renderLog = (log, index) => {
    if (log.type === 'user') return <div key={index} className="log-line user">{log.text}</div>;
    if (log.type === 'system') return <div key={index} className="log-line system">{log.text}</div>;
    if (log.type === 'error') return <div key={index} className="log-line error">{log.text}</div>;
    
    return (
      <div key={index} className="log-line agent">
        {renderAgentText(log.text)}
      </div>
    );
  };

  return (
    <div className="fb-agent-overlay">
      <div className="fb-agent-container">
        <header className="fb-agent-header">
          <div className="fb-agent-title">
            <i className="fas fa-terminal" /> Mean AI Agent (Freebuff-style)
          </div>
          <button className="fb-agent-close" onClick={onClose}><i className="fas fa-times" /></button>
        </header>
        <div className="fb-agent-body">
          <div className="fb-agent-logs">
            {logs.map((log, i) => renderLog(log, i))}
            {isProcessing && <div className="log-line system blink">Processing...</div>}
            <div ref={endRef} />
          </div>
        </div>
        <form className="fb-agent-footer" onSubmit={handleSubmit}>
          <span className="fb-agent-prompt">$</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Give the agent a task..."
            autoFocus
            disabled={isProcessing}
          />
        </form>
      </div>
    </div>
  );
}
