import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  NVIDIA_KEY_PREFIX,
  NVIDIA_MODELS,
  DEFAULT_NVIDIA_MODEL,
  resolveNvidiaKey,
  saveNvidiaLocalKey,
  nvidiaListModels,
  hasNvidiaRelay,
  getNvidiaProxyUrl,
  nvidiaChatUrl,
  nvidiaModelsUrl,
  nvidiaDiagnostics,
} from '../../utils/nvidiaNim';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user, apiKey, setApiKey, logout, setShowProfile, login, theme, setTheme } = useApp();
  const [editApiKey, setEditApiKey] = useState(apiKey);
  const [mcpConnected, setMcpConnected] = useState(false);

  // NVIDIA NIM key (stored locally, never sent to the Mean backend)
  const [nvidiaKey, setNvidiaKey] = useState(() => resolveNvidiaKey(apiKey));
  const [nvidiaTest, setNvidiaTest] = useState({ status: 'idle', msg: '' });
  const [nvidiaModelIds, setNvidiaModelIds] = useState([]);
  const [nvidiaDiag, setNvidiaDiag] = useState(null);
  const [nvidiaDiagRunning, setNvidiaDiagRunning] = useState(false);
  const [nvidiaFilter, setNvidiaFilter] = useState('');
  const [nvidiaChatModel, setNvidiaChatModel] = useState(
    () => localStorage.getItem('meanai_nvidia_model') || DEFAULT_NVIDIA_MODEL,
  );

  const saveNvidiaChatModel = (id) => {
    setNvidiaChatModel(id);
    localStorage.setItem('meanai_nvidia_model', id);
  };

  const nvidiaRelayLabel = getNvidiaProxyUrl();
  const nvidiaRelayMissing = !hasNvidiaRelay();

  const handleNvidiaDiagnostics = async () => {
    setNvidiaDiagRunning(true);
    setNvidiaDiag(null);
    try {
      saveNvidiaLocalKey(nvidiaKey);
      setNvidiaDiag(await nvidiaDiagnostics(nvidiaKey));
    } catch (e) {
      setNvidiaDiag({ ok: false, steps: [{ name: 'Diagnostics', ok: false, detail: e.message }] });
    } finally {
      setNvidiaDiagRunning(false);
    }
  };

  const handleNvidiaTest = async () => {
    if (!nvidiaKey.trim()) {
      setNvidiaTest({ status: 'error', msg: 'Paste an nvapi- key first.' });
      return;
    }
    saveNvidiaLocalKey(nvidiaKey);
    setNvidiaTest({ status: 'loading', msg: 'Contacting integrate.api.nvidia.com…' });
    try {
      const models = await nvidiaListModels(nvidiaKey);
      setNvidiaModelIds(models);
      setNvidiaTest({ status: 'ok', msg: `Key works — ${models.length} NIM models available.` });
    } catch (e) {
      setNvidiaModelIds([]);
      setNvidiaTest({ status: 'error', msg: e.message || 'Could not verify the key.' });
    }
  };

  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const mcpPath = isLocal 
    ? 'c:/Users/Naveen Kumar/PycharmProjects/shark/mean-ai/mean-classroom-mcp/index.js'
    : '[YOUR_PROJECT_PATH]/mean-classroom-mcp/index.js';
  
  const [meanAiKeys, setMeanAiKeys] = useState(() => {
    const saved = localStorage.getItem('meanai_cli_keys');
    return saved ? JSON.parse(saved) : [];
  });

  const generateMeanAiKey = () => {
    const keyName = prompt("Enter a name for this API Key (e.g. My Macbook):");
    if (!keyName) return;

    const newKeyObj = {
      id: Date.now().toString(),
      name: keyName.trim(),
      key: 'sk-meanai-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      createdAt: new Date().toLocaleDateString()
    };
    
    const updated = [newKeyObj, ...meanAiKeys];
    setMeanAiKeys(updated);
    localStorage.setItem('meanai_cli_keys', JSON.stringify(updated));
  };

  const deleteMeanAiKey = (id) => {
    if (window.confirm("Are you sure you want to delete this key? Any CLI using it will be disconnected.")) {
      const updated = meanAiKeys.filter(k => k.id !== id);
      setMeanAiKeys(updated);
      localStorage.setItem('meanai_cli_keys', JSON.stringify(updated));
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('API Key copied to clipboard!');
  };

  const handleSave = () => {
    saveNvidiaLocalKey(nvidiaKey);
    if (editApiKey.trim() && editApiKey !== apiKey) {
      const updated = { ...user, apiKey: editApiKey.trim() };
      login(updated);
    }
    setShowProfile(false);
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <header className="profile-header">
          <button className="profile-back-btn" onClick={() => setShowProfile(false)}>
            <i className="fas fa-chevron-left" />
            <span>Settings</span>
          </button>
        </header>

        <div className="profile-main">
          {/* Avatar / Account Section */}
          <div className="ios-section">
            <h4 className="ios-section-title">ACCOUNT</h4>
            <div className="ios-group">
              <div className="ios-row profile-row">
                <div className="profile-card-avatar">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="profile-card-info">
                  <h3>{user?.name || 'User'}</h3>
                  <p>ID: {user?.id || '—'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Appearance Section */}
          <div className="ios-section">
            <h4 className="ios-section-title">APPEARANCE</h4>
            <div className="ios-group">
              <div className="ios-row theme-row">
                <button
                  className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => setTheme('light')}
                >
                  <i className="fas fa-sun" />
                  <span>Light</span>
                </button>
                <button
                  className={`theme-btn ${theme === 'system' ? 'active' : ''}`}
                  onClick={() => setTheme('system')}
                >
                  <i className="fas fa-desktop" />
                  <span>System</span>
                </button>
                <button
                  className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => setTheme('dark')}
                >
                  <i className="fas fa-moon" />
                  <span>Dark</span>
                </button>
              </div>
            </div>
          </div>

          {/* Configuration Section */}
          <div className="ios-section">
            <h4 className="ios-section-title">API CONFIGURATION</h4>
            <div className="ios-group">
              <div className="ios-row field-row">
                <label>API Key</label>
                <input
                  type="password"
                  value={editApiKey}
                  onChange={e => setEditApiKey(e.target.value)}
                  placeholder="sk-... (OpenAI) or sk-or-... (OpenRouter) or AIzaSy..."
                  className="ios-input"
                />
              </div>
            </div>
            <p className="ios-section-footer">Your OpenAI (ChatGPT), OpenRouter, or Google Gemini API key used for text generation.</p>
          </div>

          {/* NVIDIA NIM Section */}
          <div className="ios-section">
            <h4 className="ios-section-title">NVIDIA NIM</h4>
            <div className="ios-group">
              <div className="ios-row field-row">
                <label>NIM API Key</label>
                <input
                  type="password"
                  value={nvidiaKey}
                  onChange={e => {
                    setNvidiaKey(e.target.value);
                    setNvidiaTest({ status: 'idle', msg: '' });
                  }}
                  onBlur={() => saveNvidiaLocalKey(nvidiaKey)}
                  placeholder={`${NVIDIA_KEY_PREFIX}...`}
                  className="ios-input"
                />
              </div>
              <div className="ios-row" style={{ gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleNvidiaTest}
                  disabled={nvidiaTest.status === 'loading'}
                  style={{
                    background: '#76b900', color: '#0b0f08', border: 'none',
                    padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
                    fontWeight: 700, fontSize: '0.85rem', opacity: nvidiaTest.status === 'loading' ? 0.6 : 1,
                  }}
                >
                  {nvidiaTest.status === 'loading' ? 'Testing…' : 'Save & Test Key'}
                </button>
                <a
                  href="https://build.nvidia.com/models"
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: '0.85rem', color: '#76b900', fontWeight: 600, alignSelf: 'center' }}
                >
                  Get a free nvapi- key ↗
                </a>
              </div>
              <div className="ios-row" style={{ gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleNvidiaDiagnostics}
                  disabled={nvidiaDiagRunning}
                  style={{
                    background: 'var(--hover-bg)', color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)', padding: '8px 16px',
                    borderRadius: '8px', cursor: 'pointer', fontWeight: 600,
                    fontSize: '0.85rem', opacity: nvidiaDiagRunning ? 0.6 : 1,
                  }}
                >
                  {nvidiaDiagRunning ? 'Running…' : 'Run diagnostics'}
                </button>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', alignSelf: 'center' }}>
                  relay → key → test completion
                </span>
              </div>

              {nvidiaDiag && (
                <div className="ios-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '6px', paddingTop: 4 }}>
                  {nvidiaDiag.steps.map((st, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '0.8rem', lineHeight: 1.4 }}>
                      <span style={{ color: st.ok ? '#1f9d55' : '#c0392b', fontWeight: 700 }}>{st.ok ? '✓' : '✗'}</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600, minWidth: '128px' }}>{st.name}</span>
                      <span style={{ color: 'var(--text-secondary)', flex: 1, wordBreak: 'break-word' }}>{st.detail}</span>
                    </div>
                  ))}
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Endpoints: <code>{nvidiaModelsUrl()}</code> · <code>{nvidiaChatUrl()}</code>
                  </div>
                </div>
              )}
              {nvidiaTest.msg && (
                <div className="ios-row" style={{ paddingTop: 0 }}>
                  <p
                    style={{
                      margin: 0, fontSize: '0.82rem', lineHeight: 1.4,
                      color: nvidiaTest.status === 'ok' ? '#1f9d55' : nvidiaTest.status === 'error' ? '#c0392b' : 'var(--text-secondary)',
                    }}
                  >
                    {nvidiaTest.msg}
                  </p>
                </div>
              )}
            </div>
            {/* Model picker backed by the live /v1/models list */}
            <div className="ios-group" style={{ marginTop: '10px' }}>
              <div className="ios-row field-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Model for the chat model picker</label>
                {nvidiaModelIds.length > 0 ? (
                  <>
                    <input
                      type="text"
                      value={nvidiaFilter}
                      onChange={e => setNvidiaFilter(e.target.value)}
                      placeholder={`Filter ${nvidiaModelIds.length} models…`}
                      className="ios-input"
                    />
                    <select
                      value={nvidiaModelIds.includes(nvidiaChatModel) ? nvidiaChatModel : ''}
                      onChange={e => e.target.value && saveNvidiaChatModel(e.target.value)}
                      className="ios-input"
                      style={{ maxHeight: '220px' }}
                    >
                      <option value="">— choose one of {nvidiaModelIds.length} —</option>
                      {nvidiaModelIds
                        .filter(id => id.toLowerCase().includes(nvidiaFilter.toLowerCase()))
                        .map(id => <option key={id} value={id}>{id}</option>)}
                    </select>
                  </>
                ) : (
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Press <strong>Save &amp; Test Key</strong> to load the live NIM model list, then pick the exact id here.
                  </p>
                )}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {NVIDIA_MODELS.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => saveNvidiaChatModel(m.id)}
                      title={m.id}
                      style={{
                        background: nvidiaChatModel === m.id ? '#76b900' : 'var(--hover-bg)',
                        color: nvidiaChatModel === m.id ? '#0b0f08' : 'var(--text-secondary)',
                        border: '1px solid var(--border-color)', borderRadius: '999px',
                        padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      {m.name}
                      {m.capabilities?.image ? ' · 🖼' : ''}
                    </button>
                  ))}
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Active: <code>{nvidiaChatModel}</code>
                </p>
              </div>
            </div>

            {nvidiaRelayMissing && (
              <div className="ios-group" style={{ marginTop: '10px' }}>
                <div className="ios-row" style={{ paddingTop: 6 }}>
                  <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.45, color: '#c0392b' }}>
                    <strong>Relay not configured.</strong> This deployed build has no NVIDIA proxy, so requests will 404.
                    Set <code>VITE_NVIDIA_PROXY_URL</code> to your deployed relay (see <code>api/nvidia.js</code>) and redeploy.
                  </p>
                </div>
              </div>
            )}

            <p className="ios-section-footer">
              NVIDIA NIM (build.nvidia.com) streams through an OpenAI-compatible endpoint. NIM blocks direct browser
              calls (no CORS headers), so traffic is relayed via <code>{nvidiaRelayLabel}</code>. Pick a NIM model from the
              chat model picker or from the list above.
            </p>
          </div>

          {/* MeanAI CLI API Keys Section */}
          <div className="ios-section">
            <h4 className="ios-section-title">MEANAI CODER CLI KEYS</h4>
            <div className="ios-group">
              <div className="ios-row" style={{ flexDirection: 'column', alignItems: 'stretch', padding: '16px' }}>
                {meanAiKeys.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '12px', textAlign: 'center' }}>
                    No keys generated yet.
                  </p>
                )}
                {meanAiKeys.map(kObj => (
                  <div key={kObj.id} className="api-key-display">
                    <div className="api-key-info">
                      <span className="api-key-name">{kObj.name}</span>
                      <span className="api-key-date">Created: {kObj.createdAt}</span>
                    </div>
                    <span className="api-key-text">{typeof kObj === 'string' ? kObj : kObj.key}</span>
                    <div className="api-key-actions">
                      <button className="copy-btn" onClick={() => copyToClipboard(typeof kObj === 'string' ? kObj : kObj.key)} title="Copy API Key">
                        <i className="fas fa-copy" />
                      </button>
                      <button className="delete-btn" onClick={() => deleteMeanAiKey(kObj.id)} title="Delete API Key">
                        <i className="fas fa-trash" />
                      </button>
                    </div>
                  </div>
                ))}
                <button className="generate-key-btn" onClick={generateMeanAiKey}>
                  <i className="fas fa-plus" style={{ marginRight: '8px' }} />
                  Generate New CLI Key
                </button>
              </div>
            </div>
            <p className="ios-section-footer">Use these keys to authenticate your local MeanAI Coder terminal application.</p>
          </div>

          {/* MCP Server Gateway Section */}
          <div className="ios-section">
            <h4 className="ios-section-title">MCP SERVER GATEWAY (API LINK)</h4>
            <div className="ios-group">
              <div className="ios-row" style={{ flexDirection: 'column', alignItems: 'stretch', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`status-dot ${mcpConnected ? 'active' : ''}`} style={{
                      width: '10px', height: '10px', borderRadius: '50%',
                      background: mcpConnected ? '#10b981' : '#888',
                      boxShadow: mcpConnected ? '0 0 8px #10b981' : 'none',
                      display: 'inline-block'
                    }} />
                    <span style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      {mcpConnected ? 'Gateway Connected' : 'Gateway Offline'}
                    </span>
                  </div>
                  <button 
                    className={`mcp-connect-btn ${mcpConnected ? 'connected' : ''}`}
                    onClick={() => setMcpConnected(!mcpConnected)}
                    style={{
                      background: mcpConnected ? '#C0392B' : 'linear-gradient(135deg, #10b981, #059669)',
                      color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px',
                      cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', transition: 'all 0.2s'
                    }}
                  >
                    {mcpConnected ? 'Disconnect' : 'Connect'}
                  </button>
                </div>

                {mcpConnected && (
                  <div className="mcp-details-card" style={{
                    background: 'var(--paper2, #EDE8DC)', border: '1px solid var(--rule, #C8BFB0)',
                    borderRadius: '8px', padding: '12px', marginTop: '4px'
                  }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px', lineHeight: '1.4' }}>
                      🟢 **Mean AI Classroom API Active**. Paste this configuration in your Claude/ChatGPT desktop settings:
                    </p>

                    {!isLocal && (
                      <div style={{
                        background: 'rgba(0,0,0,0.04)', border: '1px dashed var(--rule, #C8BFB0)', borderRadius: '6px',
                        padding: '10px', marginBottom: '12px', fontSize: '0.8rem',
                        lineHeight: '1.4', color: 'var(--text-secondary)'
                      }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                          🛠️ Setup MCP Server Locally:
                        </span>
                        1. Clone the project repository:
                        <pre style={{ background: 'var(--ink, #1A1612)', color: '#f59e0b', padding: '6px', borderRadius: '4px', margin: '4px 0', overflowX: 'auto', fontFamily: 'monospace' }}>
                          git clone https://github.com/eddalanaveenkumar-ui/mean.git
                        </pre>
                        2. Install dependencies:
                        <pre style={{ background: 'var(--ink, #1A1612)', color: '#f59e0b', padding: '6px', borderRadius: '4px', margin: '4px 0', overflowX: 'auto', fontFamily: 'monospace' }}>
                          cd mean/mean-classroom-mcp && npm install
                        </pre>
                        3. Use the config below, replacing <code style={{color: '#8b5cf6', fontWeight: 'bold'}}>[YOUR_PROJECT_PATH]</code> with the folder path where you cloned the repository.
                      </div>
                    )}
                    
                    <div style={{ position: 'relative', marginBottom: '12px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        CLAUDE/CHATGPT CONFIG JSON:
                      </span>
                      <pre style={{
                        background: 'var(--ink, #1A1612)', color: '#a78bfa', padding: '10px',
                        borderRadius: '6px', fontSize: '0.8rem', overflowX: 'auto', fontFamily: 'var(--font-mono, monospace)',
                        maxHeight: '120px'
                      }}>
{`{
  "mcpServers": {
    "mean-classroom": {
      "command": "node",
      "args": ["${mcpPath}"]
    }
  }
}`}
                      </pre>
                      <button 
                        onClick={() => copyToClipboard(JSON.stringify({
                          mcpServers: {
                            "mean-classroom": {
                              command: "node",
                              args: [mcpPath]
                            }
                          }
                        }, null, 2))}
                        style={{
                          position: 'absolute', right: '6px', top: '24px', background: 'rgba(255,255,255,0.1)',
                          border: 'none', color: '#fff', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem'
                        }}
                      >
                        Copy
                      </button>
                    </div>

                    <div style={{ position: 'relative' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        LOCAL LAUNCH COMMAND:
                      </span>
                      <pre style={{
                        background: 'var(--ink, #1A1612)', color: '#34d399', padding: '10px',
                        borderRadius: '6px', fontSize: '0.8rem', overflowX: 'auto', fontFamily: 'var(--font-mono, monospace)'
                      }}>
{`node "${mcpPath}"`}
                      </pre>
                      <button 
                        onClick={() => copyToClipboard(`node "${mcpPath}"`)}
                        style={{
                          position: 'absolute', right: '6px', top: '24px', background: 'rgba(255,255,255,0.1)',
                          border: 'none', color: '#fff', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem'
                        }}
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <p className="ios-section-footer">This connects ChatGPT or Claude directly to the whiteboard UI to build live classroom lessons.</p>
          </div>

          {/* Actions */}
          <div className="ios-section actions-section">
            <button className="save-btn" onClick={handleSave}>
              Save Changes
            </button>
            <button className="logout-btn" onClick={logout}>
              Log out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
