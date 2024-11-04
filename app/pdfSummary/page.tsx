"use client";

import { useState, useEffect } from 'react';
import { callSummarizeFlow } from '../genkit';
import { getDownloadURL, ref, listAll } from 'firebase/storage';
import { db, storage } from '../../firebase';
import * as pdfjsLib from 'pdfjs-dist';
import Link from 'next/link';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';

import styles from './PdfSummaryPage.module.css';

export default function PdfSummaryPage() {
    const [fileUrls, setFileUrls] = useState<string[]>([]);
    const [summary, setSummary] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        const fetchFiles = async () => {
            try {
                const storageRef = ref(storage, '/');
                const fileList = await listAll(storageRef);
                const urls = await Promise.all(
                    fileList.items.map(async (itemRef) => await getDownloadURL(itemRef))
                );
                setFileUrls(urls);
            } catch (error) {
                console.error('Error fetching files:', error);
            }
        };

        fetchFiles();
    }, []);

    const extractTextFromPdf = async (arrayBuffer: ArrayBuffer): Promise<string> => {
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let textContent = '';
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const content = await page.getTextContent();
            textContent += content.items.map((item: any) => item.str).join(' ') + '\n';
        }
        return textContent;
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLSelectElement>) => {
        const url = event.target.value;
        if (!url) return;

        setLoading(true);
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const textContent = await extractTextFromPdf(arrayBuffer);
            const summaryResponse = await callSummarizeFlow(textContent);
            setSummary(summaryResponse);
        } catch (error) {
            console.error('Error generating summary:', error);
            setSummary('Error generating summary.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <Link href="/">
                <button style={{ marginBottom: '20px' }}>Home</button>
            </Link>
            <h1>PDF Summary Generator</h1>
            <div className={styles.selectWrapper}>
                <select onChange={handleFileSelect} disabled={loading}>
                    <option value="">Select a PDF file</option>
                    {fileUrls.map((url, index) => (
                        <option key={index} value={url}>
                            {decodeURIComponent((url.split('/').pop())?.split('?alt=')[0] || `File ${index + 1}`)}
                        </option>
                    ))}
                </select>
            </div>
            {loading && <p className={styles.loading}>Loading...</p>}
            {summary && (
                <div className={styles.summaryContainer}>
                    <h3 className={styles.summaryTitle}>Summary:</h3>
                    <p className={styles.summaryText}>{summary}</p>
                </div>
            )}
        </div>
    );
}