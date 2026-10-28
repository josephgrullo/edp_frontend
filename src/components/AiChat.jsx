import React from "react";
import { useState } from 'react';
import { ArrowUp, Bot, CircleAlert, Sparkles, UserRound } from 'lucide-react';
import { askGearTrackAI } from '../api.js';

const suggestions = [
  'Which equipment needs repair?',
  'How many projectors do we have?',
  'Summarize the inventory by category.',
];

export default function AiChat() {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function sendMessage(value = question) {
    const trimmed = value.trim();
    if (!trimmed || loading) return;
    setMessages(previous => [...previous, { role: 'user', text: trimmed }]);
    setQuestion('');
    setError('');
    setLoading(true);
    try {
      const data = await askGearTrackAI(trimmed);
      setMessages(previous => [
  ...previous,
  {
    role: 'assistant',
    text: data.reply || 'I could not generate an answer.'
  }
]);
    } catch (err) {
      const message = err.message.includes('404')
        ? 'The AI route is not available yet. Add the POST /api/ai/chat route to your Express backend, configure the server-side API key, and restart the backend.'
        : err.message;
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="assistant-layout">
      <section className="assistant-main panel">
        <div className="assistant-conversation-header"><span className="ai-avatar"><Bot size={21} /></span><div><strong>GearTrack AI</strong><span><i className="status-dot status-dot--good" /> Inventory assistant</span></div><span className="powered-label"><Sparkles size={13} /> AI ASSISTANT</span></div>
        <div className="conversation-body" aria-live="polite">
          {messages.length === 0 ? <div className="assistant-welcome"><div className="welcome-orbit"><div className="welcome-icon"><Bot size={30} /></div><Sparkles className="orbit-sparkle" size={19} /></div><h2>How can I help you today?</h2><p>Ask about quantities, equipment conditions, locations, or your campus inventory.</p><div className="prompt-list">{suggestions.map(suggestion => <button key={suggestion} className="prompt-chip" onClick={() => sendMessage(suggestion)} disabled={loading}><span>{suggestion}</span><ArrowUp size={15} /></button>)}</div></div> : <div className="message-list">{messages.map((message, index) => <div key={`${index}-${message.role}`} className={`chat-message chat-message--${message.role}`}><span className="message-avatar">{message.role === 'user' ? <UserRound size={16} /> : <Bot size={17} />}</span><div className="message-content"><span>{message.role === 'user' ? 'You' : 'GearTrack AI'}</span><p>{message.text}</p></div></div>)}{loading && <div className="chat-message chat-message--assistant"><span className="message-avatar"><Bot size={17} /></span><div className="message-content"><span>GearTrack AI</span><p className="thinking-dots"><i /><i /><i /> <em>Checking the inventory...</em></p></div></div>}</div>}
          {error && <div className="ai-error" role="alert"><CircleAlert size={18} /><div><strong>Couldn't get a response</strong><p>{error}</p></div></div>}
        </div>
        <form className="chat-composer" onSubmit={event => { event.preventDefault(); sendMessage(); }}><input value={question} onChange={event => setQuestion(event.target.value)} maxLength={500} placeholder="Ask anything about your equipment..." aria-label="Your question" disabled={loading} /><button className="send-button" type="submit" disabled={loading || !question.trim()} aria-label="Send question"><ArrowUp size={19} /></button></form>
        <p className="assistant-disclaimer">AI responses can be incorrect. Confirm important equipment details in the inventory records.</p>
      </section>
      <aside className="assistant-side">
        <section className="panel assistant-info-card"><div className="section-icon section-icon--violet"><Sparkles size={19} /></div><h3>Ask in your own words</h3><p>The assistant is designed for everyday inventory questions, using the equipment data supplied by your GearTrack backend.</p><div className="divider-line" /><div className="capability-line"><span className="capability-dot" />Equipment counts and categories</div><div className="capability-line"><span className="capability-dot" />Condition and location lookups</div><div className="capability-line"><span className="capability-dot" />Quick inventory summaries</div></section>
        <section className="panel privacy-card"><div className="section-icon section-icon--blue"><CircleAlert size={19} /></div><h3>Data & privacy</h3><p>Inventory information is sent to your configured AI backend to generate a response. Keep API credentials on the server and only share the records needed to answer each question.</p></section>
      </aside>
    </div>
  );
}
