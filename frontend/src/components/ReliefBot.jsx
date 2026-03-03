import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';

export default function ReliefBot() {
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
  const [userLocation, setUserLocation] = useState(null); // ✅ ADDED
  const messagesEndRef = useRef(null);

  // ✅ Get user location on mount
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

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ✅ ADDED: Offline fallback knowledge base
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
        text: "⚕️ **MEDICAL ASSISTANCE**\n\nNearest facilities:\n• Emergency Field Hospital - 1.8 km\n• Mobile Medical Unit - City Square\n\nBoth operational 24/7 with emergency care and medications.",
        quickReplies: ['Call ambulance', 'Nearest hospital', 'First aid tips']
      };
    }

    if (text.includes('emergency') || text.includes('help') || text.includes('urgent')) {
      return {
        text: "🚨 **EMERGENCY ASSISTANCE**\n\nImmediate actions:\n1. Call 911 for life-threatening emergencies\n2. Local Rescue: (555) 123-4567\n3. Stay calm and in a safe location\n\nHow can I assist you further?",
        quickReplies: ['Find shelter', 'Medical help', 'Report location']
      };
    }

    if (text.includes('missing') || text.includes('family') || text.includes('lost')) {
      return {
        text: "👨‍👩‍👧‍👦 **MISSING PERSONS**\n\nI can help you:\n• Register a missing person\n• Search the registry\n• Connect with Red Cross Family Links\n\nWhat information do you have?",
        quickReplies: ['Register person', 'Search registry', 'Contact Red Cross']
      };
    }

    // Default response
    return {
      text: "I can help you with:\n\n🚨 Emergency services\n🏠 Shelter locations\n🍽️ Food & water\n⚕️ Medical assistance\n👨‍👩‍👧‍👦 Missing persons\n\nWhat do you need help with?",
      quickReplies: ['Emergency help', 'Find shelter', 'Get food', 'Medical help']
    };
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    // Add user message
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
      // ⚡ CALL GROQ API
      const response = await fetch('http://127.0.0.1:5000/api/chatbot/groq-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          history: updatedMessages,
          location: userLocation
        }),
      });

      const data = await response.json();

      if (data.success) {
        // ✅ AI response successful
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          text: data.response,
          timestamp: new Date(),
          quickReplies: data.quick_replies || []
        };

        setMessages(prev => [...prev, botMessage]);
        console.log('✅ Groq AI response received');
      } else {
        // ⚠️ AI failed, use rule-based fallback
        console.log('⚠️ AI failed, using rule-based fallback');
        const fallbackResponse = processMessage(currentInput);
        
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          text: fallbackResponse.text + '\n\n⚠️ Offline Mode',
          timestamp: new Date(),
          quickReplies: fallbackResponse.quickReplies || []
        };
console.log("Backend response:", data);
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (err) {
      // ❌ Network error - use rule-based fallback
      console.error('❌ Network Error:', err);
      const fallbackResponse = processMessage(currentInput);
      
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: fallbackResponse.text + '\n\n⚠️ Offline Mode',
        timestamp: new Date(),
        quickReplies: fallbackResponse.quickReplies || []
      };

      setMessages(prev => [...prev, botMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // ✅ Handle quick reply clicks
  const handleQuickReply = (reply) => {
    setInputText(reply);
    setTimeout(() => handleSendMessage(), 100);
  };

  return (
    <div style={styles.container}>
      <div style={styles.chatBox}>

        {/* Header */}
        <div style={styles.header}>
          <Bot size={24} />
          <span style={{ marginLeft: 10 }}>Relief Assistant</span>
          {userLocation && (
            <span style={{ marginLeft: 'auto', fontSize: 12, opacity: 0.8 }}>
              📍 Location enabled
            </span>
          )}
        </div>

        {/* Messages */}
        <div style={styles.messages}>
          {messages.map(msg => (
            <div key={msg.id}>
              <div
                style={{
                  ...styles.messageRow,
                  justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div
                  style={{
                    ...styles.messageBubble,
                    backgroundColor: msg.type === 'user' ? '#2563eb' : '#334155'
                  }}
                >
                  {msg.text}
                </div>
              </div>

              {/* Quick Replies */}
              {msg.quickReplies && msg.quickReplies.length > 0 && (
                <div style={styles.quickRepliesContainer}>
                  {msg.quickReplies.map((reply, idx) => (
                    <button
                      key={idx}
                      style={styles.quickReplyButton}
                      onClick={() => handleQuickReply(reply)}
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div style={styles.typing}>
              <div style={styles.typingDots}>
                <span>●</span>
                <span>●</span>
                <span>●</span>
              </div>
              Relief Assistant is typing...
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={styles.inputRow}>
          <input
            style={styles.input}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your message..."
          />
          <button 
            style={styles.sendButton} 
            onClick={handleSendMessage}
            disabled={!inputText.trim()}
          >
            <Send size={18} />
          </button>
        </div>

      </div>
    </div>
  );
}

const styles = {
  container: {
    height: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px'
  },
  chatBox: {
    width: '100%',
    maxWidth: '600px',
    height: '85vh',
    background: '#1e293b',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
  },
  header: {
    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    padding: '20px',
    color: 'white',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    fontSize: '18px'
  },
  messages: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
    background: '#0f172a'
  },
  messageRow: {
    display: 'flex',
    marginBottom: '15px'
  },
  messageBubble: {
    padding: '12px 16px',
    borderRadius: '16px',
    color: 'white',
    maxWidth: '75%',
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word'
  },
  quickRepliesContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '8px',
    marginBottom: '10px'
  },
  quickReplyButton: {
    background: 'rgba(37, 99, 235, 0.3)',
    border: '1px solid rgba(37, 99, 235, 0.5)',
    borderRadius: '20px',
    padding: '8px 16px',
    color: '#93c5fd',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s'
  },
  inputRow: {
    display: 'flex',
    padding: '15px',
    background: '#0f172a',
    borderTop: '1px solid #334155'
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    borderRadius: '24px',
    border: '1px solid #334155',
    outline: 'none',
    background: '#1e293b',
    color: 'white',
    fontSize: '15px'
  },
  sendButton: {
    marginLeft: '12px',
    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    border: 'none',
    padding: '12px 16px',
    borderRadius: '50%',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    width: '48px',
    height: '48px'
  },
  typing: {
    color: '#94a3b8',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '10px'
  },
  typingDots: {
    display: 'flex',
    gap: '4px'
  }
};