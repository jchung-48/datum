import React, { useState, useEffect } from 'react';
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

  // Handle Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCardVisible(false);
      }
    };

    if (isCardVisible) {
      window.addEventListener('keydown', handleKeyDown);
    }

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCardVisible]);

  return (
    <div>
      {/* Circle Button in the bottom right */}
      {!isCardVisible && (
        <button className="circle-button" onClick={toggleCard}>
          <img className="ai-logo" src="/images/ollamaLogo.png"/>
        </button>
      )}

      {/* Card */}
      {isCardVisible && (
        <div className="card">
          {/* Close Button */}
          <div className="tab-options">
            <button className="card-close-button" onClick={toggleCard}>
              ×
            </button>
          </div>
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
            {/* Content goes here */}
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
        </div>
      )}
    </div>
  );
};

export default AiButton;
