import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import './PptModal.css';

const TEMPLATES = [
  { id: 'dark', name: 'Dark Premium', preview: 'linear-gradient(135deg, #111, #4f2cdb)', presBg: '1a1a1a', titleColor: '7b4dff', bodyColor: 'ffffff' },
  { id: 'warm', name: 'Warm Amber', preview: 'linear-gradient(135deg, #e8913a, #d4782a)', presBg: '1a1410', titleColor: 'e8913a', bodyColor: 'f5f0eb' },
  { id: 'clean', name: 'Clean White', preview: 'linear-gradient(135deg, #fff, #f4f4f4)', presBg: 'f4f4f4', titleColor: '000000', bodyColor: '444444' },
  { id: 'ocean', name: 'Ocean Blue', preview: 'linear-gradient(135deg, #0078d4, #005a9e)', presBg: '0078d4', titleColor: 'ffffff', bodyColor: 'f3f2f1' },
];

export default function PptModal({ isOpen, onClose }) {
  const { apiKey, addMessage, currentChatId } = useApp();
  const [topic, setTopic] = useState('');
  const [slideCount, setSlideCount] = useState(6);
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) { alert('Enter a topic!'); return; }
    setGenerating(true);

    const systemPrompt = `You are a professional slide planner. Generate a ${slideCount}-slide presentation about "${topic}". Return a valid JSON: { "explanation": "Comprehensive markdown explanation", "slides": [{"slideNumber":1,"title":"...","subtitle":"...","bullets":["point1","point2"]}] }. Each bullet must be at least 15 words. Wrap JSON in \`\`\`json block.`;

    try {
      const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'arcee-ai/trinity-large-preview:free',
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: `Generate ${slideCount} slides about: ${topic}. JSON only.` }]
        })
      });

      const data = await resp.json();
      const content = data.choices?.[0]?.message?.content || '';
      const jsonMatch = content.match(/```json([\s\S]*?)```/) || content.match(/\{[\s\S]*\}/);
      let jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]).trim() : content;
      if (!jsonStr.startsWith('{')) jsonStr = jsonStr.substring(jsonStr.indexOf('{'));
      if (!jsonStr.endsWith('}')) jsonStr = jsonStr.substring(0, jsonStr.lastIndexOf('}') + 1);

      const parsed = JSON.parse(jsonStr);
      const explanation = parsed.explanation || '';
      const slides = parsed.slides || [];

      // Build display content
      let display = `### 📊 Generated Presentation: ${topic}\n\n`;
      if (explanation) display += explanation + '\n\n---\n\n';
      slides.forEach((s, i) => {
        display += `**Slide ${i + 1}: ${s.title}**\n`;
        if (s.subtitle) display += `*${s.subtitle}*\n`;
        if (s.bullets) s.bullets.forEach(b => { display += `- ${b}\n`; });
        display += '\n';
      });
      display += `\n> 💡 *${slides.length} slides generated with template: ${selectedTemplate.name}*`;

      addMessage('assistant', display);
      onClose();
    } catch (e) {
      alert('Failed to generate. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="ppt-overlay" onClick={onClose}>
      <div className="ppt-modal" onClick={e => e.stopPropagation()}>
        <button className="ppt-close" onClick={onClose}><i className="fas fa-times" /></button>

        <div className="ppt-header">
          <i className="fas fa-file-powerpoint ppt-icon" />
          <h2>AI Presentation Generator</h2>
          <p>Describe your topic and let AI create professional slides</p>
        </div>

        <div className="ppt-form">
          <input
            placeholder="Presentation topic..."
            value={topic}
            onChange={e => setTopic(e.target.value)}
            autoFocus
          />

          <div className="ppt-count-row">
            <label>Slides</label>
            <div className="ppt-count-btns">
              {[4, 6, 8, 10, 12].map(n => (
                <button
                  key={n}
                  className={slideCount === n ? 'active' : ''}
                  onClick={() => setSlideCount(n)}
                >{n}</button>
              ))}
            </div>
          </div>

          <div className="ppt-templates">
            <label>Template</label>
            <div className="ppt-template-grid">
              {TEMPLATES.map(t => (
                <div
                  key={t.id}
                  className={`ppt-template-card ${selectedTemplate.id === t.id ? 'selected' : ''}`}
                  style={{ background: t.preview }}
                  onClick={() => setSelectedTemplate(t)}
                >
                  <span>{t.name}</span>
                </div>
              ))}
            </div>
          </div>

          <button className="ppt-generate-btn" onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <><i className="fas fa-spinner fa-spin" /> Generating...</>
            ) : (
              <><i className="fas fa-magic" /> Generate Presentation</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
