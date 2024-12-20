import admin from '@/lib/firebaseAdmin';
import {NextApiResponse} from 'next';
import {headers} from 'next/headers';
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

    const idToken = headers().get('authorization')?.split(' ')[1];

    if (!idToken) {
        return new Response(JSON.stringify({message: idToken}), {status: 401});
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;
        const companyId = decodedToken.companyId;

        if (!companyId) {
            return new Response(
                JSON.stringify({
                    message: 'Access denied. No company association found.',
                }),
                {status: 403},
            );
        }
        const comapnyRef = admin.firestore().doc(`/Company/${companyId}`);
        const companyDoc = await comapnyRef.get();

        if (!companyDoc.exists) {
            return new Response(
                JSON.stringify({message: 'Company not found'}),
                {status: 404},
            );
        }

        const admins: FirebaseFirestore.DocumentReference[] | undefined =
            companyDoc.data()?.admins;
        const userRef = admin
            .firestore()
            .doc(`/Company/${companyId}/Employees/${uid}`);

        const isAdmin = admins?.some(adminRef => adminRef.isEqual(userRef));
        if (!admins || !isAdmin) {
            return new Response(
                JSON.stringify({
                    message: 'Access denied. User is not an admin.',
                }),
                {status: 403},
            );
        }

        const {email, displayName, phoneNumber, departmentId, role} =
            (await req.json()) as {
                email: string;
                displayName: string;
                phoneNumber?: string;
                departmentId: string;
                role: string;
            };
        const departments = [
            admin
                .firestore()
                .doc(`/Company/${companyId}/Departments/${departmentId}`),
        ];

        const userRecord = await admin.auth().createUser({
            email,
            displayName,
            phoneNumber,
            emailVerified: false,
        });
        await admin.auth().setCustomUserClaims(userRecord.uid, {companyId});

        const employee = admin
            .firestore()
            .doc(`/Company/${companyId}/Employees/${userRecord.uid}`);

        const resetLink = await admin.auth().generatePasswordResetLink(email);

        await admin
            .firestore()
            .collection(`/Company/${companyId}/Employees`)
            .doc(userRecord.uid)
            .set({
                email,
                name: displayName,
                phoneNumber,
                departments,
                role,
                companyId,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });

        departments[0].update({
            users: admin.firestore.FieldValue.arrayUnion(employee),
        });

        await sendResetEmail(email, resetLink, true);

        return new Response(
            JSON.stringify({message: 'User created successfully'}),
            {status: 201, headers: {'Content-Type': 'application/json'}},
        );
    } catch (error) {
        const errorMessage = (error as Error).message;
        return new Response(
            JSON.stringify({message: `Error creating user: ${errorMessage}`}),
            {status: 500, headers: {'Content-Type': 'application/json'}},
        );
    }
}
