import { useState } from 'react';
import { callSummarizeFlow } from '../genkit';

export default function PdfSummary() {
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [summary, setSummary] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    const convertFileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const result = reader.result as string;
                resolve(result.split(',')[1]);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setPdfFile(file);
    };

    const handleGenerateSummary = async () => {
        if (!pdfFile) {
            alert('Please select a PDF file before generating a summary.');
            return;
        }

        setLoading(true);
        try {
            const base64Pdf = await convertFileToBase64(pdfFile) as string;
            const response = await callSummarizeFlow(base64Pdf);
            setSummary(response);
        } catch (error) {
            console.error("Error generating summary:", error);
            setSummary("There was an error generating the summary.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <h1>PDF Summary Generator</h1>
          <input type="file" accept="application/pdf" onChange={handleFileChange} />
          <button onClick={handleGenerateSummary} disabled={loading}>
            {loading ? "Generating..." : "Generate Summary"}
          </button>
          {summary && (
            <div style={{ marginTop: "20px" }}>
              <h3>Summary:</h3>
              <p>{summary}</p>
            </div>
          )}
        </div>
    );
}
