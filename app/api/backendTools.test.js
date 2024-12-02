import {sendResetEmail} from '@/app/api/backendTools';
import nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('sendResetEmail', () => {
    const mockSendMail = jest.fn();
    const mockCreateTransport = jest.fn(() => ({
        sendMail: mockSendMail,
    }));

    beforeEach(() => {
        jest.clearAllMocks();
        nodemailer.createTransport = mockCreateTransport;
    });

    it('should send a "Set Your Datum Password" email for first-time setup', async () => {
        const email = 'test@example.com';
        const resetLink = 'http://example.com/reset';
        const firstTime = true;

        await sendResetEmail(email, resetLink, firstTime);

        expect(nodemailer.createTransport).toHaveBeenCalledWith({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        expect(mockSendMail).toHaveBeenCalledWith({
            from: `"Datum" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Set Your Datum Password',
            html: expect.stringContaining(
                'Your Datum account has been created',
            ),
        });
    });

    it('should send a "Reset your Password for Datum" email for reset requests', async () => {
        const email = 'test@example.com';
        const resetLink = 'http://example.com/reset';
        const firstTime = false;

        await sendResetEmail(email, resetLink, firstTime);

        expect(nodemailer.createTransport).toHaveBeenCalledWith({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        expect(mockSendMail).toHaveBeenCalledWith({
            from: `"Datum" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Reset your Password for Datum',
            html: expect.stringContaining('You requested a password reset'),
        });
    });

    it('should handle errors gracefully', async () => {
        const email = 'test@example.com';
        const resetLink = 'http://example.com/reset';
        const firstTime = false;

        mockSendMail.mockRejectedValue(new Error('SMTP Error'));

        await expect(
            sendResetEmail(email, resetLink, firstTime),
        ).resolves.not.toThrow();

        expect(console.error).toHaveBeenCalledWith(
            'Error sending reset link:',
            expect.any(Error),
        );
    });
});
