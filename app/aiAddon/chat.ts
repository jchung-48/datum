import { generate, retrieve } from "@genkit-ai/ai";
import { devLocalRetrieverRef } from "@genkit-ai/dev-local-vectorstore";
import { defineFlow } from "@genkit-ai/flow";
import * as z from 'zod';
import '../genkitConfig';

export const kbRetriever = devLocalRetrieverRef('knowledgeBase');
export const kbQAFlow = defineFlow(
    { name: 'kbQAFlow', inputSchema: z.string(), outputSchema: z.string()},
    async (input: string) => {
      const docs = await retrieve({
        retriever: kbRetriever,
        query: input,
        options: { k:3 },
      });
  
      const llmResponse = await generate({
        model: 'ollama/llama3.2',
        prompt: `
You are acting as a helpful AI assistant in a private knowledge base that can answer questions about buyers (clients) and manufacturers (suppliers) for each department (merchandisers, QA managers, logistics agents) at our supply chain and global sourcing company.

The prompter is an employee at the supply chain/global sourcing company who is searching for company records from any of these departments.

Use the context provided to answer the question.

Provide concise and direct answers based on the available information.

Do not include any introductory statements or references; provide only the answer.

If information is not specified, use relevant context to generate a response.


Question: ${input}
  `,
        context: docs,
        config: {temperature: 0.5},
      });
  
      const output = llmResponse.text();
      return output;
    }
  );
  