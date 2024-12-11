'use client';
import React, {useEffect, useState} from 'react';
import {
    getEmployeeProfile,
    getUserDepartmentsNew,
    resetPassword,
    sendVerificationCode,
    verifyAndUpdatePhoneNumber,
} from '../authentication';
import {auth} from '@/lib/firebaseClient';
import {onAuthStateChanged} from 'firebase/auth';
import {useRouter} from 'next/navigation';
import './profile.modules.css';
import {logoutUser} from '../authentication';
import deptStyles from '../departments/departments.module.css';
import Header from '@/app/Utilities/Header/header';
import {FaUserCircle} from 'react-icons/fa';

export default function ProfilePage() {
    const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
    const [departments, setDepartments] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [verificationId, setVerificationId] = useState('');
    const router = useRouter();
    const [errorMessage, setErrorMessage] = useState('');
    const [isSignedIn, setIsSignedIn] = useState(false);
    const styles = {...deptStyles};

    //EmployeeData type
    type EmployeeData = {
        name: string;
        companyName: string;
        email: string;
        phoneNumber: string;
        role: string;
        createdAt: string;
        departments?: string[];
    };

    /**
 * useEffect for Authentication State Listener
 * 
 * This effect sets up an authentication state listener using Firebase's `onAuthStateChanged` method. 
 * It monitors the authentication state of the current user and updates the `isSignedIn` state 
 * based on whether a user is signed in or not. The listener is unsubscribed when the component 
 * unmounts to avoid memory leaks.
 */
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async user => {
            setIsSignedIn(Boolean(user));
        });
        return () => unsubscribe();
    }, []);

    /**
 * handleSignOut
 * 
 * @param {void} None
 * @returns {Promise<void>} - A promise that resolves once the user is signed out and redirected.
 * 
 * Signs the user out by calling the `logoutUser` function and then redirects them to the 
 * '/workplaces' route using the router. Ensures the user session is terminated and navigation 
 * occurs seamlessly.
 */
    const handleSignOut = async () => {
        await logoutUser();
        router.push('/workplaces');
    };

    // clear error message after time
    useEffect(() => {
        if (errorMessage) {
            const timer = setTimeout(() => {
                setErrorMessage(''); 
            }, 5000);

            return () => clearTimeout(timer); 
        }
        return undefined;
    }, [errorMessage]);


    /**
 * useEffect for Employee Data Fetching
 * 
 * This effect sets up an authentication state listener using Firebase's `onAuthStateChanged` method. 
 * When a user is authenticated, it attempts to fetch the user's profile and department data. 
 * If successful, the data is stored in state variables (`employeeData` and `departments`). 
 * If the user is not authenticated or an error occurs during data fetching, appropriate error 
 * handling is performed. The listener is unsubscribed when the component unmounts to avoid memory leaks.
 */
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async user => {
            if (user) {
                try {
                    const data = await getEmployeeProfile(user.uid);
                    setEmployeeData(data);
                    if (data.departments && data.departments.length > 0) {
                        const departmentNames =
                            await getUserDepartmentsNew(data);
                        setDepartments(departmentNames);
                    }
                } catch (err) {
                    setError('Error fetching profile data');
                    console.error('Error fetching employee profile:', err);
                } finally {
                    setLoading(false);
                }
            } else {
                setError('User not authenticated.');
                router.push('/login');
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, [router]);

    if (loading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    if (!employeeData) {
        return <p>No employee data available.</p>;
    }

    /**
 * handleVerificationCode
 * 
 * @param {void} None
 * @returns {Promise<void>} - A promise that resolves when the verification ID is successfully set.
 * 
 * Sends a verification code to the provided phone number by calling the `sendVerificationCode` function. 
 * If the verification ID is successfully received, it updates the state variable `verificationId` with 
 * the received ID for further use in the authentication process.
 */
    const handleVerificationCode = async () => {
        const verId = await sendVerificationCode(phoneNumber);
        if (verId) {
            setVerificationId(verId);
        }
    };

    return (
        <div>
            <Header isProfile={true} />
            <div className="profile-layout">
                <div className="side-by-side">
                    <div className="profile-card">
                        <FaUserCircle className="profile-img" />
                        <h1 className="name">{employeeData.name}</h1>
                        <h2 className="company">Datum Employee</h2>
                        <h2 className="company">
                            Joined {employeeData.createdAt}
                        </h2>
                    </div>

                    <div className="info-section">
                        <div className="info-card">
                            <div className="info-row">
                                <span className="info-title">Name:</span>
                                <span className="info-value">
                                    {employeeData.name}
                                </span>
                            </div>
                            <div className="info-row">
                                <span className="info-title">Email:</span>
                                <span className="info-value">
                                    {employeeData.email}
                                </span>
                            </div>
                            <div className="info-row">
                                <span className="info-title">Phone:</span>
                                <span className="info-value">
                                    {employeeData.phoneNumber}
                                </span>
                            </div>
                        </div>

                        <div className="dept-card">
                            <h2>Authorized Departments</h2>
                            <p>
                                {departments.length > 0
                                    ? departments.join(', ')
                                    : 'None'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="resetting-stuff">
                <div className="reset-container">
                    <button className="change-password-btn" onClick={() => resetPassword(employeeData.email)}>
                        Reset Password
                    </button>
                </div>

                <div className="update-phone-section">
                    <div className="input-group">
                        <input
                            type="text"
                            placeholder="enter phone number"
                            value={phoneNumber}
                            onChange={e => setPhoneNumber(e.target.value)}
                            className="phone-number"
                            style={{color: 'black'}}
                        />
                        <button onClick={handleVerificationCode}>
                            Send Code
                        </button>
                    </div>

                    {verificationId && (
                        <div className="input-group">
                            <input
                                type="text"
                                placeholder="Enter verification code"
                                value={verificationCode}
                                onChange={e =>
                                    setVerificationCode(e.target.value)
                                }
                                className="verification-code"
                                style={{color: 'black'}}
                            />
                            <button
                                onClick={() =>
                                    verifyAndUpdatePhoneNumber(
                                        verificationCode,
                                        verificationId,
                                    )
                                }
                            >
                                Verify and Update
                            </button>
                        </div>
                    )}

                    <div id="recaptcha-container"></div>
                    {errorMessage && (
                        <p className="error-message">{errorMessage}</p>
                    )}
                </div>
            </div>

            <div className="sign-out-container">
                {isSignedIn && (
                    <button
                        className="sign-out"
                        onClick={handleSignOut}
                        style={{marginTop: '20px'}}
                    >
                        Sign Out
                    </button>
                )}
            </div>
        </div>
    );
}
