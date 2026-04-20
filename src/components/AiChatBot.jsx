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

      // 2. Format history strictly for Gemini API (User -> Model -> User...)
      // Gemini requires first message to be 'user' and roles to alternate perfectly.
      const apiContents = [];
      
      // We start with the historical messages (skipping the initial AI greeting if possible)
      // Because we want the API to see a USER message first.
      const relevantHistory = messages.filter(m => m.role !== 'system');
      
      // Construct a clean alternating list
      let lastApiRole = null;
      
      // Skip the very first AI greeting to ensure we start with User
      const historyToProcess = relevantHistory.length > 0 && relevantHistory[0].role === 'ai' 
        ? relevantHistory.slice(1) 
        : relevantHistory;

      for (const m of historyToProcess) {
        const currentRole = m.role === 'ai' ? 'model' : 'user';
        if (currentRole !== lastApiRole) {
          apiContents.push({
            role: currentRole,
            parts: [{ text: m.text }]
          });
          lastApiRole = currentRole;
        } else if (apiContents.length > 0) {
          // If roles match, append text to previous part to keep it valid
          apiContents[apiContents.length - 1].parts[0].text += `\n\n${m.text}`;
        }
      }

      // 3. Add the CURRENT user message
      if (lastApiRole === 'user' && apiContents.length > 0) {
        apiContents[apiContents.length - 1].parts[0].text += `\n\n${text}`;
      } else {
        apiContents.push({
          role: 'user',
          parts: [{ text }]
        });
      }

      // Final check: API requires at least one message and it MUST be 'user'
      if (apiContents.length === 0 || apiContents[0].role !== 'user') {
        // This should not happen with the logic above, but for safety:
        if (apiContents.length > 0 && apiContents[0].role === 'model') {
          apiContents.shift(); // Remove starting model message if it exists
        }
        if (apiContents.length === 0) {
          apiContents.push({ role: 'user', parts: [{ text }] });
        }
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { 
              parts: [{ text: SYSTEM_PROMPT }] 
            },
            contents: apiContents,
            generationConfig: { 
              maxOutputTokens: 1000, 
              temperature: 0.7,
              topP: 0.9
            }
          })
        }
      );

      // 4. Handle API Response
      const data = await response.json();
      
      if (!response.ok) {
        console.error("Gemini API Error Detail:", data);
        const code = response.status;
        const msg = data?.error?.message || '';

        if (code === 401 || code === 403) throw new Error('INVALID_KEY');
        if (code === 429) throw new Error('QUOTA_EXCEEDED');
        if (msg.toLowerCase().includes('api key')) throw new Error('INVALID_KEY');
        if (msg.toLowerCase().includes('quota')) throw new Error('QUOTA_EXCEEDED');
        
        throw new Error('CONNECTION_ERROR');
      }

      const aiResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!aiResponse) {
        // Check if it was blocked by safety
        if (data?.promptFeedback?.blockReason) {
          throw new Error('BLOCKED');
        }
        throw new Error('EMPTY_RESPONSE');
      }

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
            <path d="M16.92 7.15c-1.48 0-2.88.58-3.9 1.5l-.23.21-.24-.22c-1.02-.92-2.42-1.5-3.9-1.5-3.13 0-5.66 2.53-5.66 5.66s2.53 5.66 5.66 5.66c1.48 0 2.88-.58 3.9-1.5l.23-.21.24.22c1.02.92 2.42 1.5 3.9 1.5 3.13 0 5.66-2.53 5.66-5.66s-2.53-5.66-5.66-5.66zm-7.01 9.8c-1.12 0-2.12-.46-2.84-1.2-1.1-1.13-1.1-2.92 0-4.05.7-.72 1.69-1.18 2.8-1.19.12 0 .23.01.35.03l.97.16-1.28 1.15c-.44.4-.73.91-.84 1.47-.11.56-.01 1.15.26 1.64.12.22.28.42.47.59.34.34.8.54 1.28.54.12 0 .23-.01.35-.03l.97-.16-1.28-1.15c-.44-.4-.73-.91-.84-1.47-.11-.56-.01-1.15.26-1.64.12-.22.28-.42.47-.59.34-.34.8-.54 1.28-.54z" />
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
                <path d="M16.92 7.15c-1.48 0-2.88.58-3.9 1.5l-.23.21-.24-.22c-1.02-.92-2.42-1.5-3.9-1.5-3.13 0-5.66 2.53-5.66 5.66s2.53 5.66 5.66 5.66c1.48 0 2.88-.58 3.9-1.5l.23-.21.24.22c1.02.92 2.42 1.5 3.9 1.5 3.13 0 5.66-2.53 5.66-5.66s-2.53-5.66-5.66-5.66zm-7.01 9.8c-1.12 0-2.12-.46-2.84-1.2-1.1-1.13-1.1-2.92 0-4.05.7-.72 1.69-1.18 2.8-1.19.12 0 .23.01.35.03l.97.16-1.28 1.15c-.44.4-.73.91-.84 1.47-.11.56-.01 1.15.26 1.64.12.22.28.42.47.59.34.34.8.54 1.28.54.12 0 .23-.01.35-.03l.97-.16-1.28-1.15c-.44-.4-.73-.91-.84-1.47-.11-.56-.01-1.15.26-1.64.12-.22.28-.42.47-.59.34-.34.8-.54 1.28-.54z" />
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
