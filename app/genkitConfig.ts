import dotenv from 'dotenv';
import {configureGenkit} from '@genkit-ai/core';
import {ollama} from 'genkitx-ollama';
import {textEmbeddingGecko, vertexAI} from '@genkit-ai/vertexai';
import {devLocalVectorstore} from '@genkit-ai/dev-local-vectorstore';
dotenv.config();
const ollamaServerAddress = 'http://127.0.0.1:11434';

if (!ollamaServerAddress) {
    throw new Error('Missing Ollama server address');
}


// Configure Genkit with LLM (Llama 3.2) and Embedder (Vertex AI)
configureGenkit({
    plugins: [
        ollama({
            models: [{name: 'llama3.2'}],
            serverAddress: ollamaServerAddress,
        }),
        vertexAI(),
        devLocalVectorstore([
            {
                indexName: 'knowledgeBase',
                embedder: textEmbeddingGecko, // Creates a numeric vector that encodes the semantic meaning of the original content
            },
        ]),
    ],
    logLevel: 'debug',
    enableTracingAndMetrics: true,
});
