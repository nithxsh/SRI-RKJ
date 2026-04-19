import React, { useState, useRef, useEffect, useCallback } from 'react';

const OFFICE_CONTACT = import.meta.env.VITE_OFFICE_PHONE || '9751442007';
const OFFICE_CONTACT_ALT = import.meta.env.VITE_OFFICE_PHONE_ALT || '9865546763';

const SYSTEM_PROMPT = `You are a helpful AI assistant for "Shri Namo Narayanaya Astrology Office" in Mailpatti, Tamil Nadu. 
You assist visitors with questions about Vedic astrology, Vaasthu Shastra, numerology, and the services offered by Shri Astrologer RKJ Thulaseraja Acharya.

PRELIMINARY ANALYSIS FEATURE:
When a user asks for a "First Look" or "Chart Analysis", you must ask for:
1. Date of Birth (DD/MM/YYYY)
2. Exact Time of Birth
3. Place of Birth
Once provided, give a professional preliminary reading based on Vedic principles. 
IMPORTANT: Always end the analysis by saying: "This is a preliminary AI look. For a deep analysis and divine remedies, please book a full consultation with RKJ Thulaseraja Acharya."

Services offered:
1. Vaasthu Planning (New House Plans/Designs)
2. Marriage Matching (Compatibility & Timing)
3. Divine Materials (Yantras, Stones, Rings)
4. Birth Time Remedies (Life Result & Education)
5. Business & Career (Job & Growth Analysis)
6. Building Corrections (Vaasthu for Old Buildings)

Office Details:
- Location: Mailpatti (Pincode: 635805), Near Gudiyattam, Vellore District, Tamil Nadu
- Contact: ${OFFICE_CONTACT} | ${OFFICE_CONTACT_ALT}
- Hours: Mon-Sat 9:30 AM – 9:40 PM, Sun: Closed

Instructions:
- Be warm and spiritual
- Encourage booking for personal readings
- Keep responses within 4-6 sentences
- Use "Namaste" to greet`;

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export default function AiChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Namaste 🙏 I am the AI assistant for Shri Namo Narayanaya Astrology Office. How can I guide you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const resetChat = () => {
    if (window.confirm('Clear conversation history?')) {
      setMessages([{ role: 'ai', text: 'Namaste 🙏 How can I guide you today?' }]);
    }
  };

  const sendMessage = useCallback(async (forceText = null, isRetry = false) => {
    const text = (forceText || input).trim();
    if (!text || loading) return;

    // Add user message to UI (skip if it's a retry as it's already in the UI)
    if (!isRetry) {
      const userMsg = { role: 'user', text };
      setMessages(prev => [...prev, userMsg]);
      setInput('');
    }
    setLoading(true);

    try {
      if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your-gemini-key-here') {
        throw new Error('NO_KEY');
      }

      // 1. Prepare history for Gemini API (Vedic History)
      let history = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role === 'ai' ? 'model' : 'user',
          parts: [{ text: m.text }]
        }));

      // History must alternate User -> Model. If first is model, we drop it.
      if (history.length > 0 && history[0].role === 'model') {
        history.shift();
      }

      // Prepend SYSTEM_PROMPT to the first user message if history is short
      // This is the most compatible way across all Gemini versions.
      const contents = [...history];
      
      if (contents.length === 0) {
        contents.push({
          role: 'user',
          parts: [{ text: `SYSTEM_INSTRUCTION: ${SYSTEM_PROMPT}\n\nUSER_FIRST_MESSAGE: ${text}` }]
        });
      } else {
        contents.push({
          role: 'user',
          parts: [{ text: text }]
        });
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            generationConfig: { maxOutputTokens: 500, temperature: 0.7 }
          })
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        console.error("Gemini API Error Detail:", data);
        // Final fallback to v1beta if v1 fails on model name
        if (response.status === 404 && !isRetry) {
           throw new Error("MODEL_NOT_FOUND");
        }
        throw new Error(data?.error?.message || 'API_RESPONSE_ERROR');
      }

      const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, I could not process that.';
      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);

    } catch (err) {
      console.error("Chat Error:", err);
      
      if (err.message === 'MODEL_NOT_FOUND' && !isRetry) {
         // Recursive attempt with v1beta as the final stand
         return sendMessage(text, true); 
      }

      let displayError = `⚠️ AI Error: ${err.message}`;
      if (err.message === 'NO_KEY') {
        displayError = '⚠️ AI Key missing. Please add VITE_GEMINI_API_KEY to your .env.local file.';
      }

      setMessages(prev => [...prev, { role: 'ai', text: displayError }]);
    } finally {
      setLoading(false);
    }
  }, [messages, input, loading]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { 
      e.preventDefault(); 
      sendMessage(); 
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(o => !o)}
        style={{
          position: 'fixed', bottom: '2rem', right: '2rem',
          width: '62px', height: '62px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #D4AF37, #20B2AA)',
          border: 'none', cursor: 'pointer', zIndex: 9999,
          boxShadow: '0 4px 20px rgba(212,175,55,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.6rem',
          transition: 'all 0.3s',
          transform: isOpen ? 'rotate(45deg)' : 'none'
        }}
      >
        {isOpen ? '✕' : '🔮'}
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed', bottom: '7rem', right: '2rem',
          width: '360px', maxHeight: '550px',
          background: 'rgba(10, 25, 47, 0.98)',
          backdropFilter: 'blur(15px)',
          border: '1px solid rgba(212,175,55,0.3)',
          borderRadius: '16px',
          display: 'flex', flexDirection: 'column',
          zIndex: 9998, overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
        }}>
          {/* Header */}
          <div style={{
            padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', gap: '0.8rem', background: 'rgba(212,175,55,0.05)'
          }}>
            <div style={{ fontSize: '1.2rem' }}>🔮</div>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#D4AF37', fontWeight: 700, margin: 0, fontSize: '0.9rem' }}>Vedic AI</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '0.7rem' }}>Online Assistant</p>
            </div>
            <button onClick={resetChat} title="Reset Chat" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '0.9rem' }}>🗑️</button>
          </div>

          {/* Quick Actions */}
          <div style={{ padding: '0.6rem 1rem', display: 'flex', gap: '0.5rem', overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <button onClick={() => sendMessage('I want a Free Divine Chart Analysis. What details do you need?')}
              style={{ ...chipStyle, background: 'rgba(212,175,55,0.1)', color: '#D4AF37', borderColor: 'rgba(212,175,55,0.3)' }}>✨ Chart Analysis</button>
            <button onClick={() => sendMessage('Where is the office located and how can I contact you?')}
              style={chipStyle}>📍 Location</button>
            <button onClick={() => sendMessage('Tell me about your services.')}
              style={chipStyle}>🛠️ Services</button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                <div style={{
                  padding: '0.7rem 1rem', borderRadius: '12px', fontSize: '0.88rem', lineHeight: '1.5',
                  background: msg.role === 'user' ? 'var(--accent-gold)' : 'rgba(255,255,255,0.07)',
                  color: msg.role === 'user' ? '#000' : '#FFF',
                  border: msg.role === 'ai' ? '1px solid rgba(255,255,255,0.1)' : 'none'
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start', padding: '0.5rem 1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                ✨ Thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '0.5rem' }}>
            <textarea
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type message..."
              style={{
                flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px', color: 'white', padding: '0.6rem 0.8rem', outline: 'none', resize: 'none', fontSize: '0.88rem'
              }}
            />
            <button onClick={() => sendMessage()} disabled={loading} 
              style={{ background: 'var(--accent-gold)', border: 'none', borderRadius: '8px', padding: '0 1rem', cursor: 'pointer', fontWeight: 600 }}>➤</button>
          </div>
        </div>
      )}
    </>
  );
}

const chipStyle = {
  padding: '0.4rem 0.8rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem',
  cursor: 'pointer', whiteSpace: 'nowrap'
};
