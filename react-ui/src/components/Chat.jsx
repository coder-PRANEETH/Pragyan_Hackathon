import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import '../styles/Chat.css';

function Chat() {
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState([
    { type: 'bot', text: "Hi! I'm your medical assistant. How can I help you today?" }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [userData, setUserData] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };


  function formatRiskAnalysis(data) {
  const {
    risk,
    department,
    risk_explanation,
    department_explanation
  } = data;

  // Extract feature names from explanation strings
  const extractFeatures = (text) => {
    const matches = text.match(/([A-Za-z_-]+)\s*\(/g);
    if (!matches) return [];
    return matches.map(m => m.replace(" (", ""));
  };

  const riskFactors = extractFeatures(risk_explanation);
  const deptFactors = extractFeatures(department_explanation);

  const readableNames = {
    Age: "age",
    Heart_Rate: "heart rate",
    Temperature: "body temperature",
    Blood_Pressure: "blood pressure",
    Pre_Existing_Conditions: "existing medical conditions",
    Gender: "gender"
  };

  const convertToReadable = (arr) =>
    arr.map(f => readableNames[f] || f).join(", ");

  const friendlyText = `
🩺 Health Risk Assessment

Overall Risk Level: ${risk}

Based on your medical data and symptoms, your current condition is assessed as ${risk.toLowerCase()}.

The main factors influencing this assessment were:
• ${convertToReadable(riskFactors)}

🏥 Recommended Department: ${department}

You may consider consulting the ${department} department.
This recommendation is mainly influenced by:
• ${convertToReadable(deptFactors)}

 What This Means:
Your vital signs and reported symptoms suggest that monitoring and professional evaluation may be beneficial. If symptoms worsen or new symptoms appear, seek medical attention promptly.
  `.trim();

  return friendlyText;
}




  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const initialMessage = searchParams.get('message');
    if (initialMessage) {
      handleSendMessage(initialMessage);
    }
  }, [searchParams]);

  // Fetch user data when component mounts or userName changes
  useEffect(() => {
    const userName = searchParams.get('userName');
    if (userName) {
      loadUserData(userName);
    }
  }, [searchParams]);

  const loadUserData = async (name) => {
    try {
      const response = await fetch(
        `http://localhost:5000/user-details/${encodeURIComponent(name)}`
      );
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleSendMessage = async (messageText = inputMessage) => {
    const message = messageText.trim();
    if (!message || isLoading) return;

    // Add user message to chat
    const userMessage = { type: 'user', text: message };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Get userName from URL params
      const userName = searchParams.get('userName') || 'Guest';

      // Get medical data from userData or use defaults
      const medical = userData?.medical && userData.medical.length > 0
        ? userData.medical[0]
        : null;

      // Prepare medical data (use actual user data if available)
      const medicalData = {
        heart_beat: medical?.heart_beat || 72,
        temperature: medical?.temperature || 98.6,
        blood_group: medical?.blood_group || 'N/A',
        age: userData?.age || 'N/A',
        gender: userData?.gender || 'N/A'
      };

      // Create prompt for the model (matching UserDashboard format)
      const prompt = `Patient Medical Data:
- Age: ${medicalData.age}
- Gender: ${medicalData.gender}
- Heart Rate: ${medicalData.heart_beat} bpm
- Temperature: ${medicalData.temperature}°F
- Blood Group: ${medicalData.blood_group}

User Question: ${message}

Please provide a helpful medical response based on the patient's medical data and question.`;

      // Send to analyze-symptoms endpoint
      const response = await fetch('http://localhost:5000/analyze-symptoms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userName: userName,
          symptoms: message,
          medicalData: medicalData,
          prompt: prompt
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from server');
      }

      const data = await response.json();

      // Add bot response to chat
      const botMessage = {
        type: 'bot',
        text: formatRiskAnalysis(data) || data.response || 'Sorry, I could not process your request.'
      };
      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        type: 'bot',
        text: 'Sorry, I encountered an error. Please make sure the backend server and ML model are running.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Display file selected message
      const fileMessage = {
        type: 'user',
        text: `📎 File selected: ${file.name}`
      };
      setMessages(prev => [...prev, fileMessage]);
    }
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleVoiceToggle = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      // In a real implementation, you would stop the actual recording here
      const voiceMessage = {
        type: 'bot',
        text: '🎤 Voice recording stopped. (Voice feature coming soon)'
      };
      setMessages(prev => [...prev, voiceMessage]);
    } else {
      // Start recording
      setIsRecording(true);
      // In a real implementation, you would start the actual recording here
      const voiceMessage = {
        type: 'bot',
        text: '🎤 Voice recording started...'
      };
      setMessages(prev => [...prev, voiceMessage]);
    }
  };

  return (
    <div className="chat-page">
      <div className="chat-container">
        {/* Header */}
        <section className="chat-header">
          <h1>Chat Assistant</h1>
          <p>Have a conversation with your medical dashboard assistant</p>
        </section>

        {/* Chat Box */}
        <div className="chat-box-wrapper">
          <div className="chat-box">
            {/* Messages Container */}
            <div className="messages-container">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`message ${msg.type === 'user' ? 'user-message' : 'bot-message'}`}
                >
                  <div className="message-bubble">
                    <p>{msg.text}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="message bot-message">
                  <div className="message-bubble loading">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="input-area">
              <div className="input-wrapper">
                {/* File Upload Button - Left */}
                <button
                  onClick={handleFileButtonClick}
                  disabled={isLoading}
                  className="file-button"
                  title="Attach file"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="icon">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  accept="image/*,.pdf,.doc,.docx"
                />

                <input
                  type="text"
                  placeholder="Ask anything..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  className="chat-input"
                />

                {/* Voice Button - Right */}
                <button
                  onClick={handleVoiceToggle}
                  disabled={isLoading}
                  className={`voice-button ${isRecording ? 'recording' : ''}`}
                  title={isRecording ? "Stop recording" : "Start voice recording"}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="icon">
                    {isRecording ? (
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    ) : (
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
                    )}
                  </svg>
                </button>

                <button
                  onClick={() => handleSendMessage()}
                  disabled={isLoading || !inputMessage.trim()}
                  className="send-button"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="send-icon">
                    <path d="M16.6915026,12.4744748 L3.50612381,13.2599618 C3.19218622,13.2599618 3.03521743,13.4170592 3.03521743,13.5741566 L1.15159189,20.0151496 C0.8376543,20.8006365 0.99,21.89 1.77946707,22.52 C2.41,22.99 3.50612381,23.1 4.13399899,22.8429026 L21.714504,14.0454487 C22.6563168,13.5741566 23.1272231,12.6315722 22.9702544,11.6889879 L4.13399899,1.16414422 C3.34915502,0.9 2.40734225,1.00636533 1.77946707,1.4776575 C0.994623095,2.10604706 0.837654326,3.0486314 1.15159189,3.99021575 L3.03521743,10.4312088 C3.03521743,10.5883061 3.19218622,10.7454035 3.50612381,10.7454035 L16.6915026,11.5308905 C16.6915026,11.5308905 17.1624089,11.5308905 17.1624089,12.0021827 C17.1624089,12.4744748 16.6915026,12.4744748 16.6915026,12.4744748 Z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;
