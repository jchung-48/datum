'use server'

import * as z from 'zod';

// Import the Genkit core libraries and plugins.
import { generate } from '@genkit-ai/ai';
import { configureGenkit } from '@genkit-ai/core';
import { defineFlow, runFlow } from '@genkit-ai/flow';
import { ollama } from 'genkitx-ollama';

import pdf from 'pdf-parse';


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
      serverAddress: 'http://127.0.0.1:11434',
    }),
  ],
  // Log debug output to tbe console.
  logLevel: "debug",
  // Perform OpenTelemetry instrumentation and enable trace collection.
  enableTracingAndMetrics: true,
});

// Define a simple flow that prompts an LLM to generate menu suggestions.
const menuSuggestionFlow = defineFlow(
  {
    name: 'menuSuggestionFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (subject) => {
    // Construct a request and send it to the model API.
    const llmResponse = await generate({
      prompt: `Suggest an item for the menu of a ${subject} themed restaurant`,
      model: 'ollama/llama3.2',
      config: {
        temperature: 1,
      },
    });

    // Handle the response from the model API. In this sample, we just
    // convert it to a string, but more complicated flows might coerce the
    // response into structured output or chain the response into another
    // LLM call, etc.
    return llmResponse.text();
  }
);

const summarizeFlow = defineFlow(
  {
    name: 'summarizeFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (subject) => {
    const pdfBuffer = Buffer.from(subject, 'base64');

    const data = await pdf(pdfBuffer);
    const textContent = data.text;

    const llmResponse = await generate({
      prompt: `Summarize the following text:\n\n${textContent}`,
      model: 'ollama/llama3.2',
      config: {
        temperature: 1,
      }
    });

    return llmResponse.text();
  }
);

interface FlowResponse {
  text: string;
}

export async function callSummarizeFlow(base64Pdf: string): Promise<string> {
  const flowResponse = await runFlow(summarizeFlow, base64Pdf as string) as string;
  return flowResponse; // This should now be recognized as a string
}




export async function callMenuSuggestionFlow() {
  // Invoke the flow. The value you pass as the second parameter must conform to
  // your flow's input schema.
  const flowResponse = await runFlow(menuSuggestionFlow, 'banana');
  console.log(flowResponse);
}
