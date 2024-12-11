'use server';

import * as z from 'zod';

import './genkitConfig';

import {defineFlow, run} from '@genkit-ai/flow';
import {index} from '@genkit-ai/ai';
import {Document} from '@genkit-ai/ai/retriever';

import * as admin from 'firebase-admin';

// Define indexer reference to vector store, which contains text embeddings
import {
    devLocalIndexerRef,
} from '@genkit-ai/dev-local-vectorstore';

import pdf from 'pdf-parse';
import {chunk} from 'llm-chunk';

// Define indexer
export const knowledgeBaseIndexer = devLocalIndexerRef('knowledgeBase');

// Create chunking config to break up larger documents for embedding/processing
const chunkingConfig = {
    minLength: 1000,
    maxLength: 2000,
    splitter: 'sentence',
    overlap: 100,
    delimiters: '',
} as any;

// Permissions
if (!admin.apps.length) {
    admin.initializeApp();
}

// Indexer flow helps keeps track of documents for retrieval
export const indexKB = defineFlow(
    {
        name: 'indexKB',
        inputSchema: z.void(),
        outputSchema: z.void(),
    },
    async () => {
        const pdfs = await run('fetch-pdfs', fetchPdfsFromFirestore);

        for (const pdf of pdfs) {
            const {pdfName, filePath} = pdf;

            const pdfBuffer = await run('download-pdf', () =>
                downloadPdfFromStorage(filePath),
            );

            const pdfTxt = await run('extract-text', () =>
                extractTextFromPdfBuffer(pdfBuffer),
            );

            const chunks = await run('chunk-it', async () =>
                chunk(pdfTxt, chunkingConfig),
            );

            const documents = chunks.map(text => {
                return Document.fromText(text, {pdfName});
            });

            await index({
                indexer: knowledgeBaseIndexer,
                documents,
            });
        }
    },
);

// Fetch PDFs from all paths with PDFs
async function fetchPdfsFromFirestore() {
    const db = admin.firestore();

    const pdfs: Array<{
        pdfName: string;
        filePath: string;
        collectionPath: string;
    }> = [];

    // Design shortcut: hardcoded paths
    const collectionPaths = [
        '/Company/mh3VZ5IrZjubXUCZL381/Departments/NpaV1QtwGZ2MDNOGAlXa/files',
        '/Company/mh3VZ5IrZjubXUCZL381/Departments/NpaV1QtwGZ2MDNOGAlXa/incident',
        '/Company/mh3VZ5IrZjubXUCZL381/Departments/Eq2IDInbEQB5nI5Ar6Vj/files',
        '/Company/mh3VZ5IrZjubXUCZL381/Departments/KZm56fUOuTobsTRCfknJ/customsFiles',
        '/Company/mh3VZ5IrZjubXUCZL381/Departments/KZm56fUOuTobsTRCfknJ/financialFiles',
        '/Company/mh3VZ5IrZjubXUCZL381/Departments/KZm56fUOuTobsTRCfknJ/transportationFiles',
        '/Company/mh3VZ5IrZjubXUCZL381/Departments/ti7yNByDOzarVXoujOog/files',
        '/Company/mh3VZ5IrZjubXUCZL381/Departments/ti7yNByDOzarVXoujOog/records',
    ];

    for (const path of collectionPaths) {
        try {
            const pdfsCollection = db.collection(path);
            const snapshot = await pdfsCollection.get();

            snapshot.docs.forEach(doc => {
                const data = doc.data();
                if (data.filePath) {
                    pdfs.push({
                        pdfName: doc.id,
                        filePath: data.filePath,
                        collectionPath: path,
                    });
                } else {
                    console.warn(
                        `Document ${doc.id} in ${path} is missing 'filePath'`,
                    );
                }
            });
        } catch (error) {
            console.error(`Error accessing collection at path ${path}:`, error);
        }
    }

    return pdfs;
}

// Download PDFs from Firebase Storage
async function downloadPdfFromStorage(filePath: string) {
    if (!filePath) {
        throw new Error('Storage path is undefined or empty.');
    }

    console.log('Attempting to download file from storage path:', filePath);

    const bucket = admin.storage().bucket('datum-115a.appspot.com');
    const file = bucket.file(filePath);
    const [fileContents] = await file.download();
    return fileContents;
}

// Extract text to a buffer for processing
async function extractTextFromPdfBuffer(pdfBuffer: Buffer) {
    const data = await pdf(pdfBuffer);
    return data.text;
}
