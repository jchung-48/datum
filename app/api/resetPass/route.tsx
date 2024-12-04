import admin from '@/lib/firebaseAdmin';
import {NextApiResponse} from 'next';
import {sendResetEmail} from '../backendTools';

type ErrorResponse = {message: string};
type SuccessResponse = {message: string; resetLink?: string};

export async function POST(
    req: Request,
    res: NextApiResponse<ErrorResponse | SuccessResponse>,
): Promise<Response> {
    if (req.method !== 'POST') {
        return new Response(
            JSON.stringify({message: 'Only POST requests are allowed'}),
            {status: 405},
        );
    }

    const {email} = (await req.json()) as {
        email: string;
    };
    try {
        const resetLink = await admin.auth().generatePasswordResetLink(email);
        await sendResetEmail(email, resetLink, false);

        return new Response(
            JSON.stringify({message: 'Password Reset link sent!'}),
            {status: 200, headers: {'Content-Type': 'application/json'}},
        );
    } catch (error) {
        const errorMessage = (error as Error).message;
        return new Response(
            JSON.stringify({
                message: `Error reseting password: ${errorMessage}`,
            }),
            {status: 500, headers: {'Content-Type': 'application/json'}},
        );
    }
}
