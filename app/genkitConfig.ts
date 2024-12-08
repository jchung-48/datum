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
                embedder: textEmbeddingGecko,
            },
        ]),
    ],
    logLevel: 'debug',
    enableTracingAndMetrics: true,
});
