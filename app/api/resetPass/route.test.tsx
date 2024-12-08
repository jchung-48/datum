import {POST} from '@/app/api/resetPass/route';
import admin from '@/lib/firebaseAdmin';

jest.mock('@/lib/firebaseAdmin', () => ({
    auth: jest.fn(() => ({
        generatePasswordResetLink: jest.fn(),
    })),
}));

jest.mock('@/app/api/backendTools', () => ({
    sendResetEmail: jest.fn(),
}));

describe('resetPass API route', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return 405 for non-POST requests', async () => {
        const req = new Request('http://localhost', {method: 'GET'});
        const res = await POST(req, {} as any);

        expect(res.status).toBe(405);
        const body = await res.json();
        expect(body.message).toBe('Only POST requests are allowed');
    });

    it('should return 200 and send reset email on valid input', async () => {
        const mockEmail = 'test@example.com';
        const mockResetLink = 'http://reset.link';
        (admin.auth().generatePasswordResetLink as jest.Mock).mockResolvedValue(
            mockResetLink,
        );
        const {sendResetEmail} = require('@/app/api/backendTools');

        const req = new Request('http://localhost', {
            method: 'POST',
            body: JSON.stringify({email: mockEmail}),
        });

        const res = await POST(req, {} as any);

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.message).toBe('Password Reset link sent!');
        expect(admin.auth().generatePasswordResetLink).toHaveBeenCalledWith(
            mockEmail,
        );
        expect(sendResetEmail).toHaveBeenCalledWith(
            mockEmail,
            mockResetLink,
            false,
        );
    });

    it('should return 500 if there is an error generating the reset link', async () => {
        const mockEmail = 'test@example.com';
        (admin.auth().generatePasswordResetLink as jest.Mock).mockRejectedValue(
            new Error('Invalid email'),
        );

        const req = new Request('http://localhost', {
            method: 'POST',
            body: JSON.stringify({email: mockEmail}),
        });

        const res = await POST(req, {} as any);

        expect(res.status).toBe(500);
        const body = await res.json();
        expect(body.message).toContain(
            'Error reseting password: Invalid email',
        );
        expect(admin.auth().generatePasswordResetLink).toHaveBeenCalledWith(
            mockEmail,
        );
    });
});
