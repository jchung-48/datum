import {NextResponse} from 'next/server';
import {runFlow} from '@genkit-ai/flow';
import {kbQAFlow} from '../../aiAddon/chat';

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
