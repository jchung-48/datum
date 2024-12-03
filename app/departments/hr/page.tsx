'use client'; // Mark as a Client Component

import React, {useState} from 'react';
import {FileList} from '@/app/Utilities/ListFiles/listFiles';
import UploadComponent from '@/app/Utilities/Upload/uploadComponent';
import AIButton from '@/app/aiAddon/aiButton';
import SearchBar from '@/app/Utilities/SearchBar/searchBar';
import Header from '@/app/Utilities/Header/header';
import deptStyles from '../departments.module.css';
import FileTitle from '@/app/Utilities/FileTitle/fileTitle';

const hrDepartment: React.FC = () => {
    const styles = {...deptStyles};
    // Constants for the companyId and departmentId used for Firestore
    const COMPANYID = 'mh3VZ5IrZjubXUCZL381';
    const DEPARTMENTID = 'NpaV1QtwGZ2MDNOGAlXa'; // Correct HR department ID

    // States for uploading files
    const [fileListUpdated, setFileListUpdated] = useState(false);



    // Paths for the FileList components
    const deptFilesPath = [
        'Company',
        COMPANYID,
        'Departments',
        DEPARTMENTID,
        'files',
    ] as [string, ...string[]];

    const incidentFilesPath = [
        'Company',
        COMPANYID,
        'Departments',
        DEPARTMENTID,
        'incident',
    ] as [string, ...string[]];

    return (
        <div className={styles.page}>
            <Header department="Human Resources" isProfile={false} />
            <div className={styles.body}>
                <div className={styles.topComponentContainer}>
                    <UploadComponent
                        companyId={COMPANYID}
                        departmentId={DEPARTMENTID}
                        departmentName="HumanResources"
                        collections={['files', 'incident']}
                        onUploadSuccess={() =>
                            setFileListUpdated(prev => !prev)
                        }
                    />
                    <div className={styles.search}>
                        <SearchBar paths={['NpaV1QtwGZ2MDNOGAlXa']} />
                    </div>
                </div>
                <div className={styles.files}>
                    <FileTitle title="Department Files" />
                    <FileList
                        collectionPath={deptFilesPath}
                        title=""
                        onSearch={() => {}}
                        horizontal
                        refreshTrigger={fileListUpdated}
                        enableShare={true}
                    />
                    <FileTitle title="Incident Files" />
                    <FileList
                        collectionPath={incidentFilesPath}
                        title=""
                        onSearch={() => {}}
                        horizontal
                        refreshTrigger={fileListUpdated}
                        enableShare={true}
                    />
                </div>
                <div className={styles.aiFeatures}>
                    <AIButton paths={['NpaV1QtwGZ2MDNOGAlXa']} />
                </div>
            </div>
        </div>
    );
};

export default hrDepartment;
