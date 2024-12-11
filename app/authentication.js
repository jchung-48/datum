import {
    signInWithEmailAndPassword,
    signOut,
    updatePhoneNumber,
    PhoneAuthProvider,
    RecaptchaVerifier,
} from 'firebase/auth';
import {doc, getDoc, collection, getDocs, updateDoc} from 'firebase/firestore';
import {auth, db} from '@/lib/firebaseClient.ts';

// get all deparments from the department feild of a company
export const getDepartments = async companyId => {
    try {
        const departmentsRef = collection(
            db,
            `Company/${companyId}/Departments`,
        );
        const departmentsSnapshot = await getDocs(departmentsRef);

        const departments = departmentsSnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name,
        }));

        return departments;
    } catch (error) {
        console.error('Error fetching departments:', error);
        throw error;
    }
};
// get all the departments from the departments field of a user. these are the users allowed departments
export const getUserDepartments = async userData => {
    try {
        const departmentRefs = userData.departments;
        const firstDepartmentRef = departmentRefs[0];
        const departmentSnap = await getDoc(firstDepartmentRef);
        const departmentData = departmentSnap.data();
        console.log(departmentData);
        return departmentData;
    } catch (error) {
        console.error('Error fetching departments for user:', error);
        throw error;
    }
};
// funciton to get all companies. just Datum in our case 
export const getCompanies = async () => {
    try {
        const companiesRef = collection(db, 'Company/');
        const companiesSnapshot = await getDocs(companiesRef);

        const companies = companiesSnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name,
        }));

        return companies;
    } catch (error) {
        console.error('Error fetching companies:', error);
        throw error;
    }
};
// sign in a user with firebase auth
export const signInUser = async (email, password, companyId) => {
    try {
        const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password,
        );
        const user = userCredential.user;

        const userDocRef = doc(db, `Company/${companyId}/Employees`, user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            throw new Error('No user found for the given company.');
        }

        const userData = userDoc.data();
        console.log('Sign in successful');
        return userData;
    } catch (error) {
        console.error('Error signing in:', error);
        throw error;
    }
};
// send verification code
export const sendVerificationCode = async phoneNumber => {
    if (!phoneNumber) {
        console.error('Please enter a phone number.');
        return;
    }
    try {
        const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            size: 'invisible',
        });
        const provider = new PhoneAuthProvider(auth);
        const verificationId = await provider.verifyPhoneNumber(
            phoneNumber,
            verifier,
        );
        return verificationId;
    } catch (error) {
        console.error(error);
        return '';
    }
};
// phone verification 
export const verifyAndUpdatePhoneNumber = async (
    verificationCode,
    verificationId,
) => {
    if (!verificationCode || !verificationId) {
        console.error('set OTP!');
        return;
    }
    try {
        const credential = PhoneAuthProvider.credential(
            verificationId,
            verificationCode,
        );
        const user = auth.currentUser;
        if (user) {
            await updatePhoneNumber(user, credential);
        }
        console.log(user.phoneNumber);
        const companyId = (await user.getIdTokenResult()).claims.companyId;
        const docRef = doc(db, `/Company/${companyId}/Employees`, user.uid);
        await updateDoc(docRef, {
            phoneNumber: user.phoneNumber,
        });
        alert('Phone number update');
    } catch (error) {
        console.error('Error verifying OTP:', error);
    }
};
// reset the password
export const resetPassword = async email => {
    try {
        const response = await fetch('/api/resetPass', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
            }),
        });
        if (response.ok) {
            const data = await response.json();
            console.log(`${data.message}`);
            alert('Reset link sent to your email!');
        } else {
            const errorData = await response.json();
            console.error(errorData.message || 'Failed to create user');
        }
    } catch (error) {
        console.error('Error reseting password');
    }
};
// change the display name
export const changeDisplayName = async newDisplayName => {
    const user = auth.currentUser;
    try {
        user.updateProfile({
            displayName: newDisplayName,
        })
            .then(() => {
                console.log('Display name updated successfully!');
            })
            .catch(error => {
                console.error('Error updating display name:', error);
            });

        const companyId = (await user.getIdTokenResult()).claims.companyId;
        const docRef = doc(db, `/Company/${companyId}/Employees`, user.uid);
        await updateDoc(docRef, {
            name: newDisplayName,
        });
    } catch (error) {
        console.error('Error changing name: ', error);
    }
};
// logout user
export const logoutUser = async () => {
    try {
        await signOut(auth);
        console.log('User signed out successfully');
    } catch (error) {
        console.error('Error signing out: ', error);
    }
};
// function to get the employee information
export const getEmployeeProfile = async uid => {
    try {
        const employeeRef = doc(
            db,
            'Company/mh3VZ5IrZjubXUCZL381/Employees',
            uid,
        );
        const employeeSnap = await getDoc(employeeRef);

        if (!employeeSnap.exists()) {
            throw new Error('Employee does not exist');
        }

        const employeeData = employeeSnap.data();
        console.log(employeeData.phoneNumber);
        return {
            name: employeeSnap.data().name,
            companyName: employeeSnap.data().companyName,
            email: employeeSnap.data().email,
            phoneNumber: employeeSnap.data().phoneNumber,
            role: employeeSnap.data().role,
            createdAt: employeeData.createdAt
                ? employeeData.createdAt.toDate().toDateString()
                : null,
            departments: employeeData.departments || [],
        };
    } catch (error) {
        console.error('Error fetching employee profile:', error);
        throw error;
    }
};

/// fast get departments
export const getUserDepartmentsNew = async userData => {
    try {
        const departmentRefs = userData.departments;
        const departmentNames = [];

        for (const ref of departmentRefs) {
            const departmentSnap = await getDoc(ref);
            if (departmentSnap.exists()) {
                const departmentData = departmentSnap.data();
                departmentNames.push(departmentData.name);
            }
        }
        console.log(departmentNames);
        return departmentNames;
    } catch (error) {
        console.error('Error fetching departments for user:', error);
        throw error;
    }
};
