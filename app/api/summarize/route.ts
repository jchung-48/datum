// app/api/summarize/route.ts

import {NextResponse} from 'next/server';
import {z} from 'zod';

// Import server-side functions
import {callSummarizeFlow} from '../../aiAddon/summarization'; // Adjust the path as needed

// Define the request schema using zod
const SummarizeSchema = z.object({
    text: z.string(),
    metadata: z.string(),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = SummarizeSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {error: 'Invalid request body'},
                {status: 400},
            );
        }

        const {text, metadata} = parsed.data;

        // Call the server-side summarize flow
        const summary = await callSummarizeFlow(text, metadata);

        return NextResponse.json({summary});
    } catch (error) {
        console.error('Error in summarize API:', error);
        return NextResponse.json(
            {error: 'Internal Server Error'},
            {status: 500},
        );
    }
}
