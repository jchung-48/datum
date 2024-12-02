/*import type { NextApiRequest, NextApiResponse } from 'next';
import { callKbQAFlow } from 'app/genkit'; // Adjust the path to where your genkit logic is located

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { message } = req.body;

      // Validate input
      if (!message || typeof message !== 'string') {
        res.status(400).json({ error: 'Invalid input. "message" is required and must be a string.' });
        return;
      }

      // Call your RAG flow
      const response = await callKbQAFlow(message);
      res.status(200).json({ response });
    } catch (error) {
      console.error('Error processing chat request:', error);
      res.status(500).json({ error: 'Failed to process the request.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
*/

// app/api/chatbot/route.ts
/*
'use server'

import { NextResponse } from 'next/server';
import { z } from 'zod';

// Import the kbQAFlow function
// import { callKbQAFlow, kbQAFlow } from 'app/genkit'; // Adjust the path as needed
import { kbQAFlow } from '@/app/genkit';

// Define the request schema using zod
const ChatSchema = z.object({
  question: z.string(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = ChatSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { question } = parsed.data;

    // Call the server-side kbQAFlow
    const response = await kbQAFlow(question);

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
*/

import {NextResponse} from 'next/server';
// import { kbQAFlow } from 'app/genkit'; // Adjust the import path to your flow function
import {runFlow} from '@genkit-ai/flow';
import {kbQAFlow} from '../../aiAddon/chat'; // Adjust the path as needed

export async function POST(req: Request) {
    try {
        const body = await req.json();

        if (!body.message) {
            return NextResponse.json(
                {error: 'Message is required.'},
                {status: 400},
            );
        }

        const response = await runFlow(kbQAFlow, body.message);
        return NextResponse.json({response});
    } catch (error) {
        console.error('Error in chatBot API route:', error);
        return NextResponse.json(
            {error: 'Internal Server Error'},
            {status: 500},
        );
    }
}
