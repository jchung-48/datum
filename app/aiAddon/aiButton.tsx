import React, { useState, useEffect } from 'react';
import styles from './styles.module.css';
import SearchBarAI from "../Utilities/SearchBarAI/searchBarAI";
import { FaArrowCircleUp } from "react-icons/fa";
import { AiButtonProps, SummarySearchResult } from "../types";
import ReactMarkdown from "react-markdown";
import * as pdfjsLib from "pdfjs-dist";
import { SpinnerDiamond } from "spinners-react";

// Set the workerSrc for pdfjsLib
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.js";

const AiButton: React.FC<AiButtonProps> = ({ paths }) => {
  const [isCardVisible, setIsCardVisible] = useState(false);
  const [mode, setMode] = useState<"summarize" | "chat">("summarize");
  const [inputValue, setInputValue] = useState("");
  const [fileSelectedForSummary, setFileSelectedForSummary] =
    useState<SummarySearchResult | null>(null);
  const [summaryContent, setSummaryContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<
    { sender: "user" | "bot"; message: string }[]
  >([]);

  // Toggle card visibility
  const toggleCard = () => {
    setIsCardVisible(!isCardVisible);
  };

  // Toggle between Summarize and Chat modes
  const handleModeToggle = (selectedMode: "summarize" | "chat") => {
    setMode(selectedMode);
    setInputValue(""); // Clear input when mode changes
  };

  // Handle input change for chat input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const extractTextFromPdf = async (
    arrayBuffer: ArrayBuffer
  ): Promise<string> => {
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let textContent = "";
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const text = await page.getTextContent();
      textContent +=
        text.items.map((item: any) => item.str).join(" ") + "\n";
    }
    return textContent;
  };

  const handleFileSelect = (file: SummarySearchResult) => {
    setFileSelectedForSummary(file);
    setSummaryContent(null);
  };

  // Function to handle chat request
  const handleChat = async () => {
    if (!inputValue.trim()) return;

    // Add user's message to chat history
    setChatHistory((prev) => [...prev, { sender: "user", message: inputValue }]);
    setInputValue(""); // Clear input field

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: inputValue }),
      });

      const data = await response.json();

      // Add bot's response to chat history
      setChatHistory((prev) => [
        ...prev,
        { sender: "bot", message: data.response },
      ]);
    } catch (error) {
      console.error("Error in chat:", error);
      setChatHistory((prev) => [
        ...prev,
        { sender: "bot", message: "Error: Unable to fetch response." },
      ]);
    }
  };

  const handleSummarizeClick = async () => {
    if (!fileSelectedForSummary) {
      alert("Please select a file to summarize.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(fileSelectedForSummary.downloadURL);
      const arrayBuffer = await response.arrayBuffer();
      const textContent = await extractTextFromPdf(arrayBuffer);
      console.log("Calling summarize flow on file: ", fileSelectedForSummary.name);

      // Call the API route instead of a server-side function
      const apiResponse = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textContent,
          metadata: `Title: ${fileSelectedForSummary.name}
Author: ${fileSelectedForSummary.author}
Upload Date: ${fileSelectedForSummary.uploadDate}`,
        }),
      });

      if (!apiResponse.ok) {
        throw new Error("Failed to generate summary");
      }

      const data = await apiResponse.json();
      setSummaryContent(data.summary);
    } catch (error) {
      console.error("Error fetching or parsing PDF:", error);
      setSummaryContent("Error fetching or parsing PDF.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsCardVisible(false);
      }
    };

    if (isCardVisible) {
      window.addEventListener("keydown", handleKeyDown);
    }

    // Cleanup
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCardVisible]);

  return (
    <div>
      {/* Circle Button in the bottom right */}
      {!isCardVisible && (
        <button className={styles.circleButton} onClick={toggleCard}>
          <img className={styles.aiLogo} src="/images/ollamaLogo.png" alt="AI Logo" />
        </button>
      )}

      {/* Card */}
      {isCardVisible && (
        <div className={styles.card}>
          {/* Close Button */}
          <div className={styles.tabOptions}>
            <button className={styles.cardCloseButton} onClick={toggleCard}>
              ×
            </button>
          </div>
          {/* Tab Buttons */}
          <div className={styles.modeToggle}>
            <button
              className={`${styles.tabButton} ${mode === 'summarize' ? styles.active : ''}`}
              onClick={() => handleModeToggle('summarize')}
            >
              Summarize
            </button>
            <button
              className={`${styles.tabButton} ${mode === 'chat' ? styles.active : ''}`}
              onClick={() => handleModeToggle('chat')}
            >
              Chat
            </button>
          </div>

          {/* Content Display Area */}
          <div className={styles.contentDisplay}>
            {mode === 'summarize' ? (
              <>
                <SpinnerDiamond className={styles.throbber} enabled={loading} color="#617D9F" />
                <ReactMarkdown>{summaryContent}</ReactMarkdown>
              </>
            ) : (
              <>
                <div className={styles.chatHistory}>
                  {chatHistory.map((entry, index) => (
                    <div
                      key={index}
                      className={`${styles.chatMessage} ${
                        entry.sender === 'user' ? styles.userMessage : styles.botMessage
                      }`}
                    >
                      <strong>{entry.sender === 'user' ? 'You' : 'AI'}:</strong> {entry.message}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Input Area */}
          <div className={styles.inputArea}>
            {mode === 'summarize' ? (
              <>
                <SearchBarAI paths={paths} onFileSelect={handleFileSelect} />
                <button className={styles.actionButton} onClick={handleSummarizeClick}>
                  <FaArrowCircleUp />
                </button>
              </>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Chat with the LLM"
                  value={inputValue}
                  onChange={handleInputChange}
                  className={styles.chatInput} // Add this class in your CSS if needed
                />
                <button className={styles.actionButton} onClick={handleChat}>
                  Send
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AiButton;
