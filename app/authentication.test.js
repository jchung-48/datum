// authentication.test.js
import { 
    getDepartments, 
    getCompanies, 
    signInUser, 
    sendVerificationCode, 
    logoutUser, 
    getEmployeeProfile 
  } from '../app/authentication';
  
  import { auth, db } from '@/lib/firebaseClient'; // Mocked Firebase imports
  import { collection, doc, getDocs, getDoc } from "firebase/firestore";
  import { signInWithEmailAndPassword, signOut, PhoneAuthProvider } from "firebase/auth";
  
  // Mock Firebase methods
  jest.mock('@/lib/firebaseClient', () => ({
    auth: {
      currentUser: { uid: 'testUid' },
      settings: {}
    },
    db: {}
  }));
  
  jest.mock('firebase/firestore', () => ({
    collection: jest.fn(),
    doc: jest.fn(),
    getDocs: jest.fn(),
    getDoc: jest.fn()
  }));
  
  jest.mock('firebase/auth', () => ({
    signInWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    PhoneAuthProvider: {
      credential: jest.fn(),
      verifyPhoneNumber: jest.fn()
    },
    RecaptchaVerifier: jest.fn(() => ({
      verify: jest.fn()
    }))
  }));
  
  describe('Authentication library', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    describe('getDepartments', () => {
      it('should fetch departments from Firestore', async () => {
        const mockDepartments = [
          { id: 'dep1', data: () => ({ name: 'HR' }) },
          { id: 'dep2', data: () => ({ name: 'Engineering' }) }
        ];
        getDocs.mockResolvedValue({ docs: mockDepartments });
  
        const companyId = 'testCompany';
        const departments = await getDepartments(companyId);
  
        expect(collection).toHaveBeenCalledWith(db, `Company/${companyId}/Departments`);
        expect(departments).toEqual([
          { id: 'dep1', name: 'HR' },
          { id: 'dep2', name: 'Engineering' }
        ]);
      });
  
      it('should throw an error if fetching departments fails', async () => {
        getDocs.mockRejectedValue(new Error('Firestore error'));
  
        await expect(getDepartments('testCompany')).rejects.toThrow('Firestore error');
      });
    });
  
    describe('signInUser', () => {
      it('should sign in the user and fetch their data', async () => {
        const mockUserCredential = { user: { uid: 'testUid' } };
        signInWithEmailAndPassword.mockResolvedValue(mockUserCredential);
  
        const mockUserDoc = {
          exists: jest.fn(() => true),
          data: jest.fn(() => ({ name: 'Test User' }))
        };
        getDoc.mockResolvedValue(mockUserDoc);
  
        const userData = await signInUser('test@example.com', 'password123', 'testCompany');
  
        expect(signInWithEmailAndPassword).toHaveBeenCalledWith(auth, 'test@example.com', 'password123');
        expect(doc).toHaveBeenCalledWith(db, `Company/testCompany/Employees`, 'testUid');
        expect(userData).toEqual({ name: 'Test User' });
      });
  
      it('should throw an error if no user document is found', async () => {
        const mockUserCredential = { user: { uid: 'testUid' } };
        signInWithEmailAndPassword.mockResolvedValue(mockUserCredential);
  
        getDoc.mockResolvedValue({ exists: jest.fn(() => false) });
  
        await expect(signInUser('test@example.com', 'password123', 'testCompany')).rejects.toThrow('No user found for the given company.');
      });
    });
  
    describe('sendVerificationCode', () => {
      it('should send a verification code to the phone number', async () => {
        PhoneAuthProvider.verifyPhoneNumber.mockResolvedValue('testVerificationId');
        const phoneNumber = '+1234567890';
  
        const verificationId = await sendVerificationCode(phoneNumber);
  
        expect(PhoneAuthProvider.verifyPhoneNumber).toHaveBeenCalledWith(phoneNumber, expect.any(Object));
        expect(verificationId).toBe('testVerificationId');
      });
  
      it('should return an empty string if phone number is not provided', async () => {
        const verificationId = await sendVerificationCode('');
        expect(verificationId).toBe('');
      });
    });
  
    describe('logoutUser', () => {
      it('should sign out the current user', async () => {
        signOut.mockResolvedValue();
  
        await logoutUser();
  
        expect(signOut).toHaveBeenCalledWith(auth);
      });
  
      it('should log an error if sign out fails', async () => {
        const error = new Error('Sign out error');
        signOut.mockRejectedValue(error);
  
        await expect(logoutUser()).rejects.toThrow('Sign out error');
      });
    });
  
    describe('getEmployeeProfile', () => {
      it('should fetch the employee profile from Firestore', async () => {
        const mockEmployeeDoc = {
          exists: jest.fn(() => true),
          data: jest.fn(() => ({
            name: 'John Doe',
            email: 'john@example.com',
            phoneNumber: '+1234567890',
            role: 'Developer',
            companyName: 'TestCompany',
            createdAt: { toDate: () => new Date('2024-01-01') },
            departments: []
          }))
        };
        getDoc.mockResolvedValue(mockEmployeeDoc);
  
        const profile = await getEmployeeProfile('testUid');
  
        expect(doc).toHaveBeenCalledWith(db, 'Company/mh3VZ5IrZjubXUCZL381/Employees', 'testUid');
        expect(profile).toEqual({
          name: 'John Doe',
          email: 'john@example.com',
          phoneNumber: '+1234567890',
          role: 'Developer',
          companyName: 'TestCompany',
          createdAt: 'Mon Jan 01 2024',
          departments: []
        });
      });
  
      it('should throw an error if employee does not exist', async () => {
        getDoc.mockResolvedValue({ exists: jest.fn(() => false) });
  
        await expect(getEmployeeProfile('testUid')).rejects.toThrow('Employee does not exist');
      });
    });
  });  