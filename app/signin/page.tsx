'use client';
import {useSearchParams, useRouter} from 'next/navigation';
import React from 'react';
import {useState, useEffect} from 'react';
import styles from './styles.module.css';
import {auth, db} from '@/lib/firebaseClient';
import {signInUser, getUserDepartments, resetPassword} from '../authentication';
import {doc, getDoc} from 'firebase/firestore';

const Page = () => {
    const searchParams = useSearchParams(); // Get access to the search parameters (query parameters)
    const workplaceId = searchParams.get('workplaceId'); // Get the companyId from query parameters
    const firestoreIdPattern = /^[a-zA-Z0-9]{20}$/; // regex pattern for firestore IDs
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

   /**
 * useEffect for Department Redirection Based on Authentication State
 * 
 * This effect sets up an authentication state listener using Firebase's `onAuthStateChanged` method. 
 * When a user is authenticated, it retrieves the user's company ID and navigates them to their 
 * department's page based on the department's URL. 
 * If the user is not authenticated and the `workplaceId` is invalid, it redirects the user to 
 * the `/workplaces` page for error handling.
 */
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async user => {
            if (user) {
                // Fetch company ID and navigate the user to their department's page
                const companyId = (await user.getIdTokenResult()).claims
                    .companyId as string;
                const employeeRef = doc(
                    db,
                    'Company',
                    companyId,
                    'Employees',
                    user.uid,
                );
                const emSnap = await getDoc(employeeRef);
                if (emSnap.exists()) {
                    const depRef = emSnap.get('departments')[0];
                    const depSnap = await getDoc(depRef);
                    if (depSnap.exists()) {
                        const url = depSnap.get('URL');
                        router.push(`/${url}`);
                    }
                }
            } else if (!workplaceId || !firestoreIdPattern.test(workplaceId)) {
                router.push('/workplaces'); // Redirect to an error page if validation fails
            }
        });

        return () => unsubscribe();
    }, [workplaceId, router]);

    // Clear error message after 3 seconds
    useEffect(() => {
        if (errorMessage) {
            const timer = setTimeout(() => {
                setErrorMessage(''); 
            }, 3000);

            return () => clearTimeout(timer); 
        }
        return undefined;
    }, [errorMessage]);

    /**
 * handleSignIn
 * 
 * Inputs: {void} None
 * Returns: {Promise<void>} - A promise that resolves when the sign-in process completes.
 * 
 * Handles the user sign-in process by calling the `signInUser` function with the provided email, 
 * password, and workplace ID. Upon successful sign-in, it fetches the user's department data 
 * and navigates the user to their department's URL. If an error occurs, it sets a specific 
 * error message based on the error type and clears it after a delay.
 * 
 * Error Handling:
 * - "Company name does not match.": Displays a corresponding error message.
 * - "No user found for the given company.": Displays a corresponding error message.
 * - Other errors: Displays a generic error message with the error details.
 */
    const handleSignIn = async () => {
        try {
            const userData = await signInUser(email, password, workplaceId);

            const department = await getUserDepartments(userData);
            router.push(`/${department.URL}`);
        } catch (error: any) {
            if (error.message === 'Company name does not match.') {
                setErrorMessage('Company name does not match.');
            } else if (
                error.message === 'No user found for the given company.'
            ) {
                setErrorMessage('No user found for the given company.');
            } else {
                setErrorMessage('Error signing in: ' + error.message);
            }
        }

        setTimeout(() => {
            setErrorMessage('');
        }, 3000);
    };

    return (
        <div className={styles.pageContainer}>
            <div className={styles.topLeftCircle}></div>
            <div className={styles.bottomRightCircle}></div>
            <div className={styles.boxContainer}>
                <div className={styles.box}>
                    <h1 className={styles.login}>Login</h1>
                    <h3 className={styles.loginWords}>
                        Please login to continue
                    </h3>
                    <input
                        className={styles.email}
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />
                    <input
                        className={styles.password}
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                    <button className={styles.submit} onClick={handleSignIn}>
                        Sign In
                    </button>
                    {errorMessage && (
                        <p style={{color: 'red', marginTop: '10px'}}>
                            {errorMessage}
                        </p>
                    )}
                </div>
                <div className={styles.boxRight}>
                    <div className={styles.triangleRight}></div>
                    <div className={styles.circle}></div>
                    <div className={styles.circle2}></div>
                    <h1 className={styles.new}>New Here?</h1>
                    <h2 className={styles.datum}>Join Datum today!</h2>
                </div>
            </div>
        </div>
    );
};

export default Page;
