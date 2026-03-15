import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Navigation, Anchor, AlertTriangle, Info, MapPin, X } from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:5000';

export default function ReliefBot({ isWidget = false, onClose }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: "Hello! I'm your Relief Assistant. How can I help you today?",
      timestamp: new Date()
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => console.log('Location error:', error)
      );
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const processMessage = (msg) => {
    const text = msg.toLowerCase();

    if (text.includes('shelter') || text.includes('evacuate')) {
      return {
        text: "🏠 **SHELTER INFORMATION**\n\nNearest shelters:\n• Community Center - 2.3 km\n• School Hall - 3.1 km\n\nBoth have food, water, and medical facilities available 24/7.",
        quickReplies: ['Get directions', 'Check capacity', 'What to bring']
      };
    }

    if (text.includes('food') || text.includes('water') || text.includes('hungry')) {
      return {
        text: "🍽️ **FOOD & WATER DISTRIBUTION**\n\nActive centers:\n• Main Relief Center - 1.5 km (24/7)\n• Community Kitchen - 2.8 km (7AM-9PM)\n\nFree meals and water available.",
        quickReplies: ['Get directions', 'Distribution times', 'Special needs']
      };
    }

    if (text.includes('medical') || text.includes('hospital') || text.includes('doctor') || text.includes('injured')) {
      return {
        text: "⚕️ **MEDICAL ASSISTANCE**\n\nNearest facilities:\n• Emergency Field Hospital - 1.8 km\n• Mobile Medical Unit - City Square\n\nBoth operational 24/7 with emergency care and medication.",
        quickReplies: ['Call ambulance', 'Nearest hospital', 'First aid tips']
      };
    }

    if (text.includes('emergency') || text.includes('help') || text.includes('urgent')) {
      return {
        text: "🚨 **EMERGENCY ASSISTANCE**\n\nImmediate actions:\n1. Call 911 for life-threatening emergencies\n2. Local Rescue: (555) 123-4567\n3. Stay calm and in a safe location",
        quickReplies: ['Find shelter', 'Medical help', 'Report location']
      };
    }

    if (text.includes('missing') || text.includes('family') || text.includes('lost')) {
      return {
        text: "👨‍👩‍👧‍👦 **MISSING PERSONS**\n\nI can help you:\n• Register a missing person\n• Search the registry\n• Connect with Red Cross Family Links",
        quickReplies: ['Register person', 'Search registry', 'Contact Red Cross']
      };
    }

    return {
      text: "I can help you with:\n\n🚨 Emergency services\n🏠 Shelter locations\n🍽️ Food & water\n⚕️ Medical assistance\n👨‍👩‍👧‍👦 Missing persons\n\nWhat do you need help with?",
      quickReplies: ['Emergency help', 'Find shelter', 'Get food', 'Medical help']
    };
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: inputText,
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    const currentInput = inputText;
    setInputText('');
    setIsTyping(true);

    try {
      console.log('📤 Sending message to backend:', currentInput);
      console.log('🌐 API URL:', `${API_BASE_URL}/api/chatbot/groq-chat`);

      const response = await fetch(`${API_BASE_URL}/api/chatbot/groq-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentInput,
          history: updatedMessages,
          location: userLocation
        }),
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response ok:', response.ok);

      const data = await response.json();
      console.log('📥 Response data:', data);

      if (response.ok && data.success) {
        console.log('✅ Groq AI response received successfully');
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          text: data.response || data.message || 'No response received',
          timestamp: new Date(),
          quickReplies: data.quick_replies || []
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        console.warn('⚠️ API returned error or not successful:', data);
        console.log('⚠️ Falling back to offline mode...');
        
        const fallbackResponse = processMessage(currentInput);
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          text: fallbackResponse.text + '\n\n⚠️ (Offline Mode - Backend unavailable)',
          timestamp: new Date(),
          quickReplies: fallbackResponse.quickReplies || []
        };
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (err) {
      console.error('❌ Network Error:', err);
      console.error('❌ Error details:', err.message);
      console.error('❌ Make sure backend is running on', API_BASE_URL);

      const fallbackResponse = processMessage(currentInput);
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: fallbackResponse.text + '\n\n⚠️ (Offline Mode - Cannot connect to backend)',
        timestamp: new Date(),
        quickReplies: fallbackResponse.quickReplies || []
      };
      setMessages(prev => [...prev, botMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickReply = (reply) => {
    setInputText(reply);
    setTimeout(() => {
      document.getElementById('send-btn').click();
    }, 100);
  };

  // Convert markdown-like syntax to simple HTML for basic bolding and lists
  const formatText = (text) => {
    const boldFormatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return boldFormatted;
  };

  const dynamicStyles = {
    container: styles.container(isWidget),
    chatWrapper: styles.chatWrapper(isWidget),
    header: styles.header(isWidget)
  };

  return (
    <div style={dynamicStyles.container}>
      <div style={dynamicStyles.chatWrapper}>
        
        {/* Header */}
        <div style={dynamicStyles.header}>
          <div style={styles.headerTitle}>
            <div style={styles.botIconWrapper}>
              <Bot size={24} color="#3b82f6" />
            </div>
            <div>
              <h2 style={{margin:0, fontSize: isWidget ? '1.1rem' : '1.25rem', color:'white'}}>Relief Assistant</h2>
              <div style={{display:'flex', alignItems:'center', gap:'6px', color:'#10b981', fontSize:'0.75rem', marginTop:'4px'}}>
                <div style={{width:'8px', height:'8px', borderRadius:'50%', background:'#10b981', animation:'pulse 2s infinite'}} />
                AI Online
              </div>
            </div>
          </div>
          
          <div style={styles.headerStatus}>
            {isWidget && onClose ? (
              <button 
                onClick={onClose} 
                style={{background:'transparent', border:'none', color:'#94a3b8', cursor:'pointer', padding:'4px', display:'flex', alignItems:'center', justifyContent:'center'}}
                className="close-hover"
              >
                <X size={20} />
              </button>
            ) : userLocation ? (
              <span style={{display:'flex', alignItems:'center', gap:'4px', color:'#3b82f6', background:'rgba(59, 130, 246, 0.1)', padding:'6px 12px', borderRadius:'12px'}}>
                <MapPin size={14} /> GPS Active
              </span>
            ) : (
              <span style={{display:'flex', alignItems:'center', gap:'4px', color:'#f59e0b', background:'rgba(245, 158, 11, 0.1)', padding:'6px 12px', borderRadius:'12px'}}>
                <AlertTriangle size={14} /> Location Off
              </span>
            )}
          </div>
        </div>

        {/* Messages */}
        <div style={styles.messagesContainer}>
          {messages.map((msg) => (
            <div key={msg.id} style={{...styles.messageRow, justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start'}}>
              
              {msg.type === 'bot' && (
                <div style={styles.avatarBot}>
                  <Bot size={16} color="white" />
                </div>
              )}

              <div style={{display:'flex', flexDirection:'column', alignItems: msg.type === 'user' ? 'flex-end' : 'flex-start', maxWidth:'75%'}}>
                <div style={{
                  ...styles.messageBubble,
                  background: msg.type === 'user' ? '#3b82f6' : '#1e293b',
                  border: msg.type === 'user' ? '1px solid #2563eb' : '1px solid #334155',
                  color: 'white',
                  borderBottomRightRadius: msg.type === 'user' ? '4px' : '16px',
                  borderBottomLeftRadius: msg.type === 'bot' ? '4px' : '16px',
                }}>
                  <span dangerouslySetInnerHTML={{ __html: formatText(msg.text) }} />
                </div>
                
                <span style={styles.timestamp}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>

                {/* Quick Replies below bot message context */}
                {msg.quickReplies && msg.quickReplies.length > 0 && (
                  <div style={styles.quickRepliesContainer}>
                    {msg.quickReplies.map((reply, idx) => (
                      <button
                        key={idx}
                        style={styles.quickReplyBtn}
                        onClick={() => handleQuickReply(reply)}
                        className="hover-reply"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div style={{...styles.messageRow, justifyContent: 'flex-start'}}>
              <div style={styles.avatarBot}><Bot size={16} color="white" /></div>
              <div style={{...styles.messageBubble, background: '#1e293b', border: '1px solid #334155', borderBottomLeftRadius: '4px'}}>
                <div style={styles.typingDots}>
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={styles.inputArea}>
          <div style={styles.inputBox}>
            <input
              style={styles.input}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Describe your situation or ask a question..."
            />
            <button 
              id="send-btn"
              style={styles.sendBtn(inputText.trim().length > 0)} 
              onClick={handleSendMessage}
              disabled={!inputText.trim()}
              className="send-btn-hover"
            >
              <Send size={18} />
            </button>
          </div>
          <p style={{textAlign:'center', fontSize:'0.7rem', color:'#64748b', margin:'12px 0 0 0'}}>
            Emergency AI Assistant can make mistakes. For life-threatening situations, call 911 directly.
          </p>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.2); } 100% { opacity: 1; transform: scale(1); } }
        
        .dot { width: 6px; height: 6px; background-color: #94a3b8; border-radius: 50%; animation: bounce 1.4s infinite ease-in-out both; }
        .dot:nth-child(1) { animation-delay: -0.32s; }
        .dot:nth-child(2) { animation-delay: -0.16s; }
        @keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }

        .hover-reply:hover { background: rgba(59, 130, 246, 0.4) !important; color: white !important; border-color: #3b82f6 !important; transform: translateY(-2px); }
        .send-btn-hover:not(:disabled):hover { background: #2563eb !important; transform: scale(1.05); }
        .close-hover:hover { color: white !important; transform: scale(1.1); }

        /* Custom Scrollbar for chat */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}} />
    </div>
  );
}

const styles = {
  container: (isWidget) => ({
    height: isWidget ? '600px' : 'calc(100vh - 70px)',
    maxHeight: isWidget ? '80vh' : 'auto',
    width: isWidget ? '400px' : '100%',
    background: isWidget ? 'transparent' : '#09090b',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: isWidget ? '0' : '24px',
    fontFamily: "'Inter', sans-serif"
  }),
  chatWrapper: (isWidget) => ({
    width: '100%',
    maxWidth: isWidget ? '100%' : '850px',
    height: '100%',
    background: '#13192b',
    borderRadius: isWidget ? '20px' : '20px',
    border: '1px solid #1e293b',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: isWidget ? '0 10px 40px rgba(0,0,0,0.6)' : '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
  }),
  header: (isWidget) => ({
    padding: isWidget ? '16px' : '20px 24px',
    background: 'linear-gradient(to bottom, #0f172a, #13192b)',
    borderBottom: '1px solid #1e293b',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  }),
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  botIconWrapper: {
    width: '48px',
    height: '48px',
    background: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.2)',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerStatus: {
    fontSize: '0.85rem',
    fontWeight: 'bold'
  },
  messagesContainer: {
    flex: 1,
    padding: '24px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    background: '#0a0f1a' // Slightly darker inner background for chat lines
  },
  messageRow: {
    display: 'flex',
    width: '100%',
    gap: '12px',
    alignItems: 'flex-end'
  },
  avatarBot: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: '#3b82f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 2px 10px rgba(59, 130, 246, 0.4)'
  },
  messageBubble: {
    padding: '14px 18px',
    borderRadius: '16px',
    fontSize: '0.95rem',
    lineHeight: '1.6',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
    whiteSpace: 'pre-wrap'
  },
  timestamp: {
    fontSize: '0.7rem',
    color: '#64748b',
    marginTop: '6px',
    padding: '0 4px'
  },
  quickRepliesContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '12px'
  },
  quickReplyBtn: {
    background: 'rgba(59, 130, 246, 0.15)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    borderRadius: '20px',
    padding: '8px 16px',
    color: '#60a5fa',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '500',
    transition: 'all 0.2s'
  },
  typingDots: {
    display: 'flex',
    gap: '6px',
    padding: '4px 8px',
    alignItems: 'center'
  },
  inputArea: {
    padding: '20px 24px',
    background: '#13192b',
    borderTop: '1px solid #1e293b'
  },
  inputBox: {
    display: 'flex',
    gap: '12px',
    background: '#0f172a',
    border: '1px solid #334155',
    padding: '8px',
    borderRadius: '16px',
    alignItems: 'center',
    transition: 'border-color 0.2s'
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    background: 'transparent',
    border: 'none',
    color: 'white',
    fontSize: '1rem',
    outline: 'none'
  },
  sendBtn: (active) => ({
    width: '42px',
    height: '42px',
    background: active ? '#3b82f6' : '#1e293b',
    color: active ? 'white' : '#64748b',
    border: 'none',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: active ? 'pointer' : 'not-allowed',
    transition: 'all 0.2s',
    flexShrink: 0
  })
};