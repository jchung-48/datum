"use client"
import React, { useState, useEffect } from 'react';
import './styles.modules.css';
import SearchBarAI from "../Utilities/SearchBarAI/searchBarAI";
import { FaArrowCircleUp  } from 'react-icons/fa';
import { AiButtonProps, SummarySearchResult } from '../types';
import ReactMarkdown from 'react-markdown';
import * as pdfjsLib from 'pdfjs-dist';
import { SpinnerDiamond } from 'spinners-react';

// import { callSummarizeFlow } from './summarization';

// Set the workerSrc for pdfjsLib
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';

const AiButton: React.FC<AiButtonProps> = ({paths}) => {
  const [isCardVisible, setIsCardVisible] = useState(false);
  const [mode, setMode] = useState<'summarize' | 'chat'>('summarize');
  const [inputValue, setInputValue] = useState('');
  const [fileSelectedForSummary, setFileSelectedForSummary] = useState<SummarySearchResult | null>(null);
  const [summaryContent, setSummaryContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  const extractTextFromPdf = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let textContent = '';
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const text = await page.getTextContent();
      textContent += text.items.map((item: any) => item.str).join(' ') + '\n';
    }
    return textContent;
  }

  const handleFileSelect = (file: SummarySearchResult) =>{
    setFileSelectedForSummary(file);
    setSummaryContent(null);
  }

  const handleSummarizeClick = async () => {
    if (!fileSelectedForSummary) {
      alert('Please select a file to summarize.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(fileSelectedForSummary.downloadURL);
      const arrayBuffer = await response.arrayBuffer();
      const textContent = await extractTextFromPdf(arrayBuffer);
      console.log("Calling summarize flow on file: ", fileSelectedForSummary.name);
      
      // Call the API route instead of a server-side function
      const apiResponse = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textContent,
          metadata: `Title: ${fileSelectedForSummary.name}
Author: ${fileSelectedForSummary.author}
Upload Date: ${fileSelectedForSummary.uploadDate}`
        }),
      });

      if (!apiResponse.ok) {
        throw new Error('Failed to generate summary');
      }

      const data = await apiResponse.json();
      setSummaryContent(data.summary);
    } catch (error) {
      console.error('Error fetching or parsing PDF:', error);
      setSummaryContent('Error fetching or parsing PDF.');
    } finally {
      setLoading(false);
    }
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
            {mode === 'summarize' ? (
              <>
                <SpinnerDiamond className="throbber" enabled={loading} color= "#617D9F"/>
                <ReactMarkdown>{summaryContent}</ReactMarkdown>
              </>
            ) : (
              <>
                <ReactMarkdown/>
              </>
            )}
            
          </div>

          {/* Input Area */}
          <div className="input-area">
            {mode === 'summarize' ? (
              <>
                <SearchBarAI paths={paths} onFileSelect={handleFileSelect} />
                <button className="action-button" onClick={handleSummarizeClick} ><FaArrowCircleUp /></button>
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
