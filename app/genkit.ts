'use server';

import * as z from 'zod';

import './genkitConfig';

// Import the Genkit core libraries and plugins.
import {generate} from '@genkit-ai/ai';
import {configureGenkit} from '@genkit-ai/core';
import {defineFlow, runFlow, run} from '@genkit-ai/flow';
import {ollama} from 'genkitx-ollama';
import {index} from '@genkit-ai/ai';
import {Document, retrieve} from '@genkit-ai/ai/retriever';

import * as admin from 'firebase-admin';

import {
    devLocalIndexerRef,
    devLocalVectorstore,
    devLocalRetrieverRef,
} from '@genkit-ai/dev-local-vectorstore';
import {textEmbeddingGecko, vertexAI} from '@genkit-ai/vertexai';

import pdf from 'pdf-parse';
import {chunk} from 'llm-chunk';

export const knowledgeBaseIndexer = devLocalIndexerRef('knowledgeBase');

// Create chunking config
const chunkingConfig = {
    minLength: 1000,
    maxLength: 2000,
    splitter: 'sentence',
    overlap: 100,
    delimiters: '',
} as any;

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
    admin.initializeApp();
}

// Indexer flow
export const indexKB = defineFlow(
    {
        name: 'indexKB',
        inputSchema: z.void(),
        outputSchema: z.void(),
    },
    async () => {
        // add all collection paths to files
        // Fetch PDFs from Firestore
        const pdfs = await run('fetch-pdfs', fetchPdfsFromFirestore);

        // Process each PDF
        for (const pdf of pdfs) {
            const {pdfName, filePath} = pdf;

            // Download the PDF from Storage
            const pdfBuffer = await run('download-pdf', () =>
                downloadPdfFromStorage(filePath),
            );

            // Extract text from PDF
            const pdfTxt = await run('extract-text', () =>
                extractTextFromPdfBuffer(pdfBuffer),
            );

            // Chunk the text
            const chunks = await run('chunk-it', async () =>
                chunk(pdfTxt, chunkingConfig),
            );

            // Convert chunks to Documents
            const documents = chunks.map(text => {
                return Document.fromText(text, {pdfName});
            });

            // Add documents to the index
            await index({
                indexer: knowledgeBaseIndexer,
                documents,
            });
        }
    },
);

// Function to fetch PDFs from Firestore
// NOTE: if there are corrupted PDFs indexer will get bad xRef. If other files like .jpg are in the collection, an error will occur
async function fetchPdfsFromFirestore() {
    const db = admin.firestore();

    // Explicitly define the type of the pdfs array
    const pdfs: Array<{
        pdfName: string;
        filePath: string;
        collectionPath: string;
    }> = [];

    // list of all collection paths
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

async function downloadPdfFromStorage(filePath: string) {
    if (!filePath) {
        throw new Error('Storage path is undefined or empty.');
    }

    console.log('Attempting to download file from storage path:', filePath);

    const bucket = admin.storage().bucket('datum-115a.appspot.com'); // Ensure this matches your actual bucket name
    const file = bucket.file(filePath);
    const [fileContents] = await file.download();
    return fileContents;
}

// Function to extract text from PDF buffer
async function extractTextFromPdfBuffer(pdfBuffer: Buffer) {
    const data = await pdf(pdfBuffer);
    return data.text;
}

// Define retriever
export const kbRetriever = devLocalRetrieverRef('knowledgeBase');

export const kbQAFlow = defineFlow(
    {
        name: 'knowledgeBaseQA',
        inputSchema: z.string(),
        outputSchema: z.string(),
    },
    async (input: string) => {
        // Retrieve relevant documents from your knowledge base
        const docs = await retrieve({
            retriever: kbRetriever,
            query: input,
            options: {k: 3},
        });

        // Generate a response using llama3.2 and your company context
        const llmResponse = await generate({
            model: 'ollama/llama3.2',
            prompt: `
You are acting as a helpful AI assistant in a private knowledge base that can answer questions about buyers (clients) and manufacturers (suppliers) for each department (merchandisers, QA managers, logistics agents) at our supply chain and global sourcing company.
Imagine that the prompter is an employee at the supply chain/global sourcing company who is searching for company records from any of these departments.
You are to answer accordingly to all your documentation provided. Answer truthfully.
Use the context provided to answer the question, but if there is not enough context ask clarifying questions to the prompter.
If you don't know, do not make up an answer.

Question: ${input}
`,
            context: docs,
        });

        const output = llmResponse.text();
        return output;
    },
);
