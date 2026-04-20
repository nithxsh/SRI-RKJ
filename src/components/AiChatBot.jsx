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
      // The Gemini API requires history to start with a 'user' message.
      // Since our first message is an AI greeting, we skip it for the API payload.
      let history = messages
        .filter(m => m.role !== 'system')
        .slice(1) // Skip the initial AI greeting
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

      // 3. Handle API Errors specifically
      const data = await response.json();
      
      if (!response.ok) {
        console.error("Gemini API Error Detail:", data);
        const code = response.status;
        const msg = data?.error?.message || '';

        if (code === 401 || code === 403) throw new Error('INVALID_KEY');
        if (code === 429) throw new Error('QUOTA_EXCEEDED');
        if (msg.includes('API key not valid')) throw new Error('INVALID_KEY');
        if (msg.includes('quota')) throw new Error('QUOTA_EXCEEDED');
        
        throw new Error('CONNECTION_ERROR');
      }

      const aiResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!aiResponse) throw new Error('EMPTY_RESPONSE');

      setMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);

    } catch (err) {
      console.error("ChatBot Error Details:", err);
      
      let friendlyError = "I'm having trouble connecting to the stars right now. Please check your internet or try again in a moment.";
      
      if (err.message === 'NO_KEY' || err.message === 'INVALID_KEY') {
        friendlyError = "⚠️ Divine Connection Error: The AI API Key (VITE_GEMINI_API_KEY) is missing or invalid. Please ensure it is set in your environment variables.";
      } else if (err.message === 'QUOTA_EXCEEDED') {
        friendlyError = "⚠️ High Traffic: The AI is currently overwhelmed with seekers. Please try again in 5-10 minutes.";
      } else if (err.message === 'EMPTY_RESPONSE') {
        friendlyError = "The cosmos was silent. Could you please rephrase your question?";
      } else if (err.message === 'CONNECTION_ERROR') {
        friendlyError = "The connection to the divine server was interrupted. Please check your network and try again.";
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
          width: '68px', height: '68px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #D4AF37, #B38728)',
          border: '2px solid rgba(255,255,255,0.2)', cursor: 'pointer', zIndex: 9999,
          boxShadow: '0 8px 32px rgba(212,175,55,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          transform: isOpen ? 'rotate(45deg) scale(0.9)' : 'scale(1)',
          color: '#000'
        }}
      >
        {isOpen ? '✕' : (
          <svg viewBox="0 0 24 24" width="38" height="38" fill="currentColor">
            <path d="M12.2,3c-0.9,0-1.8,0.1-2.6,0.4C8.7,3.6,8,4.1,7.5,4.7S6.6,6,6.4,6.8S6.2,8.4,6.2,9.3c0,1.8,0.6,3.4,1.8,4.7c1.3,1.3,2.9,2,4.8,2c1.8,0,3.4-0.7,4.7-2c1.3-1.3,2-2.9,2-4.7c0-0.9-0.2-1.8-0.5-2.6c-0.3-0.8-0.8-1.5-1.5-2.1c-0.6-0.6-1.4-1-2.2-1.3C14.1,3.1,13.2,3,12.2,3z M12.2,14.3c-1.3,0-2.5-0.5-3.5-1.5c-1-1-1.5-2.1-1.5-3.5c0-1.3,0.5-2.5,1.5-3.5c1-1,2.1-1.5,3.5-1.5s2.5,0.5,3.5,1.5c1,1,1.5,2.1,1.5,3.5c0,1.3-0.5,2.5-1.5,3.5C14.7,13.8,13.6,14.3,12.2,14.3z M21.8,13.5c-0.4-0.8-1-1.3-1.8-1.6l-0.3,1.4c0.5,0.2,0.9,0.5,1.2,1c0.3,0.4,0.5,1,0.5,1.6s-0.2,1.2-0.5,1.6c-0.3,0.5-0.8,0.8-1.4,1c-0.6,0.2-1.2,0.3-1.9,0.3c-0.7,0-1.3-0.1-1.9-0.3c-0.6-0.2-1.1-0.5-1.4-1c-0.3-0.5-0.5-1-0.5-1.6c0-0.6,0.2-1.1,0.5-1.6c0.3-0.4,0.7-0.7,1.2-1l-0.3-1.4c-0.8,0.3-1.4,0.8-1.8,1.6c-0.4,0.8-0.6,1.6-0.6,2.5c0,0.9,0.2,1.8,0.6,2.5s1,1.2,1.7,1.6s1.6,0.6,2.6,0.6s1.9-0.2,2.6-0.6s1.3-1,1.7-1.6C22,18.4,22.2,17.5,22.2,16.5C22.2,15.2,22.1,14.3,21.8,13.5z M8.2,13.5c-0.3,0.8-1,1.3-1.8,1.6l-0.3-1.4c0.5-0.2,0.9-0.5,1.2-1c0.3-0.4,0.5-1,0.5-1.6s-0.2-1.2-0.5-1.6C7,9,6.5,8.7,5.9,8.5c-0.6-0.2-1.2-0.3-1.9-0.3c-0.7,0-1.3,0.1-1.9,0.3c-0.6,0.2-1.1,0.5-1.4,1c-0.3,0.5-0.5,1-0.5,1.6c0,0.6,0.2,1.1,0.5,1.6c0.3,0.4,0.7,0.7,1.2,1l-0.3,1.4C0.8,14.8,0.2,14.3,0.2,13.5C0.2,12.6,0,11.8,0,10.5c0-1.8,0.6-3.4,1.8-4.7c1.2-1.3,2.8-2,4.6-2s3.4,0.7,4.6,2c1.2,1.3,1.8,2.9,1.8,4.7c0,1-0.2,1.8-0.6,2.5L8.2,13.5z" />
          </svg>
        )}
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
            padding: '1.2rem', 
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.8rem', 
            background: 'linear-gradient(to bottom, rgba(212,175,55,0.08), transparent)'
          }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '8px', 
              background: 'rgba(212,175,55,0.15)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--accent-gold)'
            }}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M12.2,3c-0.9,0-1.8,0.1-2.6,0.4C8.7,3.6,8,4.1,7.5,4.7S6.6,6,6.4,6.8S6.2,8.4,6.2,9.3c0,1.8,0.6,3.4,1.8,4.7c1.3,1.3,2.9,2,4.8,2c1.8,0,3.4-0.7,4.7-2c1.3-1.3,2-2.9,2-4.7c0-0.9-0.2-1.8-0.5-2.6c-0.3-0.8-0.8-1.5-1.5-2.1c-0.6-0.6-1.4-1-2.2-1.3C14.1,3.1,13.2,3,12.2,3z M12.2,14.3c-1.3,0-2.5-0.5-3.5-1.5c-1-1-1.5-2.1-1.5-3.5c0-1.3,0.5-2.5,1.5-3.5c1-1,2.1-1.5,3.5-1.5s2.5,0.5,3.5,1.5c1,1,1.5,2.1,1.5,3.5c0,1.3-0.5,2.5-1.5,3.5C14.7,13.8,13.6,14.3,12.2,14.3z M21.8,13.5c-0.4-0.8-1-1.3-1.8-1.6l-0.3,1.4c0.5,0.2,0.9,0.5,1.2,1c0.3,0.4,0.5,1,0.5,1.6s-0.2,1.2-0.5,1.6c-0.3,0.5-0.8,0.8-1.4,1c-0.6,0.2-1.2,0.3-1.9,0.3c-0.7,0-1.3-0.1-1.9-0.3c-0.6-0.2-1.1-0.5-1.4-1c-0.3-0.5-0.5-1-0.5-1.6c0-0.6,0.2-1.1,0.5-1.6c0.3-0.4,0.7-0.7,1.2-1l-0.3-1.4c-0.8,0.3-1.4,0.8-1.8,1.6c-0.4,0.8-0.6,1.6-0.6,2.5c0,0.9,0.2,1.8,0.6,2.5s1,1.2,1.7,1.6s1.6,0.6,2.6,0.6s1.9-0.2,2.6-0.6s1.3-1,1.7-1.6C22,18.4,22.2,17.5,22.2,16.5C22.2,15.2,22.1,14.3,21.8,13.5z M8.2,13.5c-0.3,0.8-1,1.3-1.8,1.6l-0.3-1.4c0.5-0.2,0.9-0.5,1.2-1c0.3-0.4,0.5-1,0.5-1.6s-0.2-1.2-0.5-1.6C7,9,6.5,8.7,5.9,8.5c-0.6-0.2-1.2-0.3-1.9-0.3c-0.7,0-1.3,0.1-1.9,0.3c-0.6,0.2-1.1,0.5-1.4,1c-0.3,0.5-0.5,1-0.5,1.6c0,0.6,0.2,1.1,0.5,1.6c0.3,0.4,0.7,0.7,1.2,1l-0.3,1.4C0.8,14.8,0.2,14.3,0.2,13.5C0.2,12.6,0,11.8,0,10.5c0-1.8,0.6-3.4,1.8-4.7c1.2-1.3,2.8-2,4.6-2s3.4,0.7,4.6,2c1.2,1.3,1.8,2.9,1.8,4.7c0,1-0.2,1.8-0.6,2.5L8.2,13.5z" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: 'var(--accent-gold)', fontWeight: 800, margin: 0, fontSize: '1rem', letterSpacing: '0.5px' }}>Divine Vedic AI</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '0.75rem', fontWeight: 500 }}>Shri Namo Narayanaya Office</p>
            </div>
            <button onClick={resetChat} title="Reset Chat" style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '0.9rem', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🗑️</button>
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
