import React, { useState } from 'react';
import './styles.css';

const AiButton: React.FC = () => {
  const [isCardVisible, setIsCardVisible] = useState(false);
  const [mode, setMode] = useState<'summarize' | 'chat'>('summarize');
  const [inputValue, setInputValue] = useState('');

  // Toggle card visibility
  const toggleCard = () => {
    setIsCardVisible(!isCardVisible);
  };

  // Toggle between Summarize and Chat modes
  const handleModeToggle = (selectedMode: 'summarize' | 'chat') => {
    setMode(selectedMode);
    setInputValue(''); // Clear input when mode changes
  };

  // Handle input change for chat input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  return (
    <div>
      {/* Circle Button in the bottom right */}
      <button className="circle-button" onClick={toggleCard}>
        {/* ollamaLogo.png from ../../public/images/ollamaLogo.png */}
        <img className="ai-logo" src="/images/ollamaLogo.png"/>
      </button>

      {/* Overlay and Card */}
      {isCardVisible && (
        <div className="overlay" onClick={toggleCard}>
          <div className="card" onClick={(e) => e.stopPropagation()}>
            {/* Tab Buttons */}
            <div className="mode-toggle">
              <button
                className={`tab-button ${mode === 'summarize' ? 'active' : ''}`}
                onClick={() => handleModeToggle('summarize')}
              >
                Summarize
              </button>
              <button
                className={`tab-button ${mode === 'chat' ? 'active' : ''}`}
                onClick={() => handleModeToggle('chat')}
              >
                Chat
              </button>
            </div>

            {/* Content Display Area */}
            <div className="content-display">
              
            </div>

            {/* Input Area */}
            <div className="input-area">
              {mode === 'summarize' ? (
                <>
                  <input type="file" />
                  <button className="action-button">Summarize</button>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Chat with the LLM"
                    value={inputValue}
                    onChange={handleInputChange}
                  />
                  <button className="action-button">Send</button>
                </>
              )}
            </div>

            {/* Close Button */}
            <button className="close-button" onClick={toggleCard}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiButton;
