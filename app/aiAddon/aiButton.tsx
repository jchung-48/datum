import React, {useState, useEffect, useRef} from 'react';
import styles from './styles.module.css';
import SearchBarAI from '../Utilities/SearchBarAI/searchBarAI';
import {FaArrowCircleUp} from 'react-icons/fa';
import {AiButtonProps, SummarySearchResult} from '../types';
import ReactMarkdown from 'react-markdown';
import * as pdfjsLib from 'pdfjs-dist';
import {SpinnerDiamond} from 'spinners-react';
import { MdClose } from 'react-icons/md';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';

const AiButton: React.FC<AiButtonProps> = ({paths}) => {
    const [isCardVisible, setIsCardVisible] = useState(false);
    const [mode, setMode] = useState<'summarize' | 'chat'>('summarize');
    const [inputValue, setInputValue] = useState('');
    const [fileSelectedForSummary, setFileSelectedForSummary] =
        useState<SummarySearchResult | null>(null);
    const [summaryContent, setSummaryContent] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [chatLoading, setChatLoading] = useState(false);
    const [chatHistory, setChatHistory] = useState<
        Array<{sender: 'user' | 'bot'; message: string}>
    >([]);
    const chatHistoryRef = useRef<HTMLDivElement>(null);

    const toggleCard = () => {
        setIsCardVisible(!isCardVisible);
    };

    const handleModeToggle = (selectedMode: 'summarize' | 'chat') => {
        setMode(selectedMode);
        setInputValue('');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const extractTextFromPdf = async (
        arrayBuffer: ArrayBuffer,
    ): Promise<string> => {
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        let textContent = '';
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const text = await page.getTextContent();
            textContent +=
                text.items.map((item: any) => item.str).join(' ') + '\n';
        }
        return textContent;
    };

    const handleFileSelect = (file: SummarySearchResult) => {
        setFileSelectedForSummary(file);
        setSummaryContent(null);
    };
    
    // Handle chat request using API route and calling flow to generate response
    const handleChat = async (text?: string) => {
        const inputText = text?.trim() || inputValue.trim();

        if (!inputText) return;
        // Add user messages to chat history
        setChatHistory(prev => [...prev, {sender: 'user', message: inputText}]);
        setInputValue('');
        setChatLoading(true);

        try {
            const response = await fetch('/api/chatbot', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({message: inputText}),
            });

            const data = await response.json();
            // Add reposnse to chat history
            setChatHistory(prev => {
                const newHistory = [
                    ...prev,
                    {sender: 'bot' as const, message: data.response},
                ];
                setTimeout(() => {
                    if (chatHistoryRef.current) {
                        chatHistoryRef.current.scrollTop =
                            chatHistoryRef.current.scrollHeight;
                    }
                }, 0);
                return newHistory;
            });
        } catch (error) {
            console.error('Error in chat:', error);
            setChatHistory(prev => [
                ...prev,
                {sender: 'bot', message: 'Error: Unable to fetch response.'},
            ]);
        } finally {
            setChatLoading(false);
        }
    };

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
            console.log(
                'Calling summarize flow on file: ',
                fileSelectedForSummary.name,
            );

            const apiResponse = await fetch('/api/summarize', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    text: textContent,
                    metadata: `Title: ${fileSelectedForSummary.name}
Author: ${fileSelectedForSummary.author}
Upload Date: ${fileSelectedForSummary.uploadDate}`,
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

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsCardVisible(false);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                const summarizeTab = document.getElementById('summarizeTab');
                const chatTab = document.getElementById('chatTab');

                const chatInput = document.querySelector(
                    `.${styles.chatInput}`,
                );

                const text = chatInput
                    ? (chatInput as HTMLInputElement).value
                    : '';

                if (summarizeTab?.classList.contains(styles.active)) {
                    handleSummarizeClick();
                } else if (chatTab?.classList.contains(styles.active)) {
                    handleChat(text);
                } else {
                    console.error('No active tab found!');
                }
            }
        };

        if (isCardVisible) {
            window.addEventListener('keydown', handleKeyDown);
            window.addEventListener('keyup', handleKeyUp);
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [isCardVisible]);
    
    // Scrolling effect
    useEffect(() => {
        if (chatHistoryRef.current) {
            chatHistoryRef.current.scrollTop =
                chatHistoryRef.current.scrollHeight;
        }
    }, [chatHistory]);

    return (
        <div>
            {!isCardVisible && (
                <button className={styles.circleButton} onClick={toggleCard}>
                    <img
                        className={styles.aiLogo}
                        src="/images/ollamaLogo.png"
                        alt="AI Logo"
                    />
                </button>
            )}

            {isCardVisible && (
                <div className={styles.card}>
                    <div className={styles.tabOptions}>
                        <button
                            className={styles.cardCloseButton}
                            onClick={toggleCard}
                        >
                            <MdClose />
                        </button>
                    </div>
                    <div className={styles.modeToggle}>
                        <button
                            id="summarizeTab"
                            className={`${styles.tabButton} ${mode === 'summarize' ? styles.active : ''}`}
                            onClick={() => handleModeToggle('summarize')}
                        >
                            Summarize
                        </button>
                        <button
                            id="chatTab"
                            className={`${styles.tabButton} ${mode === 'chat' ? styles.active : ''}`}
                            onClick={() => handleModeToggle('chat')}
                        >
                            Chat
                        </button>
                    </div>

                    <div className={styles.contentDisplay}>
                        {mode === 'summarize' ? (
                            <>
                                <SpinnerDiamond
                                    className={styles.throbber}
                                    enabled={loading}
                                />
                                <ReactMarkdown>{summaryContent}</ReactMarkdown>
                            </>
                        ) : (
                            <>
                                <div
                                    className={styles.chatHistory}
                                    ref={chatHistoryRef}
                                >
                                    {chatHistory.map((entry, index) => (
                                        <div
                                            key={index}
                                            className={`${styles.chatMessage} ${
                                                entry.sender === 'user'
                                                    ? styles.userMessage
                                                    : styles.botMessage
                                            }`}
                                        >
                                            <strong>
                                                {entry.sender === 'user'
                                                    ? 'You'
                                                    : 'AI'}
                                                :
                                            </strong>{' '}
                                            <ReactMarkdown>
                                                {entry.message}
                                            </ReactMarkdown>
                                        </div>
                                    ))}

                                    {chatLoading && (
                                        <div className={styles.botLoading}>
                                            <strong>AI: </strong>{' '}
                                            <SpinnerDiamond
                                                color="#617D9F"
                                                size={20}
                                            />
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    <div className={styles.inputArea}>
                        {mode === 'summarize' ? (
                            <>
                                <SearchBarAI
                                    paths={paths}
                                    onFileSelect={handleFileSelect}
                                />
                                <button
                                    className={styles.actionButton}
                                    onClick={handleSummarizeClick}
                                >
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
                                    className={styles.chatInput}
                                />
                                <button
                                    className={styles.actionButton}
                                    onClick={() => handleChat()}
                                >
                                    <FaArrowCircleUp />
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
