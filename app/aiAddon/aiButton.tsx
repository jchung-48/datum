// components/AIButton.tsx
"use client";

import React, { useState } from 'react';
import './AIButton.module.css';

const AIButton: React.FC = () => {
  // State for card visibility, mode selection, and input
  const [isCardVisible, setIsCardVisible] = useState(false);
  const [mode, setMode] = useState<'summarize' | 'chat'>('summarize');
  const [inputValue, setInputValue] = useState('');

  // Toggle card visibility
  const toggleCardVisibility = () => {
    setIsCardVisible((prev) => !prev);
  };

  // Handle mode toggle
  const handleModeToggle = (selectedMode: 'summarize' | 'chat') => {
    setMode(selectedMode);
    setInputValue(''); // Clear input when mode changes
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  return (
    <div className="ai-button-container">
      {/* AI Button */}
      <button className="ai-button" onClick={toggleCardVisibility}>
        <img src="/path/to/icon.png" alt="AI Button Icon" /> {/* Replace with actual path */}
      </button>

      {/* AI Card */}
      {isCardVisible && (
        <div className="ai-card">
          {/* Mode Toggle */}
          <div className="mode-toggle">
            <button
              className={mode === 'summarize' ? 'active' : ''}
              onClick={() => handleModeToggle('summarize')}
            >
              Summarize
            </button>
            <button
              className={mode === 'chat' ? 'active' : ''}
              onClick={() => handleModeToggle('chat')}
            >
              Chat
            </button>
          </div>

          {/* Content Display Area */}
          <div className="content-display">
            {mode === 'summarize' ? 'Summary' : 'Chat'}
          </div>

          {/* Input Area */}
          <div className="input-area">
            {mode === 'summarize' ? (
              <>
                <input type="file" />
                <button className="summarize-button">Summarize</button>
              </>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Chat with the LLM"
                  value={inputValue}
                  onChange={handleInputChange}
                />
                <button className="send-button">Send</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIButton;
