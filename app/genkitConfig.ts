import { configureGenkit } from '@genkit-ai/core';
import { ollama } from 'genkitx-ollama';
import { textEmbeddingGecko, vertexAI } from '@genkit-ai/vertexai';
import {
    devLocalVectorstore,
  } from '@genkit-ai/dev-local-vectorstore';
// Import other necessary plugins if any

// Optionally, use environment variables for sensitive configurations
//const ollamaServerAddress = 'http://127.0.0.1:11434';
const ollamaServerAddress = 'http://ryan.familyking.org:25315'



configureGenkit({
    plugins: [
      ollama({
        // Ollama provides an interface to many open generative models. Here,
        // we specify Google's Gemma model. The models you specify must already be
        // downloaded and available to the Ollama server.
        models: [{ name: 'llama3.2' }],
        // The address of your Ollama API server. This is often a different host
        // from your app backend (which runs Genkit), in order to run Ollama on
        // a GPU-accelerated machine.
        serverAddress: ollamaServerAddress,
      }),
      vertexAI(),
       // the local vector store requires an embedder to translate from text to vector
      devLocalVectorstore([
        {
          indexName: "knowledgeBase",
          embedder: textEmbeddingGecko
        }  
      ])
    ],
    // Log debug output to tbe console.
    logLevel: "debug",
    // Perform OpenTelemetry instrumentation and enable trace collection.
    enableTracingAndMetrics: true,
  });