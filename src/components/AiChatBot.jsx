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

  const sendMessage = useCallback(async (forceText = null) => {
    const text = (forceText || input).trim();
    if (!text || loading) return;

    // 1. Update UI immediately
    const userMsg = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your-gemini-key-here') {
        throw new Error('NO_KEY');
      }

      // 2. Format history strictly (User -> Model -> User...)
      // We take the existing messages and convert them to API format
      let history = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role === 'ai' ? 'model' : 'user',
          parts: [{ text: m.text }]
        }));

      // Ensure the history alternates correctly
      const contents = [];
      let lastRole = null;
      
      for (const msg of history) {
        if (msg.role !== lastRole) {
          contents.push(msg);
          lastRole = msg.role;
        }
      }

      // Final message must be the new user text
      if (lastRole === 'user') {
        // If the last thing was a user message, we append to it (though rare in this UI)
        contents[contents.length - 1].parts[0].text += `\n\n${text}`;
      } else {
        contents.push({ role: 'user', parts: [{ text }] });
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { 
              parts: [{ text: SYSTEM_PROMPT }] 
            },
            contents,
            generationConfig: { 
              maxOutputTokens: 800, 
              temperature: 0.8,
              topP: 0.95
            }
          })
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        console.error("Gemini API Error:", data);
        const errorMsg = data?.error?.message || 'CONNECTION_ERROR';
        if (errorMsg.includes('API key not valid')) throw new Error('INVALID_KEY');
        if (errorMsg.includes('quota')) throw new Error('QUOTA_EXCEEDED');
        throw new Error(errorMsg);
      }

      const aiResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!aiResponse) throw new Error('EMPTY_RESPONSE');

      setMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);

    } catch (err) {
      console.error("ChatBot Error Details:", err);
      
      let friendlyError = "I'm having trouble connecting to the stars right now. Please try again in 10 seconds.";
      
      if (err.message === 'NO_KEY' || err.message === 'INVALID_KEY') {
        friendlyError = "⚠️ Divine Connection Error: AI API Key is missing or invalid. Please check your dashboard.";
      } else if (err.message === 'QUOTA_EXCEEDED') {
        friendlyError = "⚠️ High Traffic: The AI is currently overwhelmed with seekers. Please try again in a few minutes.";
      } else if (err.message === 'EMPTY_RESPONSE') {
        friendlyError = "The cosmos was silent. Could you please rephrase your question?";
      }

      setMessages(prev => [...prev, { role: 'ai', text: friendlyError }]);
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
          position: 'fixed', bottom: '6rem', right: '1.5rem',
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
        {isOpen ? '✕' : <svg viewBox="0 0 24 24" width="32" height="32" fill="white"><path d="M12,2C6.47,2,2,6.47,2,12s4.47,10,10,10,10-4.47,10-10S17.53,2,12,2Zm0,18c-4.41,0-8-3.59-8-8s3.59-8,8-8,8,3.59,8,8-3.59,8-8,8ZM8.33,7c0,.2,.04,.39,.12,.56s.21,.33,.38,.5l.48,.46c.15,.14,.27,.29,.35,.46s.12,.36,.12,.59-.04,.42-.12,.59-.2,.32-.35,.46l-.48,.46c-.17,.16-.29,.33-.38,.5s-.12,.37-.12,.58,.04,.39,.12,.58,.2,.33,.38,.5l.48,.46c.15,.14,.27,.3,.35,.46s.12,.35,.12,.57-.04,.4-.12,.57-.2,.33-.35,.46l-.48,.46c-.17,.16-.3,.33-.38,.5s-.12,.38-.12,.59,0,.39,.12,.56.21,.32,.38,.48l.48,.46c.15,.14,.27,.29,.35,.46s.12,.36,.12,.59-.04,.42-.12,.59-.2,.32-.35,.46l-.48,.46c-.17,.16-.3,.33-.38,.5s-.12,.37-.12,.58,.04,.4,.12,.58,.2,.33,.38,.5l.48,.46c.15,.14,.27,.3,.35,.46,.08,.17,.12,.35,.12,.57,0,.21-.04,.4-.12,.57s-.2,.33-.35,.46l-.48,.46c-.17,.16-.3,.33-.38,.5s-.12,.38-.12,.59c0,.48,.18,.88,.54,1.21s.79,.49,1.31,.49,1.1-.16,1.48-.49,.56-.73,.56-1.21-.18-.88-.54-1.21l-.48-.46c-0.15-0.14-0.27-0.29-0.35-0.46s-0.12-0.36-0.12-0.59,0.04-0.42,0.12-0.59,0.2-0.32,0.35-0.46l.48-0.46c0.17-0.16,0.3-0.33,0.38-0.5s0.12-0.37,0.12-0.58c0-0.21-0.04-0.4-0.12-0.58s-0.2-0.33-0.35-0.46l-0.48-0.46c-0.15-0.14-0.27-0.3-0.35-0.46s-0.12-0.35-0.12-0.57c0-0.21,0.04-0.4,0.12-0.57s0.2-0.33,0.35-0.46l.48-0.46c0.17-0.16,0.3-0.33,0.38-0.5s0.12-0.38,0.12-0.59c0-0.48-0.18-0.88-0.54-1.21s-0.79-0.49-1.31-0.49c-0.64,0-1.1,0.16-1.4,0.49s-0.45,0.73-0.45,1.21Z" /></svg>}
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed', bottom: '11rem', right: '1.5rem',
          width: 'min(90vw, 360px)', maxHeight: '60vh',
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
            <div style={{ fontSize: '1.2rem' }}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="#D4AF37"><path d="M12,2C6.47,2,2,6.47,2,12s4.47,10,10,10,10-4.47,10-10S17.53,2,12,2Zm0,18c-4.41,0-8-3.59-8-8s3.59-8,8-8,8,3.59,8,8-3.59,8-8,8ZM8.33,7c0,.2,.04,.39,.12,.56s.21,.33,.38,.5l.48,.46c.15,.14,.27,.29,.35,.46s.12,.36,.12,.59-.04,.42-.12,.59-.2,.32-.35,.46l-.48,.46c-.17,.16-.29,.33-.38,.5s-.12,.37-.12,.58,.04,.39,.12,.58,.2,.33,.38,.5l.48,.46c.15,.14,.27,.3,.35,.46s.12,.35,.12,.57-.04,.4-.12,.57-.2,.33-.35,.46l-.48,.46c-.17,.16-.3,.33-.38,.5s-.12,.38-.12,.59,0,.39,.12,.56.21,.32,.38,.48l.48,.46c.15,.14,.27,.29,.35,.46s.12,.36,.12,.59-.04,.42-.12,.59-.2,.32-.35,.46l-.48,.46c-.17,.16-.3,.33-.38,.5s-.12,.37-.12,.58,.04,.4,.12,.58,.2,.33,.38,.5l.48,.46c.15,.14,.27,.3,.35,.46,.08,.17,.12,.35,.12,.57,0,.21-.04,.4-.12,.57s-.2,.33-.35,.46l-.48,.46c-.17,.16-.3,.33-.38,.5s-.12,.38-.12,.59c0,.48,.18,.88,.54,1.21s.79,.49,1.31,.49,1.1-.16,1.48-.49,.56-.73,.56-1.21-.18-.88-.54-1.21l-.48-.46c-0.15-0.14-0.27-0.29-0.35-0.46s-0.12-0.36-0.12-0.59,0.04-0.42,0.12-0.59,0.2-0.32,0.35-0.46l.48-0.46c0.17-0.16,0.3-0.33,0.38-0.5s0.12-0.37,0.12-0.58c0-0.21-0.04-0.4-0.12-0.58s-0.2-0.33-0.35-0.46l-0.48-0.46c-0.15-0.14-0.27-0.3-0.35-0.46s-0.12-0.35-0.12-0.57c0-0.21,0.04-0.4,0.12-0.57s0.2-0.33,0.35-0.46l.48-0.46c0.17-0.16,0.3-0.33,0.38-0.5s0.12-0.38,0.12-0.59c0-0.48-0.18-0.88-0.54-1.21s-0.79-0.49-1.31-0.49c-0.64,0-1.1,0.16-1.4,0.49s-0.45,0.73-0.45,1.21Z" /></svg>
            </div>
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
