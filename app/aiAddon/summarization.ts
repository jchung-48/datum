// genkit/summarization.ts

import * as z from 'zod';
import { generate } from '@genkit-ai/ai';
import { defineFlow, runFlow } from '@genkit-ai/flow';
import '../genkitConfig';

// Define the summarizeFlow
export const summarizeFlow = defineFlow(
  {
    name: 'summarizeFlow',
    inputSchema: z.object({
      text: z.string(),
      metadata: z.string(),
    }),
    outputSchema: z.string(),
  },
  async ({ text, metadata }) => {
    console.log('Getting response from ollama/llama3.2');
    const response = await generate({
      model: 'ollama/llama3.2',
      prompt: `
Summarize the following text. First provide context from the metadata which is provided below.
After providing context, provide a brief summary of the document content.
Followed by a bulleted list of the main points of the document content. If the file is not in the format of a PDF,
please say that the file is not a PDF and that the summarization may be inaccurate. In the case that it cannot 
be analyzed, you MUST say that the file cannot be summarized.  
Finally, list the key takeaways. Be clear, concise, and write in markdown format.

Metadata: ${metadata}

Document Content: ${text}
      `,
      config: { temperature: 0.7 },
    });
    return response.text();
  }
);

// Export the callSummarizeFlow function
export async function callSummarizeFlow(text: string, metadata: string): Promise<string> {
  console.log('In callSummarizeFlow');
  return await runFlow(summarizeFlow, { text, metadata });
}