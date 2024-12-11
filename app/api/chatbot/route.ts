import {NextResponse} from 'next/server';
import {runFlow} from '@genkit-ai/flow';
import {kbQAFlow} from '../../aiAddon/chat';


// Handle POST requests from this route
export async function POST(req: Request) {
    try {
        const body = await req.json();
        // Validate input
        if (!body.message) {
            return NextResponse.json(
                {error: 'Message is required.'},
                {status: 400},
            );
        }
        // Use runFlow with the message entered in chatbot, return response
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
