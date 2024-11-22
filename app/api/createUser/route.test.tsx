import { POST } from '@/app/api/createUser/route';
import admin from '@/lib/firebaseAdmin';

// Mock Firebase Admin SDK
jest.mock('@/lib/firebaseAdmin', () => ({
  auth: jest.fn(() => ({
    verifyIdToken: jest.fn(),
    createUser: jest.fn(),
    setCustomUserClaims: jest.fn(),
    generatePasswordResetLink: jest.fn(),
  })),
  firestore: jest.fn(() => ({
    doc: jest.fn(() => ({
      get: jest.fn(),
      set: jest.fn(),
      update: jest.fn(),
    })),
    FieldValue: {
      serverTimestamp: jest.fn(),
      arrayUnion: jest.fn(),
    },
  })),
}));

// Mock headers
jest.mock('next/headers', () => ({
  headers: jest.fn(),
}));

// Mock sendResetEmail
jest.mock('@/app/api/backendTools', () => ({
  sendResetEmail: jest.fn(),
}));

describe('createUser API route', () => {
  const mockHeaders = {
    get: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    require('next/headers').headers.mockReturnValue(mockHeaders);
  });

  it('should return 405 for non-POST requests', async () => {
    const req = new Request('http://localhost', { method: 'GET' });
    const res = await POST(req, {} as any);

    expect(res.status).toBe(405);
    const body = await res.json();
    expect(body.message).toBe('Only POST requests are allowed');
  });

  it('should return 401 if no authorization token is provided', async () => {
    mockHeaders.get.mockReturnValue(null);
    const req = new Request('http://localhost', { method: 'POST' });
    const res = await POST(req, {} as any);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.message).toBe(null);
  });

  it('should return 403 if companyId is missing', async () => {
    mockHeaders.get.mockReturnValue('Bearer fakeToken');
    (admin.auth().verifyIdToken as jest.Mock).mockResolvedValue({ uid: 'testUid' });

    const req = new Request('http://localhost', { method: 'POST' });
    const res = await POST(req, {} as any);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.message).toBe('Access denied. No company association found.');
  });

  it('should return 404 if company does not exist', async () => {
    mockHeaders.get.mockReturnValue('Bearer fakeToken');
    (admin.auth().verifyIdToken as jest.Mock).mockResolvedValue({ uid: 'testUid', companyId: 'testCompanyId' });
    (admin.firestore().doc as jest.Mock).mockImplementation((path: string) => ({
      get: jest.fn().mockResolvedValue({ exists: false }),
    }));

    const req = new Request('http://localhost', { method: 'POST' });
    const res = await POST(req, {} as any);

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.message).toBe('Company not found');
  });

  it('should return 403 if user is not an admin', async () => {
    mockHeaders.get.mockReturnValue('Bearer fakeToken');
    (admin.auth().verifyIdToken as jest.Mock).mockResolvedValue({ uid: 'testUid', companyId: 'testCompanyId' });
    (admin.firestore().doc as jest.Mock).mockImplementation((path: string) => ({
      get: jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({ admins: [] }),
      }),
    }));

    const req = new Request('http://localhost', { method: 'POST' });
    const res = await POST(req, {} as any);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.message).toBe('Access denied. User is not an admin.');
  });

  it('should create a user and return 201 on success', async () => {
    mockHeaders.get.mockReturnValue('Bearer fakeToken');
    (admin.auth().verifyIdToken as jest.Mock).mockResolvedValue({ uid: 'testUid', companyId: 'testCompanyId' });
    (admin.firestore().doc as jest.Mock).mockImplementation((path: string) => ({
      get: jest.fn().mockResolvedValueOnce({
        exists: true,
        data: () => ({
          admins: [
            { isEqual: () => true },
          ],
        }),
      }),
      set: jest.fn(),
      update: jest.fn(),
    }));
    (admin.auth().createUser as jest.Mock).mockResolvedValue({ uid: 'newUserUid' });
    (admin.auth().generatePasswordResetLink as jest.Mock).mockResolvedValue('http://reset.link');
    const mockRequestData = {
      email: 'test@example.com',
      displayName: 'Test User',
      phoneNumber: '1234567890',
      departmentId: 'deptId',
      role: 'user',
    };
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify(mockRequestData),
    });

    const res = await POST(req, {} as any);

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.message).toBe('User created successfully');
  });

  it('should return 500 if an error occurs', async () => {
    mockHeaders.get.mockReturnValue('Bearer fakeToken');
    (admin.auth().verifyIdToken as jest.Mock).mockRejectedValue(new Error('Invalid token'));

    const req = new Request('http://localhost', { method: 'POST' });
    const res = await POST(req, {} as any);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.message).toContain('Error creating user: Invalid token');
  });
});
